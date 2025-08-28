import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Users, MessageCircle, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/utils';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useProfile();

  const navItems = [
    { path: '/', icon: MapPin, label: 'Discover' },
    { path: '/connections', icon: Users, label: 'Connections' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border/50 safe-area-pb z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          
          return (
            <Button
              key={path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(path)}
              className={cn(
                "flex flex-col items-center gap-1 h-auto py-3 px-3",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Button>
          );
        })}
        
        {/* Profile Avatar */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/profile')}
          className={cn(
            "flex flex-col items-center gap-1 h-auto py-2 px-3",
            location.pathname === '/profile' 
              ? "text-primary" 
              : "text-muted-foreground hover:text-primary"
          )}
        >
          <Avatar className="w-6 h-6">
            <AvatarImage 
              src={profile?.avatar_url} 
              alt={profile?.display_name || profile?.username || 'Profile'}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {user ? (
                (profile?.display_name || profile?.username)?.charAt(0)?.toUpperCase() || 'U'
              ) : (
                <User className="w-4 h-4" />
              )}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium">Profile</span>
        </Button>
      </div>
    </div>
  );
};

export default BottomNavigation;