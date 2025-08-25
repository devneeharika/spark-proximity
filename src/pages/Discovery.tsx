import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMatching } from '@/hooks/useMatching';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Heart, X, Users, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Remove the old interface as we'll use the PotentialMatch from useMatching hook

const Discovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userInterests } = useProfile();
  const { toast } = useToast();
  const { matches, loading, error, findMatches } = useMatching();
  const { location, getCurrentLocation, requestLocationAndSave } = useGeolocation();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    if (user && userInterests.length > 0) {
      if (location) {
        setLocationEnabled(true);
        // Use geolocation-based matching
        findMatches({ maxDistance: 50, minSharedInterests: 1, limit: 20 });
      } else {
        // Fallback to interests-only matching
        findMatches({ minSharedInterests: 2, limit: 20 });
      }
    }
  }, [user, userInterests, location, findMatches]);

  const enableLocation = async () => {
    try {
      await requestLocationAndSave();
      setLocationEnabled(true);
      toast({
        title: "Location Enabled",
        description: "Now showing people nearby with shared interests!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Could not access location. Showing matches based on interests only."
      });
    }
  };

  const handleConnect = async () => {
    if (!user || currentUserIndex >= matches.length) return;

    const targetUser = matches[currentUserIndex];
    
    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: targetUser.user_id,
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
              {locationEnabled ? (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="text-sm text-primary">Location Active</span>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={enableLocation}>
                  <Navigation className="h-4 w-4 mr-2" />
                  Enable Location
                </Button>
              )}
            </div>
          </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Finding people with shared interests...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">Error Loading Matches</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => findMatches()}>Try Again</Button>
          </div>
        ) : currentUserIndex >= matches.length ? (
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
                {currentUserIndex + 1} of {matches.length}
              </p>
            </div>

            <Card className="w-full">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <Avatar className="h-24 w-24 mx-auto mb-4">
                    {matches[currentUserIndex]?.avatar_url && (
                      <AvatarImage src={matches[currentUserIndex].avatar_url} />
                    )}
                    <AvatarFallback className="text-2xl">
                      {matches[currentUserIndex]?.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-bold">
                    {matches[currentUserIndex]?.display_name}
                  </h2>
                  <p className="text-muted-foreground">
                    @{matches[currentUserIndex]?.username}
                  </p>
                  {matches[currentUserIndex]?.distance_km && (
                    <p className="text-sm text-muted-foreground mt-1">
                      <MapPin className="inline h-3 w-3 mr-1" />
                      {Math.round(matches[currentUserIndex].distance_km!)} km away
                    </p>
                  )}
                </div>

                {matches[currentUserIndex]?.bio && (
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground">
                      {matches[currentUserIndex].bio}
                    </p>
                  </div>
                )}

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">
                      Shared Interests ({matches[currentUserIndex]?.shared_interests_count})
                    </h3>
                    <div className="text-sm text-muted-foreground">
                      Match: {Math.round(matches[currentUserIndex]?.compatibility_score || 0)}%
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    Based on your common interests and location
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