ALTER TABLE public.shared_recipes ADD COLUMN recipe_id uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX shared_recipes_owner_recipe_idx ON public.shared_recipes (owner_id, recipe_id);
