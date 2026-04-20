-- Update handle_new_user to capture position and assigned_level from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_level_value course_level;
BEGIN
  -- Cast the assigned_level from metadata to course_level enum if present
  IF NEW.raw_user_meta_data->>'assigned_level' IS NOT NULL THEN
    assigned_level_value := (NEW.raw_user_meta_data->>'assigned_level')::course_level;
  ELSE
    assigned_level_value := NULL;
  END IF;

  INSERT INTO public.profiles (user_id, display_name, position, assigned_level)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'position',
    assigned_level_value
  );
  
  -- Auto-assign course_rep role if position contains "course rep"
  IF LOWER(COALESCE(NEW.raw_user_meta_data->>'position', '')) LIKE '%course rep%' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'course_rep'::app_role);
  END IF;
  
  RETURN NEW;
END;
$function$;
