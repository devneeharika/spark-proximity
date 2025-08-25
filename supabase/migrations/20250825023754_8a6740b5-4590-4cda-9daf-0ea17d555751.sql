-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create RLS policies for avatar uploads
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for connections table
ALTER TABLE public.connections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- Enable realtime for user_locations table  
ALTER TABLE public.user_locations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_locations;

-- Add function to calculate distance between users
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC, 
  lon1 NUMERIC, 
  lat2 NUMERIC, 
  lon2 NUMERIC
) RETURNS NUMERIC AS $$
DECLARE
  earth_radius NUMERIC := 6371; -- Earth's radius in kilometers
  dlat NUMERIC;
  dlon NUMERIC;
  a NUMERIC;
  c NUMERIC;
BEGIN
  dlat := RADIANS(lat2 - lat1);
  dlon := RADIANS(lon2 - lon1);
  
  a := SIN(dlat/2) * SIN(dlat/2) + 
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
       SIN(dlon/2) * SIN(dlon/2);
       
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));
  
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add function to find potential matches based on interests and location
CREATE OR REPLACE FUNCTION public.find_potential_matches(
  user_id_param UUID,
  max_distance_km NUMERIC DEFAULT 50,
  limit_results INTEGER DEFAULT 20
) RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  distance_km NUMERIC,
  shared_interests_count BIGINT,
  compatibility_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_location AS (
    SELECT latitude, longitude 
    FROM public.user_locations 
    WHERE user_locations.user_id = user_id_param 
      AND is_active = true
    LIMIT 1
  ),
  user_interests_list AS (
    SELECT interest_id 
    FROM public.user_interests 
    WHERE user_interests.user_id = user_id_param
  ),
  potential_matches AS (
    SELECT 
      p.user_id,
      p.username,
      p.display_name,
      p.bio,
      p.avatar_url,
      CASE 
        WHEN ul.latitude IS NOT NULL AND ul.longitude IS NOT NULL AND user_loc.latitude IS NOT NULL 
        THEN public.calculate_distance(user_loc.latitude, user_loc.longitude, ul.latitude, ul.longitude)
        ELSE NULL
      END as distance_km,
      COALESCE(shared.shared_count, 0) as shared_interests_count
    FROM public.profiles p
    CROSS JOIN user_location user_loc
    LEFT JOIN public.user_locations ul ON ul.user_id = p.user_id AND ul.is_active = true
    LEFT JOIN (
      SELECT 
        ui.user_id,
        COUNT(*) as shared_count
      FROM public.user_interests ui
      INNER JOIN user_interests_list uil ON uil.interest_id = ui.interest_id
      WHERE ui.user_id != user_id_param
      GROUP BY ui.user_id
    ) shared ON shared.user_id = p.user_id
    WHERE p.user_id != user_id_param
      AND (ul.latitude IS NULL OR public.calculate_distance(user_loc.latitude, user_loc.longitude, ul.latitude, ul.longitude) <= max_distance_km)
  )
  SELECT 
    pm.user_id,
    pm.username,
    pm.display_name,
    pm.bio,
    pm.avatar_url,
    pm.distance_km,
    pm.shared_interests_count,
    -- Compatibility score: weighted combination of shared interests and proximity
    CASE 
      WHEN pm.distance_km IS NULL THEN pm.shared_interests_count * 10
      ELSE (pm.shared_interests_count * 10) + (100 / (1 + pm.distance_km))
    END as compatibility_score
  FROM potential_matches pm
  WHERE pm.shared_interests_count > 0 OR pm.distance_km IS NOT NULL
  ORDER BY compatibility_score DESC, pm.shared_interests_count DESC, pm.distance_km ASC NULLS LAST
  LIMIT limit_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;