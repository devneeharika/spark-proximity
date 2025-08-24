-- Create interests table
CREATE TABLE public.interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category text NOT NULL,
  description text,
  icon text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_interests junction table
CREATE TABLE public.user_interests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  interest_id uuid NOT NULL REFERENCES public.interests(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, interest_id)
);

-- Create connections table for managing friend requests and connections
CREATE TABLE public.connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(requester_id, receiver_id)
);

-- Create user_locations table for proximity matching
CREATE TABLE public.user_locations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_name text,
  is_active boolean NOT NULL DEFAULT true,
  last_updated timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Interests policies (public read, admin write)
CREATE POLICY "Interests are viewable by everyone" 
ON public.interests 
FOR SELECT 
USING (true);

-- User interests policies
CREATE POLICY "Users can view their own interests" 
ON public.user_interests 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interests" 
ON public.user_interests 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interests" 
ON public.user_interests 
FOR DELETE 
USING (auth.uid() = user_id);

-- Connections policies
CREATE POLICY "Users can view connections involving them" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create connection requests" 
ON public.connections 
FOR INSERT 
WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update connections involving them" 
ON public.connections 
FOR UPDATE 
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- User locations policies
CREATE POLICY "Users can view their own location" 
ON public.user_locations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own location" 
ON public.user_locations 
FOR ALL 
USING (auth.uid() = user_id);

-- Create update trigger for connections
CREATE TRIGGER update_connections_updated_at
BEFORE UPDATE ON public.connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample interests
INSERT INTO public.interests (name, category, icon) VALUES
('Photography', 'Creative', '📸'),
('Hiking', 'Outdoor', '🥾'),
('Coffee', 'Food & Drink', '☕'),
('Music Production', 'Creative', '🎵'),
('Rock Climbing', 'Sports', '🧗'),
('Cooking', 'Food & Drink', '👨‍🍳'),
('Reading', 'Learning', '📚'),
('Gaming', 'Entertainment', '🎮'),
('Yoga', 'Wellness', '🧘'),
('Travel', 'Lifestyle', '✈️'),
('Art', 'Creative', '🎨'),
('Fitness', 'Sports', '💪'),
('Tech', 'Learning', '💻'),
('Movies', 'Entertainment', '🎬'),
('Dancing', 'Entertainment', '💃');