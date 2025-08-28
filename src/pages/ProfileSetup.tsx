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
      <div className="glass-panel border-b border-white/10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-white hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {profile ? 'Edit Profile' : 'Create Profile'}
              </h1>
              <p className="text-sm text-white/70">
                {completedSteps}/3 steps completed
              </p>
            </div>
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  step < completedSteps ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 max-w-md">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 glass-panel border-white/20">
            <TabsTrigger value="avatar" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white/70">
              <Camera className="h-4 w-4 mr-2" />
              Photo
            </TabsTrigger>
            <TabsTrigger value="basic" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white/70">
              <User className="h-4 w-4 mr-2" />
              Info
            </TabsTrigger>
            <TabsTrigger value="interests" className="data-[state=active]:bg-white data-[state=active]:text-primary text-white/70">
              <Heart className="h-4 w-4 mr-2" />
              Interests
            </TabsTrigger>
          </TabsList>

          {/* Avatar Upload Tab */}
          <TabsContent value="avatar" className="mt-6">
            <Card className="glass-panel border-white/20 bg-white/5">
              <CardHeader className="text-center">
                <CardTitle className="text-white flex items-center justify-center gap-2">
                  <Sparkles className="h-5 w-5 text-gradient-end" />
                  Choose Your Photo
                </CardTitle>
                <CardDescription className="text-white/70">
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
                    <div className="flex items-center gap-2 text-white/70 text-sm">
                      <Check className="h-4 w-4 text-green-400" />
                      Profile photo added
                    </div>
                  )}
                </div>
                <div className="flex gap-3 w-full">
                  <Button 
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Skip for now
                  </Button>
                  <Button 
                    onClick={() => setActiveTab("basic")}
                    className="flex-1 bg-white text-primary hover:bg-white/90"
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
            <Card className="glass-panel border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-gradient-end" />
                  Tell Us About You
                </CardTitle>
                <CardDescription className="text-white/70">
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
                          <FormLabel className="text-white">Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="@johndoe"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                            />
                          </FormControl>
                          <FormDescription className="text-white/60 text-xs">
                            {field.value?.length || 0}/20 characters
                          </FormDescription>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="display_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Display Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40"
                            />
                          </FormControl>
                          <FormDescription className="text-white/60 text-xs">
                            {field.value?.length || 0}/50 characters
                          </FormDescription>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Tell others about yourself, your interests, what you're looking to connect about..."
                              rows={4}
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 resize-none"
                            />
                          </FormControl>
                          <FormDescription className="text-white/60 text-xs">
                            {field.value?.length || 0}/300 characters
                          </FormDescription>
                          <FormMessage className="text-red-300" />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("avatar")}
                        className="flex-1 border-white/20 text-white hover:bg-white/10"
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-white text-primary hover:bg-white/90"
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
            <Card className="glass-panel border-white/20 bg-white/5">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Heart className="h-5 w-5 text-gradient-end" />
                  Your Interests ({userInterests.length})
                </CardTitle>
                <CardDescription className="text-white/70">
                  {userInterests.length > 0 
                    ? 'Great choices! Add more or tap to remove any.'
                    : 'Select interests to find people with similar passions nearby'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selected Interests Preview */}
                {userInterests.length > 0 && (
                  <div className="p-4 rounded-lg bg-white/10 border border-white/20">
                    <h4 className="text-white font-medium mb-3 text-sm">Your Selected Interests:</h4>
                    <div className="flex flex-wrap gap-2">
                      {userInterests.map((userInterest) => (
                        <Badge 
                          key={userInterest.id} 
                          variant="secondary"
                          className="bg-white/20 text-white border-white/20 cursor-pointer hover:bg-red-500/20 hover:border-red-400/50 transition-all"
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
                    <Loader2 className="h-6 w-6 animate-spin text-white mx-auto mb-2" />
                    <p className="text-white/70">Loading interests...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(interestsByCategory).map(([category, interests]) => (
                      <div key={category}>
                        <h3 className="text-white font-semibold mb-3 text-lg">
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
                                    ? 'bg-white text-primary border-white shadow-glow' 
                                    : 'bg-white/5 text-white/80 border-white/30 hover:bg-white/15 hover:border-white/50'
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
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="flex-1 bg-white text-primary hover:bg-white/90"
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