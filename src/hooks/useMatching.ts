import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PotentialMatch {
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  distance_km: number | null;
  shared_interests_count: number;
  compatibility_score: number;
}

interface MatchingFilters {
  maxDistance: number;
  minSharedInterests: number;
  limit: number;
}

export const useMatching = () => {
  const [matches, setMatches] = useState<PotentialMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const findMatches = async (filters: Partial<MatchingFilters> = {}) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('find_potential_matches', {
        user_id_param: user.id,
        max_distance_km: filters.maxDistance || 50,
        limit_results: filters.limit || 20,
      });

      if (rpcError) throw rpcError;

      // Filter by minimum shared interests if specified
      let filteredMatches = data || [];
      if (filters.minSharedInterests && filters.minSharedInterests > 0) {
        filteredMatches = filteredMatches.filter(
          match => match.shared_interests_count >= filters.minSharedInterests
        );
      }

      setMatches(filteredMatches);
    } catch (err) {
      console.error('Error finding matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const refreshMatches = () => {
    findMatches();
  };

  // Auto-fetch matches when component mounts
  useEffect(() => {
    if (user) {
      findMatches();
    }
  }, [user]);

  return {
    matches,
    loading,
    error,
    findMatches,
    refreshMatches,
  };
};