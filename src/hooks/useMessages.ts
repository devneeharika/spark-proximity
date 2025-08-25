import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: string;
  unread_count: number;
}

export const useMessages = (recipientId?: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .or(`sender_id.eq.${otherUserId},receiver_id.eq.${otherUserId}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter to only messages between these two users
      const filteredMessages = data?.filter(
        msg => 
          (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.receiver_id === user.id)
      ) || [];

      setMessages(filteredMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch all conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Get all messages involving the user
      const { data: allMessages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Group messages by conversation partner
      const conversationMap = new Map<string, {
        messages: Message[];
        otherUserId: string;
      }>();

      allMessages?.forEach(message => {
        const otherUserId = message.sender_id === user.id ? message.receiver_id : message.sender_id;
        
        if (!conversationMap.has(otherUserId)) {
          conversationMap.set(otherUserId, {
            messages: [],
            otherUserId
          });
        }
        
        conversationMap.get(otherUserId)!.messages.push(message);
      });

      // Get profiles for all conversation partners
      const otherUserIds = Array.from(conversationMap.keys());
      
      if (otherUserIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', otherUserIds);

      if (profilesError) throw profilesError;

      // Build conversation list
      const conversationList: Conversation[] = [];

      profiles?.forEach(profile => {
        const conversation = conversationMap.get(profile.user_id);
        if (!conversation) return;

        const messages = conversation.messages;
        const lastMessage = messages[0]; // Most recent first
        const unreadCount = messages.filter(
          msg => msg.receiver_id === user.id && !msg.read_at
        ).length;

        conversationList.push({
          user_id: profile.user_id,
          username: profile.username || 'Anonymous',
          display_name: profile.display_name || 'User',
          avatar_url: profile.avatar_url,
          last_message: lastMessage.content,
          last_message_at: lastMessage.created_at,
          unread_count: unreadCount
        });
      });

      // Sort by most recent message
      conversationList.sort((a, b) => 
        new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      setConversations(conversationList);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Send a message
  const sendMessage = useCallback(async (receiverId: string, content: string) => {
    if (!user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      // Refresh messages if we're viewing this conversation
      if (recipientId === receiverId) {
        await fetchMessages(receiverId);
      }

      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      return false;
    }
  }, [user, recipientId, fetchMessages]);

  // Mark messages as read
  const markAsRead = useCallback(async (senderId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .is('read_at', null);

      if (error) throw error;
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          
          // If we're viewing this conversation, add the message
          if (recipientId === newMessage.sender_id) {
            setMessages(prev => [...prev, newMessage]);
          }
          
          // Refresh conversations to update unread counts
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipientId, fetchConversations]);

  // Initial data fetch
  useEffect(() => {
    if (user) {
      if (recipientId) {
        fetchMessages(recipientId);
        // Mark messages from this sender as read
        markAsRead(recipientId);
      } else {
        fetchConversations();
      }
    }
  }, [user, recipientId, fetchMessages, fetchConversations, markAsRead]);

  return {
    messages,
    conversations,
    loading,
    error,
    sendMessage,
    markAsRead,
    refreshMessages: recipientId ? () => fetchMessages(recipientId) : fetchConversations,
    refreshConversations: fetchConversations
  };
};