import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useInterests } from '@/hooks/useInterests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Check, Plus } from 'lucide-react';

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, userInterests, updateProfile, addInterest, removeInterest } = useProfile();
  const { interestsByCategory, loading: interestsLoading } = useInterests();
  
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSaveProfile = async () => {
    await updateProfile(formData);
  };

  const isInterestSelected = (interestId: string) => {
    return userInterests.some(ui => ui.interest_id === interestId);
  };

  const toggleInterest = async (interestId: string) => {
    if (isInterestSelected(interestId)) {
      await removeInterest(interestId);
    } else {
      await addInterest(interestId);
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Setup Your Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Tell others about yourself to make better connections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Choose a unique username"
                    value={formData.username}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="display_name">Display Name</Label>
                  <Input
                    id="display_name"
                    name="display_name"
                    placeholder="How should others see your name?"
                    value={formData.display_name}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    placeholder="Tell others about yourself, your interests, what you're looking to connect about..."
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                  />
                </div>
                
                <Button onClick={handleSaveProfile} className="w-full">
                  Save Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interests">
            <Card>
              <CardHeader>
                <CardTitle>Your Interests</CardTitle>
                <CardDescription>
                  Select interests to help us find people with similar passions nearby
                </CardDescription>
              </CardHeader>
              <CardContent>
                {interestsLoading ? (
                  <div className="text-center py-8">Loading interests...</div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(interestsByCategory).map(([category, interests]) => (
                      <div key={category}>
                        <h3 className="text-lg font-semibold mb-3 text-foreground">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest) => {
                            const selected = isInterestSelected(interest.id);
                            return (
                              <Badge
                                key={interest.id}
                                variant={selected ? "default" : "outline"}
                                className={`cursor-pointer transition-colors ${
                                  selected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                                }`}
                                onClick={() => toggleInterest(interest.id)}
                              >
                                <span className="mr-1">{interest.icon}</span>
                                {interest.name}
                                {selected ? (
                                  <Check className="ml-1 h-3 w-3" />
                                ) : (
                                  <Plus className="ml-1 h-3 w-3" />
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-8 p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Selected Interests ({userInterests.length})</h4>
                  {userInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userInterests.map((ui) => (
                        <Badge key={ui.id} variant="secondary">
                          {ui.interest.icon} {ui.interest.name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No interests selected yet. Choose some above to get started!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProfileSetup;