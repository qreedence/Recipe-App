ALTER TABLE public.profiles ADD COLUMN avatar_url text;

-- Allow anyone to read follows (needed for follower/following counts on profiles)
DROP POLICY "follows_select_own" ON public.follows;
CREATE POLICY "follows_select_anyone" ON public.follows FOR SELECT USING (true);
