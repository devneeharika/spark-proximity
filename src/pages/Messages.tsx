import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { MessageThread } from '@/components/MessageThread';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, loading } = useMessages();
  const [selectedConversation, setSelectedConversation] = useState<{
    userId: string;
    name: string;
    username: string;
    avatar?: string | null;
  } | null>(null);

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
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-4">No Messages Yet</h2>
            <p className="text-muted-foreground mb-6">
              Start connecting with people to begin conversations!
            </p>
            <Button onClick={() => navigate('/discovery')}>
              Discover People
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card 
                key={conversation.user_id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setSelectedConversation({
                  userId: conversation.user_id,
                  name: conversation.display_name,
                  username: conversation.username,
                  avatar: conversation.avatar_url
                })}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {conversation.avatar_url && (
                        <AvatarImage src={conversation.avatar_url} />
                      )}
                      <AvatarFallback>
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
                            <Badge variant="default" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
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
    </div>
  );
};

export default Messages;