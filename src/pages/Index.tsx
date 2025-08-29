
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, User, MapPin, Users, MessageCircle, LogOut, Zap, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import BottomNavigation from '@/components/BottomNavigation';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-card-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-primary flex flex-col items-center justify-center px-4">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-social rounded-2xl mb-6 shadow-glow">
            <Zap className="w-10 h-10 text-foreground" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-social bg-clip-text text-transparent mb-4">
            Welcome to Spark
          </h1>
          <p className="text-xl text-card-foreground mb-8 max-w-md">
            Discover and connect with people who share your interests nearby
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="h-12 px-8 bg-gradient-social text-foreground font-medium text-lg hover:shadow-glow transition-all duration-300"
          >
            Get Started
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary pb-20">
      {/* Header */}
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Profile</h1>
            <p className="text-card-foreground">{user.email}</p>
          </div>
          
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="glass-panel border-border/20 text-foreground hover:bg-accent/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-card border-border">
              <DropdownMenuItem 
                onClick={() => navigate('/profile')}
                className="text-card-foreground hover:bg-accent"
              >
                <User className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={signOut}
                className="text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Profile Card */}
        <Card className="glass-panel border-border/20 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-gradient-social text-foreground font-semibold text-lg">
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-foreground">{profile?.display_name || 'Welcome!'}</h3>
                <p className="text-card-foreground">@{profile?.username || 'setup-required'}</p>
                {profile?.bio && (
                  <p className="text-sm text-card-foreground mt-2">{profile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="glass-panel border-border/20">
            <CardContent className="p-4 text-center">
              <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-card-foreground">Connections</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </CardContent>
          </Card>
          <Card className="glass-panel border-border/20">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-6 h-6 mx-auto mb-2 text-primary" />
              <p className="text-sm text-card-foreground">Messages</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Card 
            className="glass-panel border-border/20 hover-lift cursor-pointer transition-all duration-200 hover:bg-accent/5" 
            onClick={() => navigate('/profile-setup')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-social rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{profile ? 'Edit Profile' : 'Setup Profile'}</h3>
                  <p className="text-sm text-card-foreground">
                    {profile 
                      ? 'Update your interests and details'
                      : 'Complete your profile to get started'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-panel border-border/20 hover-lift cursor-pointer transition-all duration-200 hover:bg-accent/5" 
            onClick={() => navigate('/discovery')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-social rounded-xl flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Discover People</h3>
                  <p className="text-sm text-card-foreground">Find connections nearby</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-panel border-border/20 hover-lift cursor-pointer transition-all duration-200 hover:bg-accent/5" 
            onClick={() => navigate('/connections')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-social rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Manage Connections</h3>
                  <p className="text-sm text-card-foreground">View your network</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="glass-panel border-border/20 hover-lift cursor-pointer transition-all duration-200 hover:bg-accent/5" 
            onClick={() => navigate('/messages')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-social rounded-xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Messages</h3>
                  <p className="text-sm text-card-foreground">Chat with connections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Index;
