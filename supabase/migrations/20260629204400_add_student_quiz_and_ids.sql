-- =====================================================================
-- 1. MEMBERSHIP ID GENERATOR (NACOS ID: NA-26-XXX)
-- =====================================================================

-- Add membership_id column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS membership_id TEXT UNIQUE;

-- Create unique ID generator function
CREATE OR REPLACE FUNCTION public.generate_nacos_id(position_text TEXT)
RETURNS TEXT AS $$
DECLARE
  next_seq INT;
  prefix TEXT := 'NA-26-';
  pos TEXT := LOWER(TRIM(COALESCE(position_text, '')));
BEGIN
  -- Check for specific reserved executive positions
  IF pos = 'president' THEN
    RETURN prefix || '001';
  ELSIF pos LIKE '%director of software%' OR pos LIKE '%software director%' THEN
    RETURN prefix || '002';
  ELSIF pos LIKE '%stakeholder%chairman%' OR pos LIKE '%chairman%stakeholder%' THEN
    RETURN prefix || '003';
  END IF;

  -- For other users, find the next sequence number
  -- We start counting from 4 onwards (since 1, 2, 3 are reserved)
  SELECT COALESCE(
    MAX(
      NULLIF(
        REGEXP_REPLACE(membership_id, '^NA-26-', ''), 
        ''
      )::INTEGER
    ), 
    3
  ) + 1
  INTO next_seq
  FROM public.profiles
  WHERE membership_id LIKE 'NA-26-%'
    AND membership_id NOT IN ('NA-26-001', 'NA-26-002', 'NA-26-003');

  -- Format as 3-digit padded number (e.g. 004, 015, 123)
  RETURN prefix || LPAD(next_seq::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Update new user trigger to automatically generate and assign the membership_id
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

  INSERT INTO public.profiles (user_id, display_name, position, assigned_level, membership_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'position',
    assigned_level_value,
    public.generate_nacos_id(NEW.raw_user_meta_data->>'position')
  );
  
  -- Auto-assign course_rep role if position contains "course rep"
  IF LOWER(COALESCE(NEW.raw_user_meta_data->>'position', '')) LIKE '%course rep%' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'course_rep'::app_role);
  END IF;
  
  RETURN NEW;
END;
$function$;


-- =====================================================================
-- 2. COURSES RLS UPDATES (ALLOWS COURSE REPS TO MANAGE THEIR LEVEL)
-- =====================================================================

-- Drop old courses write policies
DROP POLICY IF EXISTS "Staff can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Staff can update courses" ON public.courses;
DROP POLICY IF EXISTS "Staff can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Staff and matching course rep can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Staff and matching course rep can update courses" ON public.courses;
DROP POLICY IF EXISTS "Staff and matching course rep can delete courses" ON public.courses;

-- Create new policies allowing staff OR matching course reps
CREATE POLICY "Staff and matching course rep can insert courses"
  ON public.courses FOR INSERT WITH CHECK (
    public.is_staff(auth.uid())
    OR (
      public.has_role(auth.uid(), 'course_rep')
      AND level = public.get_user_level(auth.uid())
    )
  );

CREATE POLICY "Staff and matching course rep can update courses"
  ON public.courses FOR UPDATE USING (
    public.is_staff(auth.uid())
    OR (
      public.has_role(auth.uid(), 'course_rep')
      AND level = public.get_user_level(auth.uid())
    )
  );

CREATE POLICY "Staff and matching course rep can delete courses"
  ON public.courses FOR DELETE USING (
    public.is_staff(auth.uid())
    OR (
      public.has_role(auth.uid(), 'course_rep')
      AND level = public.get_user_level(auth.uid())
    )
  );


-- =====================================================================
-- 3. QUIZ SYSTEM TABLES & POLICIES
-- =====================================================================

-- Quizzes Table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz Questions Table
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  points INT NOT NULL DEFAULT 1,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quiz Options Table
CREATE TABLE IF NOT EXISTS public.quiz_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false
);

-- Quiz Attempts Table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INT NOT NULL DEFAULT 0,
  total_points INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on quiz tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid duplication errors
DROP POLICY IF EXISTS "Quizzes are viewable by authenticated users" ON public.quizzes;
DROP POLICY IF EXISTS "Staff can manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Questions are viewable by authenticated users" ON public.quiz_questions;
DROP POLICY IF EXISTS "Staff can manage questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Options are viewable by authenticated users" ON public.quiz_options;
DROP POLICY IF EXISTS "Staff can manage options" ON public.quiz_options;
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON public.quiz_attempts;

-- Create Policies for quiz tables
CREATE POLICY "Quizzes are viewable by authenticated users" 
  ON public.quizzes FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage quizzes" 
  ON public.quizzes FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Questions are viewable by authenticated users" 
  ON public.quiz_questions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage questions" 
  ON public.quiz_questions FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Options are viewable by authenticated users" 
  ON public.quiz_options FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can manage options" 
  ON public.quiz_options FOR ALL USING (public.is_staff(auth.uid()));

CREATE POLICY "Users can view their own quiz attempts" 
  ON public.quiz_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" 
  ON public.quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
