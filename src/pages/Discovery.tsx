import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMatching } from '@/hooks/useMatching';
import { useGeolocation } from '@/hooks/useGeolocation';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import DiscoveryMap from '@/components/DiscoveryMap';
import { MapPin, Heart, X, Users, Navigation, Home, MessageCircle, User, Settings, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Discovery = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userInterests } = useProfile();
  const { toast } = useToast();
  const { matches, loading, error, findMatches } = useMatching();
  const { location, getCurrentLocation, requestLocationAndSave } = useGeolocation();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Redirect to auth if not logged in (but only after loading is complete)
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user && userInterests.length > 0) {
      const fetchMatches = async () => {
        try {
          if (location) {
            setLocationEnabled(true);
            await findMatches({ maxDistance: 50, minSharedInterests: 1, limit: 20 });
          } else {
            await findMatches({ minSharedInterests: 1, limit: 20 });
          }
        } catch (error) {
          console.error('Error in discovery useEffect:', error);
        }
      };
      
      fetchMatches();
    }
  }, [user, userInterests, location]);

  const enableLocation = async () => {
    try {
      const position = await requestLocationAndSave();
      setLocationEnabled(true);
      toast({
        title: "Location enabled! 📍",
        description: "Now discovering people nearby..."
      });
      
      // Refresh matches with location
      await findMatches({ maxDistance: 50, minSharedInterests: 1, limit: 20 });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Location access denied",
        description: "Enable location to discover people nearby"
      });
    }
  };

  const handleConnect = async () => {
    if (!user || !matches[currentUserIndex]) return;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: matches[currentUserIndex].user_id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Connection sent! ✨",
        description: `Sent a connection request to ${matches[currentUserIndex].display_name}`
      });

      nextUser();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Connection failed",
        description: "Failed to send connection request"
      });
    }
  };

  const nextUser = () => {
    setCurrentUserIndex(prev => prev + 1);
  };

  // Show auth prompt if not logged in
  if (!user) {
    return null; // Will redirect in useEffect
  }

  // Show interests setup prompt
  if (userInterests.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md text-center bg-card/80 backdrop-blur-xl border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-gradient-social rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Setup Your Interests</h2>
            <p className="text-muted-foreground mb-6">
              Add your interests to discover people who share your passions
            </p>
            <Button 
              onClick={() => navigate('/profile-setup')}
              className="w-full h-12 bg-gradient-social text-foreground font-medium"
            >
              Setup Interests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentUser = matches[currentUserIndex];

  return (
    <div className="min-h-screen bg-gradient-primary relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/20 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-social rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Spark</h1>
              <p className="text-xs text-foreground/90">
                {matches.length - currentUserIndex} people nearby
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!locationEnabled && (
              <Button
                onClick={enableLocation}
                variant="secondary"
                size="sm"
                className="bg-white/20 text-foreground border-white/30 hover:bg-white/30"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Enable Location
              </Button>
            )}
            <Button
              onClick={() => navigate('/profile-setup')}
              variant="ghost"
              size="sm"
              className="text-foreground hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Full Screen Map */}
      <div className="absolute inset-0 pt-20 pb-20">
        <DiscoveryMap 
          userLocation={location} 
          matches={matches.slice(0, 10)}
        />
        
        {/* Location prompt overlay */}
        {!location && (
          <div className="absolute bottom-24 left-4 right-4">
            <Card className="bg-card/90 backdrop-blur-xl border-0">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">Enable location to see people nearby</p>
                    <p className="text-sm text-muted-foreground">Find connections around you</p>
                  </div>
                  <Button onClick={enableLocation} size="sm" className="bg-gradient-social text-foreground">
                    Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Floating User Card */}
        {!loading && !error && currentUser && (
          <div className="absolute bottom-24 left-4 right-4">
            <Card className="bg-card/95 backdrop-blur-xl border-0 shadow-2xl">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarImage src={currentUser.avatar_url} />
                    <AvatarFallback className="bg-gradient-social text-foreground font-semibold">
                      {currentUser.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{currentUser.display_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>@{currentUser.username}</span>
                      {currentUser.distance_km && (
                        <>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {currentUser.distance_km < 1 
                              ? "< 1km away"
                              : `${Math.round(currentUser.distance_km)}km away`
                            }
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bio */}
                {currentUser.bio && (
                  <p className="text-sm text-foreground mb-3 line-clamp-2">{currentUser.bio}</p>
                )}

                {/* Shared Interests */}
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {currentUser.shared_interests_count} shared interests
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={nextUser}
                    variant="outline"
                    size="sm"
                    className="flex-1 h-10"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Pass
                  </Button>
                  <Button
                    onClick={handleConnect}
                    size="sm"
                    className="flex-1 h-10 bg-gradient-social text-foreground font-medium shadow-glow"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
            <Card className="bg-card/90 backdrop-blur-xl border-0">
              <CardContent className="p-6 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Finding people nearby...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute bottom-24 left-4 right-4">
            <Card className="bg-card/90 backdrop-blur-xl border-0">
              <CardContent className="p-6 text-center">
                <X className="w-8 h-8 text-destructive mx-auto mb-4" />
                <p className="font-medium mb-2">Something went wrong</p>
                <p className="text-sm text-muted-foreground">Failed to load matches</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* No matches */}
        {!loading && !error && matches.length === 0 && (
          <div className="absolute bottom-24 left-4 right-4">
            <Card className="bg-card/90 backdrop-blur-xl border-0">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
                <p className="font-medium mb-2">No matches found</p>
                <p className="text-sm text-muted-foreground">
                  Try expanding your search or adding more interests
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* All matches seen */}
        {!loading && !error && currentUserIndex >= matches.length && matches.length > 0 && (
          <div className="absolute bottom-24 left-4 right-4">
            <Card className="bg-card/90 backdrop-blur-xl border-0">
              <CardContent className="p-6 text-center">
                <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
                <p className="font-medium mb-2">You've seen everyone!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Check back later for new people
                </p>
                <Button onClick={() => setCurrentUserIndex(0)} className="bg-gradient-social text-foreground">
                  Start Over
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-pb">
        <div className="flex items-center justify-around py-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex flex-col items-center gap-1 h-auto py-2 text-primary"
          >
            <MapPin className="w-5 h-5" />
            <span className="text-xs font-medium">Discover</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/connections')}
            className="flex flex-col items-center gap-1 h-auto py-2 text-muted-foreground hover:text-primary"
          >
            <Users className="w-5 h-5" />
            <span className="text-xs">Connections</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/messages')}
            className="flex flex-col items-center gap-1 h-auto py-2 text-muted-foreground hover:text-primary"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-xs">Messages</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="flex flex-col items-center gap-1 h-auto py-2 text-muted-foreground hover:text-primary"
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Discovery;