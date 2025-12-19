-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view achievements for leaderboard" ON public.achievements;

-- Create a new policy that only allows authenticated users to view achievements for leaderboard
CREATE POLICY "Authenticated users can view achievements for leaderboard" 
ON public.achievements 
FOR SELECT 
TO authenticated
USING (true);