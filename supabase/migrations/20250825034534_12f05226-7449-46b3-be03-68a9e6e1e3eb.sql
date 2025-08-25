-- Create some demo users and profiles for testing discovery
-- Note: These are fake user IDs for demo purposes only

-- Create demo profiles
INSERT INTO public.profiles (user_id, username, display_name, bio, avatar_url) VALUES
('11111111-1111-1111-1111-111111111111', 'alice_wonder', 'Alice Wonder', 'Love hiking and photography. Always up for outdoor adventures!', NULL),
('22222222-2222-2222-2222-222222222222', 'bob_chef', 'Bob Smith', 'Professional chef who enjoys cooking and trying new recipes. Music lover too!', NULL),
('33333333-3333-3333-3333-333333333333', 'sara_reader', 'Sara Johnson', 'Bookworm and coffee enthusiast. Love discussing literature and philosophy.', NULL),
('44444444-4444-4444-4444-444444444444', 'mike_runner', 'Mike Davis', 'Marathon runner and fitness enthusiast. Also into tech and programming.', NULL);

-- Get some interest IDs to assign to demo users
-- First, let's see what interests exist
DO $$
DECLARE
    interest_ids UUID[];
    hiking_id UUID;
    photography_id UUID;
    cooking_id UUID;
    music_id UUID;
    reading_id UUID;
    fitness_id UUID;
    tech_id UUID;
    coffee_id UUID;
BEGIN
    -- Try to find existing interests or create generic ones
    SELECT array_agg(id) INTO interest_ids FROM interests LIMIT 8;
    
    IF array_length(interest_ids, 1) >= 8 THEN
        -- Assign interests to demo users
        INSERT INTO public.user_interests (user_id, interest_id) VALUES
        -- Alice: hiking, photography
        ('11111111-1111-1111-1111-111111111111', interest_ids[1]),
        ('11111111-1111-1111-1111-111111111111', interest_ids[2]),
        -- Bob: cooking, music
        ('22222222-2222-2222-2222-222222222222', interest_ids[3]),
        ('22222222-2222-2222-2222-222222222222', interest_ids[4]),
        -- Sara: reading, coffee
        ('33333333-3333-3333-3333-333333333333', interest_ids[5]),
        ('33333333-3333-3333-3333-333333333333', interest_ids[6]),
        -- Mike: fitness, tech
        ('44444444-4444-4444-4444-444444444444', interest_ids[7]),
        ('44444444-4444-4444-4444-444444444444', interest_ids[8]);
    END IF;
END $$;