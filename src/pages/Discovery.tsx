import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Heart, X, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NearbyUser {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  shared_interests: Array<{
    name: string;
    icon: string;
    category: string;
  }>;
}

const Discovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userInterests } = useProfile();
  const { toast } = useToast();
  const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchNearbyUsers();
    }
  }, [user, userInterests]);

  const fetchNearbyUsers = async () => {
    if (!user || userInterests.length === 0) {
      setLoading(false);
      return;
    }

    try {
      // Get users with shared interests (simplified - in real app would use location)
      const userInterestIds = userInterests.map(ui => ui.interest_id);
      
      const { data: potentialMatches, error } = await supabase
        .from('user_interests')
        .select(`
          user_id,
          interest:interests(name, icon, category)
        `)
        .in('interest_id', userInterestIds)
        .neq('user_id', user.id);

      if (error) {
        console.error('Error fetching potential matches:', error);
        return;
      }

      // Get profiles separately to avoid relation issues
      const uniqueUserIds = [...new Set(potentialMatches?.map(m => m.user_id) || [])];
      
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, bio')
        .in('user_id', uniqueUserIds);

      if (profileError) {
        console.error('Error fetching profiles:', profileError);
        return;
      }

      // Create profile lookup
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Group by user and calculate shared interests
      const userMap = new Map<string, NearbyUser>();
      
      potentialMatches?.forEach((match) => {
        const profile = profileMap.get(match.user_id);
        if (!profile) return;
        
        const userId = match.user_id;
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: profile.id,
            username: profile.username || 'Anonymous',
            display_name: profile.display_name || 'User',
            bio: profile.bio || '',
            shared_interests: []
          });
        }
        
        const user = userMap.get(userId)!;
        user.shared_interests.push({
          name: match.interest.name,
          icon: match.interest.icon || '',
          category: match.interest.category
        });
      });

      // Filter out users with existing connections
      const { data: existingConnections } = await supabase
        .from('connections')
        .select('receiver_id, requester_id')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`);

      const connectedUserIds = new Set(
        existingConnections?.flatMap(conn => [conn.requester_id, conn.receiver_id]) || []
      );

      const filteredUsers = Array.from(userMap.values())
        .filter(u => !connectedUserIds.has(u.id))
        .filter(u => u.shared_interests.length >= 2); // At least 2 shared interests

      setNearbyUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!user || currentUserIndex >= nearbyUsers.length) return;

    const targetUser = nearbyUsers[currentUserIndex];
    
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: targetUser.id,
          status: 'pending'
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to send connection request"
        });
        return;
      }

      toast({
        title: "Connection Sent",
        description: `Connection request sent to ${targetUser.display_name}!`
      });

      nextUser();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send connection request"
      });
    }
  };

  const nextUser = () => {
    setCurrentUserIndex(prev => prev + 1);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (userInterests.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b">
          <div className="container mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Discover People</h1>
          </div>
        </header>

        <main className="container mx-auto px-4 py-16 text-center max-w-md">
          <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-4">Setup Your Interests First</h2>
          <p className="text-muted-foreground mb-6">
            Add some interests to your profile to discover people with similar passions nearby.
          </p>
          <Button onClick={() => navigate('/profile-setup')}>
            Setup Profile
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Discover People</h1>
          <div className="flex items-center gap-2 ml-auto">
            <MapPin className="h-4 w-4" />
            <span className="text-sm text-muted-foreground">Nearby</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Finding people with shared interests...</p>
          </div>
        ) : currentUserIndex >= nearbyUsers.length ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">No More People Nearby</h2>
            <p className="text-muted-foreground mb-6">
              You've seen everyone with shared interests in your area. Check back later for new people!
            </p>
            <Button onClick={() => navigate('/')}>
              Go Home
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {currentUserIndex + 1} of {nearbyUsers.length}
              </p>
            </div>

            <Card className="w-full">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    <AvatarFallback className="text-2xl">
                      {nearbyUsers[currentUserIndex]?.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">
                    {nearbyUsers[currentUserIndex]?.display_name}
                  </h2>
                  <p className="text-muted-foreground">
                    @{nearbyUsers[currentUserIndex]?.username}
                  </p>
                </div>

                {nearbyUsers[currentUserIndex]?.bio && (
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground">
                      {nearbyUsers[currentUserIndex].bio}
                    </p>
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="font-semibold mb-3">
                    Shared Interests ({nearbyUsers[currentUserIndex]?.shared_interests.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {nearbyUsers[currentUserIndex]?.shared_interests.map((interest, index) => (
                      <Badge key={index} variant="secondary">
                        {interest.icon} {interest.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="flex-1"
                    onClick={nextUser}
                  >
                    <X className="h-5 w-5 mr-2" />
                    Pass
                  </Button>
                  <Button 
                    size="lg" 
                    className="flex-1"
                    onClick={handleConnect}
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Discovery;