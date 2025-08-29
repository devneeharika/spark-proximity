import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { BubbleInterests } from '@/components/BubbleInterests';
import { ArrowLeft, Edit3, Settings, LogOut, MapPin, Calendar, Phone, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, userInterests, updateProfile, addInterest, removeInterest } = useProfile();
  const { toast } = useToast();
  
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isEditingInterests, setIsEditingInterests] = useState(false);

  // Update bioText when profile loads
  useEffect(() => {
    if (profile?.bio !== undefined) {
      setBioText(profile.bio || '');
    }
  }, [profile?.bio]);

  const handleSaveBio = async () => {
    await updateProfile({ bio: bioText });
    setIsEditingBio(false);
  };

  const handleInterestToggle = async (interestId: string) => {
    const isSelected = userInterests.some(ui => ui.interest_id === interestId);
    if (isSelected) {
      await removeInterest(interestId);
    } else {
      await addInterest(interestId);
    }
  };

  const handleCustomInterest = async (name: string, parentId?: string) => {
    try {
      // Create custom interest in hierarchy
      const { data: newInterest, error } = await supabase
        .from('interests_hierarchy')
        .insert({
          name,
          category: 'Custom',
          level: parentId ? 2 : 0, // Level 2 if has parent, 0 if top-level
          parent_id: parentId,
          is_custom: true,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Add to user's interests
      await addInterest(newInterest.id);
      
      toast({
        title: "Interest Added",
        description: `"${name}" has been added to your interests`
      });
    } catch (error) {
      console.error('Error adding custom interest:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add custom interest"
      });
    }
  };

  const selectedInterestIds = userInterests.map(ui => ui.interest_id);

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <div className="glass-panel border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <h1 className="text-xl font-bold text-white">Profile</h1>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/profile/settings')}
              className="text-white hover:bg-white/10"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Header */}
        <Card className="glass-panel border-white/20 bg-white/5 mb-6">
          <CardContent className="pt-6">
            <div className="text-center mb-6">
              <Avatar className="w-32 h-32 mx-auto mb-4 border-4 border-white/20">
                <AvatarImage 
                  src={profile.avatar_url} 
                  alt={profile.display_name || profile.username}
                />
                <AvatarFallback className="bg-white/20 text-white text-2xl">
                  {(profile.display_name || profile.username)?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profile.display_name || profile.username}
              </h2>
              <p className="text-foreground/90 mb-2">@{profile.username}</p>
              
              {/* Basic Info */}
              <div className="flex flex-wrap justify-center gap-4 text-sm text-foreground/80 mb-4">
                {profile.first_name && profile.last_name && (
                  <span className="flex items-center gap-1">
                    <span>{profile.first_name} {profile.last_name}</span>
                  </span>
                )}
                {profile.date_of_birth && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(profile.date_of_birth).toLocaleDateString()}
                  </span>
                )}
                {profile.phone_number && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {profile.phone_number}
                  </span>
                )}
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground font-semibold">Bio</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (isEditingBio) {
                      handleSaveBio();
                    } else {
                      setBioText(profile.bio || '');
                      setIsEditingBio(true);
                    }
                  }}
                  className="text-foreground/80 hover:bg-white/10"
                >
                  {isEditingBio ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                </Button>
              </div>
              
              {isEditingBio ? (
                <div className="space-y-3">
                  <Textarea
                    value={bioText}
                    onChange={(e) => setBioText(e.target.value)}
                    placeholder="Tell others about yourself..."
                    rows={4}
                    className="bg-white/10 border-white/20 text-foreground placeholder:text-foreground/60 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingBio(false);
                        setBioText(profile.bio || '');
                      }}
                      className="border-white/20 text-foreground hover:bg-white/10"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveBio}
                      className="bg-white text-primary hover:bg-white/90"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-foreground/90">
                  {profile.bio || 'No bio yet. Click edit to add one!'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Interests Section */}
        <Card className="glass-panel border-white/20 bg-white/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                Your Interests ({userInterests.length})
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingInterests(!isEditingInterests)}
                className="border-white/20 text-foreground hover:bg-white/10"
              >
                {isEditingInterests ? 'Done' : 'Edit'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditingInterests ? (
              <BubbleInterests
                selectedInterests={selectedInterestIds}
                onInterestToggle={handleInterestToggle}
                onCustomInterest={handleCustomInterest}
              />
            ) : (
              <div>
                {userInterests.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userInterests.map((userInterest) => (
                      <Badge
                        key={userInterest.id}
                        variant="secondary"
                        className="bg-white/20 text-foreground border-white/20"
                      >
                        <span className="mr-1">{userInterest.interest.icon}</span>
                        {userInterest.interest.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-foreground/90 mb-4">No interests added yet</p>
                    <Button
                      onClick={() => setIsEditingInterests(true)}
                      className="bg-white text-primary hover:bg-white/90"
                    >
                      Add Your Interests
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;