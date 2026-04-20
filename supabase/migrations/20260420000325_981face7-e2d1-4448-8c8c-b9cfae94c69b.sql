-- Positions table (admin-managed)
CREATE TABLE public.exec_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exec_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Positions are viewable by everyone"
  ON public.exec_positions FOR SELECT USING (true);

CREATE POLICY "Admins can insert positions"
  ON public.exec_positions FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update positions"
  ON public.exec_positions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete positions"
  ON public.exec_positions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.exec_positions (label, display_order) VALUES
  ('President', 1),
  ('Vice President', 2),
  ('General Secretary', 3),
  ('Financial Secretary', 4),
  ('Director of Software', 5),
  ('Director of Academics', 6),
  ('Director of Welfare', 7),
  ('P.R.O.', 8);

-- Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN position text,
  ADD COLUMN photo_url text,
  ADD COLUMN twitter text,
  ADD COLUMN linkedin text,
  ADD COLUMN instagram text,
  ADD COLUMN whatsapp text,
  ADD COLUMN email_public text,
  ADD COLUMN is_approved boolean NOT NULL DEFAULT false,
  ADD COLUMN display_order integer NOT NULL DEFAULT 0;

-- Auto-approve the first admin (existing user) so the site isn't empty
UPDATE public.profiles
SET is_approved = true
WHERE user_id IN (SELECT user_id FROM public.user_roles WHERE role = 'admin');

-- Allow admins to update any profile (for approval workflow)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user to capture position from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'position'
  );
  RETURN NEW;
END;
$function$;