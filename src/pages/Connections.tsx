import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, X, Clock, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BottomNavigation from '@/components/BottomNavigation';

interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  created_at: string;
  profile: {
    username: string;
    display_name: string;
    bio: string;
    avatar_url: string | null;
  };
  shared_interests: Array<{
    name: string;
    icon: string;
  }>;
}

const Connections = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [incomingRequests, setIncomingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [acceptedConnections, setAcceptedConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user]);

  const fetchConnections = async () => {
    if (!user) return;

    try {
      // Fetch all connections involving the user
      const { data: connections, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching connections:', error);
        return;
      }

      // Get all unique user IDs from connections
      const allUserIds = [...new Set(connections?.flatMap(conn => [conn.requester_id, conn.receiver_id]) || [])]
        .filter(id => id !== user.id);

      // Fetch profiles for all users
      const { data: allProfiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, bio, avatar_url')
        .in('user_id', allUserIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }

      const profileMap = new Map(allProfiles?.map(p => [p.user_id, p]) || []);

      // Separate connections by type and status
      const incoming: Connection[] = [];
      const sent: Connection[] = [];
      const accepted: Connection[] = [];

      for (const conn of connections || []) {
        const isRequester = conn.requester_id === user.id;
        const otherUserId = isRequester ? conn.receiver_id : conn.requester_id;
        const profile = profileMap.get(otherUserId);

        if (!profile) continue;

        // Get shared interests for this connection
        const { data: sharedInterests } = await supabase
          .from('user_interests')
          .select(`
            interest:interests(name, icon)
          `)
          .eq('user_id', otherUserId)
          .in('interest_id', 
            (await supabase
              .from('user_interests')
              .select('interest_id')
              .eq('user_id', user.id)
            ).data?.map(ui => ui.interest_id) || []
          );

        const connectionWithDetails: Connection = {
          ...conn,
          status: conn.status as 'pending' | 'accepted' | 'rejected' | 'blocked',
          profile,
          shared_interests: sharedInterests?.map(si => si.interest) || []
        };

        if (conn.status === 'accepted') {
          accepted.push(connectionWithDetails);
        } else if (conn.status === 'pending') {
          if (isRequester) {
            sent.push(connectionWithDetails);
          } else {
            incoming.push(connectionWithDetails);
          }
        }
      }

      setIncomingRequests(incoming);
      setSentRequests(sent);
      setAcceptedConnections(accepted);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionResponse = async (connectionId: string, status: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update connection"
        });
        return;
      }

      toast({
        title: status === 'accepted' ? "Connection Accepted" : "Connection Rejected",
        description: `Connection request ${status}!`
      });

      fetchConnections();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update connection"
      });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-bg pb-20">
      <header className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold">Connections</h1>
        </div>
      </header>

      <main className="px-4 max-w-2xl mx-auto">
        <Tabs defaultValue="accepted" className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass">
            <TabsTrigger value="accepted">
              Connections ({acceptedConnections.length})
            </TabsTrigger>
            <TabsTrigger value="incoming">
              Incoming ({incomingRequests.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentRequests.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accepted" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading connections...</div>
            ) : acceptedConnections.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Connections Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start discovering people with shared interests to build your network!
                </p>
                <Button onClick={() => navigate('/discovery')}>
                  Discover People
                </Button>
              </div>
            ) : (
              acceptedConnections.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      {connection.profile?.avatar_url && (
                        <AvatarImage src={connection.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {connection.profile?.display_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">{connection.profile?.display_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        @{connection.profile?.username}
                      </p>
                      {connection.profile?.bio && (
                        <p className="text-sm mt-2">{connection.profile.bio}</p>
                      )}
                      {connection.shared_interests.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {connection.shared_interests.slice(0, 3).map((interest, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {interest.icon} {interest.name}
                            </Badge>
                          ))}
                          {connection.shared_interests.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{connection.shared_interests.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          onClick={() => navigate('/messages', { state: { recipientId: connection.requester_id === user?.id ? connection.receiver_id : connection.requester_id } })}
                        >
                          Message
                        </Button>
                      </div>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="incoming" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading requests...</div>
            ) : incomingRequests.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Incoming Requests</h3>
                <p className="text-muted-foreground">
                  When people want to connect with you, their requests will appear here.
                </p>
              </div>
            ) : (
              incomingRequests.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      {connection.profile?.avatar_url && (
                        <AvatarImage src={connection.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {connection.profile?.display_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{connection.profile?.display_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          @{connection.profile?.username}
                        </p>
                        {connection.profile?.bio && (
                          <p className="text-sm mt-2">{connection.profile.bio}</p>
                        )}
                        {connection.shared_interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 mb-4">
                            {connection.shared_interests.slice(0, 3).map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest.icon} {interest.name}
                              </Badge>
                            ))}
                            {connection.shared_interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{connection.shared_interests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleConnectionResponse(connection.id, 'accepted')}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleConnectionResponse(connection.id, 'rejected')}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading sent requests...</div>
            ) : sentRequests.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Sent Requests</h3>
                <p className="text-muted-foreground">
                  Connection requests you send will appear here while pending.
                </p>
              </div>
            ) : (
              sentRequests.map((connection) => (
                <Card key={connection.id}>
                  <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      {connection.profile?.avatar_url && (
                        <AvatarImage src={connection.profile.avatar_url} />
                      )}
                      <AvatarFallback>
                        {connection.profile?.display_name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold">{connection.profile?.display_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          @{connection.profile?.username}
                        </p>
                        <Badge variant="outline" className="mt-2">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                        {connection.shared_interests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {connection.shared_interests.slice(0, 3).map((interest, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {interest.icon} {interest.name}
                              </Badge>
                            ))}
                            {connection.shared_interests.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{connection.shared_interests.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Connections;