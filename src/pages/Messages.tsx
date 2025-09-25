import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageThread } from '@/components/MessageThread';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import BottomNavigation from '@/components/BottomNavigation';

const Messages = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { conversations, loading } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    name: string;
    username: string;
    avatar?: string | null;
  } | null>(null);

  // Check for recipientId from navigation state (when coming from Connections)
  useEffect(() => {
    const recipientId = location.state?.recipientId;
    if (recipientId && user) {
      // Find the recipient's profile from existing conversations or fetch it
      const existingConversation = conversations.find(conv => conv.user_id === recipientId);
      
      if (existingConversation) {
        setSelectedConversation({
          userId: existingConversation.user_id,
          name: existingConversation.display_name,
          username: existingConversation.username,
          avatar: existingConversation.avatar_url
        });
      } else {
        // Fetch recipient profile if not in conversations
        import('@/integrations/supabase/client').then(({ supabase }) => {
          supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .eq('user_id', recipientId)
            .single()
            .then(({ data }) => {
              if (data) {
                setSelectedConversation({
                  userId: data.user_id,
                  name: data.display_name || 'User',
                  username: data.username || 'user',
                  avatar: data.avatar_url
                });
              }
            });
        });
      }
    }
  }, [location.state?.recipientId, conversations, user]);

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-background">
        <MessageThread
          recipientId={selectedConversation.userId}
          recipientName={selectedConversation.name}
          recipientUsername={selectedConversation.username}
          recipientAvatar={selectedConversation.avatar}
          onBack={() => setSelectedConversation(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-primary pb-20">
      <header className="p-6 pt-12">
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>
      </header>

      <main className="px-4 max-w-2xl mx-auto">
        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <Card className="glass">
              <CardContent className="p-8">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-bold mb-4">No Messages Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Start connecting with people to begin conversations!
                </p>
                <Button onClick={() => navigate('/')} className="bg-gradient-social text-foreground">
                  Discover People
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <Card 
                key={conversation.user_id}
                className="glass hover-lift cursor-pointer"
                onClick={() => setSelectedConversation({
                  userId: conversation.user_id,
                  name: conversation.display_name,
                  username: conversation.username,
                  avatar: conversation.avatar_url
                })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-primary">
                      {conversation.avatar_url && (
                        <AvatarImage src={conversation.avatar_url} />
                      )}
                      <AvatarFallback className="bg-gradient-social text-foreground">
                        {conversation.display_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">
                          {conversation.display_name}
                        </h3>
                        <div className="flex items-center gap-2">
                          {conversation.unread_count > 0 && (
                            <Badge className="bg-gradient-social text-foreground border-0">
                              {conversation.unread_count}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(conversation.last_message_at)}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      
      <BottomNavigation />
    </div>
  );
};

export default Messages;