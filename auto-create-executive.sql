-- =========================
-- AUTO-CREATE EXECUTIVE FROM APPROVED PROFILE
-- =========================

-- Function to create executive entry when profile is approved
CREATE OR REPLACE FUNCTION public.auto_create_executive_from_profile()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If profile is approved and user has exec role, create executive entry
  IF NEW.is_approved = true AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role = 'exec'
  ) THEN
    -- Check if executive entry doesn't already exist
    IF NOT EXISTS (
      SELECT 1 FROM public.executives
      WHERE email = NEW.email_public OR name = NEW.display_name
    ) THEN
      INSERT INTO public.executives (
        name,
        role,
        bio,
        photo_url,
        email,
        whatsapp,
        twitter,
        linkedin,
        instagram,
        is_current,
        display_order
      ) VALUES (
        NEW.display_name,
        COALESCE(NEW.position, 'Executive'),
        NEW.bio,
        NEW.photo_url,
        NEW.email_public,
        NEW.whatsapp,
        NEW.twitter,
        NEW.linkedin,
        NEW.instagram,
        true,
        NEW.display_order
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on profile update
DROP TRIGGER IF EXISTS on_profile_approved ON public.profiles;
CREATE TRIGGER on_profile_approved
AFTER UPDATE ON public.profiles
FOR EACH ROW
WHEN (OLD.is_approved = false AND NEW.is_approved = true)
EXECUTE FUNCTION public.auto_create_executive_from_profile();

-- Function to create executive entry when exec role is assigned
CREATE OR REPLACE FUNCTION public.auto_create_executive_from_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if the role being assigned is 'exec'
  IF NEW.role = 'exec' THEN
    -- Create executive entry from approved profile
    INSERT INTO public.executives (
      name,
      role,
      bio,
      photo_url,
      email,
      whatsapp,
      twitter,
      linkedin,
      instagram,
      is_current,
      display_order
    )
    SELECT
      p.display_name,
      COALESCE(p.position, 'Executive'),
      p.bio,
      p.photo_url,
      p.email_public,
      p.whatsapp,
      p.twitter,
      p.linkedin,
      p.instagram,
      true,
      p.display_order
    FROM public.profiles p
    WHERE p.user_id = NEW.user_id 
      AND p.is_approved = true
      AND NOT EXISTS (
        SELECT 1 FROM public.executives e
        WHERE e.email = p.email_public OR e.name = p.display_name
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger on role assignment
DROP TRIGGER IF EXISTS on_exec_role_assigned ON public.user_roles;
CREATE TRIGGER on_exec_role_assigned
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_executive_from_role();
