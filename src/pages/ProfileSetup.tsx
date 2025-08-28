import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useInterests } from '@/hooks/useInterests';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AvatarUpload } from '@/components/AvatarUpload';
import { ArrowLeft, Check, Plus, X, User, Heart, Sparkles, Loader2, Camera } from 'lucide-react';

const profileSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be less than 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  display_name: z.string()
    .min(1, 'Display name is required')
    .max(50, 'Display name must be less than 50 characters'),
  bio: z.string()
    .max(300, 'Bio must be less than 300 characters')
    .optional()
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileSetup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, userInterests, updateProfile, addInterest, removeInterest, loading: profileLoading } = useProfile();
  const { interestsByCategory, loading: interestsLoading } = useInterests();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("avatar");

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      display_name: '',
      bio: ''
    }
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || ''
      });
    }
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    await updateProfile(data);
    setIsSubmitting(false);
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

  const handleAvatarChange = async (url: string | null) => {
    if (url) {
      await updateProfile({ avatar_url: url });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  const completedSteps = [
    profile?.avatar_url ? 1 : 0,
    profile?.username && profile?.display_name ? 1 : 0,
    userInterests.length > 0 ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-primary">
      {/* Header */}
      <div className="glass-panel border-b border-border/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="glass-outline" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {completedSteps}/3 steps completed
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step < completedSteps ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-panel">
            <TabsTrigger value="avatar" className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-foreground/70">
              <Camera className="h-4 w-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="basic" className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-foreground/70">
              <User className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-primary-foreground data-[state=active]:text-primary text-foreground/70">
              <Heart className="h-4 w-4 mr-2" />
              Interests
            </TabsTrigger>
          </TabsList>

          {/* Avatar Upload Tab */}
          <TabsContent value="avatar" className="mt-6">
            <Card className="glass-panel">
              <CardHeader className="text-center">
                <CardTitle className="text-foreground flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent" />
                  Choose Your Photo
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Add a profile picture so others can recognize you
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-6">
                <AvatarUpload
                  currentAvatarUrl={profile?.avatar_url}
                  onAvatarChange={handleAvatarChange}
                  userId={user.id}
                />
                <div className="text-center">
                  {profile?.avatar_url && (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      Profile photo added
                    </div>
                  )}
                </div>
                  <div className="flex gap-3 w-full">
                    <Button 
                      variant="glass-outline"
                      onClick={() => setActiveTab("basic")}
                      className="flex-1"
                    >
                      Skip for now
                    </Button>
                    <Button 
                      onClick={() => setActiveTab("basic")}
                      className="flex-1"
                      disabled={!profile?.avatar_url}
                    >
                      Continue
                    </Button>
                  </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="mt-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <User className="h-5 w-5 text-accent" />
                  Tell Us About You
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  This information helps others find and connect with you
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="@johndoe"
                              className="glass-panel"
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-xs">
                            {field.value?.length || 0}/20 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Display Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              className="glass-panel"
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-xs">
                            {field.value?.length || 0}/50 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tell others about yourself, your interests, what you're looking to connect about..."
                              rows={4}
                              className="glass-panel resize-none"
                            />
                          </FormControl>
                          <FormDescription className="text-muted-foreground text-xs">
                            {field.value?.length || 0}/300 characters
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="glass-outline"
                        onClick={() => setActiveTab("avatar")}
                        className="flex-1"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          'Save & Continue'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interests Tab */}
          <TabsContent value="interests" className="mt-6">
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Heart className="h-5 w-5 text-accent" />
                  Your Interests ({userInterests.length})
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {userInterests.length > 0 
                    ? 'Great choices! Add more or tap to remove any.'
                    : 'Select interests to find people with similar passions nearby'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selected Interests Preview */}
                {userInterests.length > 0 && (
                  <div className="p-4 rounded-lg glass-panel">
                    <h4 className="text-foreground font-medium mb-3 text-sm">Your Selected Interests:</h4>
                    <div className="flex flex-wrap gap-2">
                      {userInterests.map((userInterest) => (
                        <Badge 
                          key={userInterest.id} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20 hover:border-destructive/50 transition-all"
                          onClick={() => toggleInterest(userInterest.interest_id)}
                        >
                          {userInterest.interest.icon} {userInterest.interest.name}
                          <X className="h-3 w-3 ml-1" />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interest Categories */}
                {interestsLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Loading interests...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(interestsByCategory).map(([category, interests]) => (
                      <div key={category}>
                        <h3 className="text-foreground font-semibold mb-3 text-lg">
                          {category}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest) => {
                            const selected = isInterestSelected(interest.id);
                            return (
                              <Badge
                                key={interest.id}
                                variant={selected ? "default" : "outline"}
                                className={`cursor-pointer transition-all ${
                                  selected 
                                    ? 'shadow-glow' 
                                    : 'hover:bg-accent/15'
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="glass-outline"
                    onClick={() => setActiveTab("basic")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1"
                    disabled={userInterests.length === 0}
                  >
                    Complete Setup
                  </Button>
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