import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  phone_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Interest {
  id: string;
  name: string;
  category: string;
  description?: string;
  icon?: string;
}

export interface UserInterest {
  id: string;
  user_id: string;
  interest_id: string;
  interest: Interest;
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userInterests, setUserInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserInterests();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserInterests = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select(`
          id,
          user_id,
          interest_id,
          interest:interests(*)
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching user interests:', error);
        return;
      }

      setUserInterests(data || []);
    } catch (error) {
      console.error('Error fetching user interests:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...updates,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update profile"
        });
        return;
      }

      setProfile(data);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile"
      });
    }
  };

  const addInterest = async (interestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_interests')
        .insert({
          user_id: user.id,
          interest_id: interestId
        });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to add interest"
        });
        return;
      }

      fetchUserInterests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add interest"
      });
    }
  };

  const removeInterest = async (interestId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id)
        .eq('interest_id', interestId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove interest"
        });
        return;
      }

      fetchUserInterests();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove interest"
      });
    }
  };

  return {
    profile,
    userInterests,
    loading,
    updateProfile,
    addInterest,
    removeInterest,
    refetchProfile: fetchProfile,
    refetchInterests: fetchUserInterests
  };
};