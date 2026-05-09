-- Fix rating column to allow half-star values (0.5 increments)
ALTER TABLE recipes ALTER COLUMN rating TYPE numeric USING rating::numeric;
ALTER TABLE recipes DROP CONSTRAINT IF EXISTS recipes_rating_check;
ALTER TABLE recipes ADD CONSTRAINT recipes_rating_check CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5));
