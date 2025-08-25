import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  requester_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  receiver_profile?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const useRealtimeConnections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConnections = async () => {
    if (!user) return;

    try {
      // Fetch all connections where user is involved - simplified query first
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConnections((data || []) as Connection[]);

      // Separate pending requests received by current user
      const pending = ((data || []) as Connection[]).filter(
        conn => conn.receiver_id === user.id && conn.status === 'pending'
      );
      setPendingRequests(pending);
    } catch (error) {
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendConnectionRequest = async (receiverId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          receiver_id: receiverId,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Connection request sent",
        description: "Your connection request has been sent successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error sending connection request:', error);
      toast({
        title: "Failed to send request",
        description: "Could not send connection request. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const respondToConnectionRequest = async (connectionId: string, accept: boolean) => {
    try {
      const status = accept ? 'accepted' : 'rejected';
      
      const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: accept ? "Connection accepted" : "Connection rejected",
        description: accept 
          ? "You are now connected!" 
          : "Connection request has been declined.",
      });

      return true;
    } catch (error) {
      console.error('Error responding to connection request:', error);
      toast({
        title: "Failed to respond",
        description: "Could not respond to connection request. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeConnection = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;

      toast({
        title: "Connection removed",
        description: "The connection has been removed successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error removing connection:', error);
      toast({
        title: "Failed to remove connection",
        description: "Could not remove connection. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    fetchConnections();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('connections-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `or(requester_id.eq.${user.id},receiver_id.eq.${user.id})`,
        },
        (payload) => {
          console.log('Connection change:', payload);
          
          // Show notification for new connection requests
          if (payload.eventType === 'INSERT' && payload.new.receiver_id === user.id) {
            toast({
              title: "New connection request",
              description: "You have received a new connection request!",
            });
          }
          
          // Refetch connections to get updated data with profiles
          fetchConnections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    connections,
    pendingRequests,
    loading,
    sendConnectionRequest,
    respondToConnectionRequest,  
    removeConnection,
    refetch: fetchConnections,
  };
};