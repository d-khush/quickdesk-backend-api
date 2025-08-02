import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, TicketIcon, Users, Settings, LogOut } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  role: 'user' | 'agent' | 'admin';
}

interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  upvotes: number;
  categories: { name: string } | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    fetchTickets();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }
    
    setUser(user);
    
    // Fetch user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    setProfile(profile);
    setLoading(false);
  };

  const fetchTickets = async () => {
    const { data } = await supabase
      .from("tickets")
      .select(`
        id,
        subject,
        description,
        status,
        created_at,
        upvotes,
        categories(name)
      `)
      .order("created_at", { ascending: false })
      .limit(5);
    
    setTickets(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800";
      case "in_progress": return "bg-yellow-100 text-yellow-800";
      case "resolved": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">QuickDesk</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {profile?.name}
            </span>
            <Badge variant="secondary">
              {profile?.role}
            </Badge>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/tickets/new")}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Create Ticket</CardTitle>
              <Plus className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <CardDescription>Submit a new support request</CardDescription>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/tickets")}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">View Tickets</CardTitle>
              <TicketIcon className="h-4 w-4 ml-auto" />
            </CardHeader>
            <CardContent>
              <CardDescription>Browse all support tickets</CardDescription>
            </CardContent>
          </Card>

          {(profile?.role === 'admin' || profile?.role === 'agent') && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate("/admin")}>
              <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Admin Panel</CardTitle>
                <Settings className="h-4 w-4 ml-auto" />
              </CardHeader>
              <CardContent>
                <CardDescription>Manage tickets and users</CardDescription>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
            <CardDescription>Your latest support tickets</CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tickets found. Create your first ticket to get started!
              </p>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{ticket.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {ticket.description.substring(0, 100)}...
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status}
                        </Badge>
                        {ticket.categories && (
                          <Badge variant="outline">
                            {ticket.categories.name}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {ticket.upvotes} upvotes
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;