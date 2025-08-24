import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Interest } from './useProfile';

export const useInterests = () => {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterests();
  }, []);

  const fetchInterests = async () => {
    try {
      const { data, error } = await supabase
        .from('interests')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('Error fetching interests:', error);
        return;
      }

      setInterests(data || []);
    } catch (error) {
      console.error('Error fetching interests:', error);
    } finally {
      setLoading(false);
    }
  };

  const interestsByCategory = interests.reduce((acc, interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = [];
    }
    acc[interest.category].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

  return {
    interests,
    interestsByCategory,
    loading,
    refetch: fetchInterests
  };
};