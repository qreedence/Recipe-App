-- Allow mixed-case usernames, enforce uniqueness case-insensitively
ALTER TABLE public.profiles DROP CONSTRAINT username_format;
ALTER TABLE public.profiles ADD CONSTRAINT username_format
  CHECK (username ~ '^[a-zA-Z0-9][a-zA-Z0-9_-]{1,28}[a-zA-Z0-9]$');

ALTER TABLE public.profiles DROP CONSTRAINT profiles_username_key;
CREATE UNIQUE INDEX profiles_username_lower_idx ON public.profiles (LOWER(username));
