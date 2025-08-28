-- Add new fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT,
ADD COLUMN date_of_birth DATE,
ADD COLUMN phone_number TEXT;

-- Create interests hierarchy table for nested interests
CREATE TABLE public.interests_hierarchy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID REFERENCES public.interests_hierarchy(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  description TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on interests_hierarchy
ALTER TABLE public.interests_hierarchy ENABLE ROW LEVEL SECURITY;

-- Create policies for interests_hierarchy
CREATE POLICY "Everyone can view interests hierarchy" 
ON public.interests_hierarchy 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create custom interests" 
ON public.interests_hierarchy 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_interests_hierarchy_updated_at
BEFORE UPDATE ON public.interests_hierarchy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_interests to reference new hierarchy
ALTER TABLE public.user_interests 
ADD COLUMN hierarchy_id UUID REFERENCES public.interests_hierarchy(id);

-- Insert sample hierarchical interests
INSERT INTO public.interests_hierarchy (name, category, level, icon, description) VALUES
-- Level 0 (main categories)
('Music', 'Entertainment', 0, '🎵', 'All things music'),
('Sports', 'Activities', 0, '⚽', 'Sports and fitness activities'),
('Technology', 'Learning', 0, '💻', 'Tech and innovation'),
('Art', 'Creativity', 0, '🎨', 'Visual and creative arts'),
('Food', 'Lifestyle', 0, '🍕', 'Cooking and dining'),
('Travel', 'Adventure', 0, '✈️', 'Exploring the world'),
('Gaming', 'Entertainment', 0, '🎮', 'Video games and gaming'),
('Reading', 'Learning', 0, '📚', 'Books and literature');

-- Get the IDs for level 1 interests
DO $$
DECLARE
    music_id UUID;
    sports_id UUID;
    tech_id UUID;
    art_id UUID;
    food_id UUID;
    gaming_id UUID;
BEGIN
    -- Get parent IDs
    SELECT id INTO music_id FROM public.interests_hierarchy WHERE name = 'Music' AND level = 0;
    SELECT id INTO sports_id FROM public.interests_hierarchy WHERE name = 'Sports' AND level = 0;
    SELECT id INTO tech_id FROM public.interests_hierarchy WHERE name = 'Technology' AND level = 0;
    SELECT id INTO art_id FROM public.interests_hierarchy WHERE name = 'Art' AND level = 0;
    SELECT id INTO food_id FROM public.interests_hierarchy WHERE name = 'Food' AND level = 0;
    SELECT id INTO gaming_id FROM public.interests_hierarchy WHERE name = 'Gaming' AND level = 0;
    
    -- Level 1 (sub-categories)
    -- Music subcategories
    INSERT INTO public.interests_hierarchy (parent_id, name, category, level, icon) VALUES
    (music_id, 'Hip Hop', 'Entertainment', 1, '🎤'),
    (music_id, 'Pop', 'Entertainment', 1, '🌟'),
    (music_id, 'Rock', 'Entertainment', 1, '🎸'),
    (music_id, 'Electronic', 'Entertainment', 1, '🎧'),
    (music_id, 'Jazz', 'Entertainment', 1, '🎺'),
    (music_id, 'Classical', 'Entertainment', 1, '🎼');
    
    -- Sports subcategories
    INSERT INTO public.interests_hierarchy (parent_id, name, category, level, icon) VALUES
    (sports_id, 'Football', 'Activities', 1, '🏈'),
    (sports_id, 'Basketball', 'Activities', 1, '🏀'),
    (sports_id, 'Soccer', 'Activities', 1, '⚽'),
    (sports_id, 'Tennis', 'Activities', 1, '🎾'),
    (sports_id, 'Swimming', 'Activities', 1, '🏊'),
    (sports_id, 'Gym', 'Activities', 1, '💪');
    
    -- Technology subcategories
    INSERT INTO public.interests_hierarchy (parent_id, name, category, level, icon) VALUES
    (tech_id, 'Programming', 'Learning', 1, '👨‍💻'),
    (tech_id, 'AI/ML', 'Learning', 1, '🤖'),
    (tech_id, 'Crypto', 'Learning', 1, '₿'),
    (tech_id, 'Mobile Apps', 'Learning', 1, '📱'),
    (tech_id, 'Web Dev', 'Learning', 1, '🌐'),
    (tech_id, 'Gadgets', 'Learning', 1, '⚙️');
    
    -- Gaming subcategories
    INSERT INTO public.interests_hierarchy (parent_id, name, category, level, icon) VALUES
    (gaming_id, 'FPS', 'Entertainment', 1, '🔫'),
    (gaming_id, 'RPG', 'Entertainment', 1, '🗡️'),
    (gaming_id, 'Strategy', 'Entertainment', 1, '♟️'),
    (gaming_id, 'Mobile Gaming', 'Entertainment', 1, '📱'),
    (gaming_id, 'Console', 'Entertainment', 1, '🎮'),
    (gaming_id, 'PC Gaming', 'Entertainment', 1, '💻');
END $$;