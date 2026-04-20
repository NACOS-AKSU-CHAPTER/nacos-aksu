-- =========================
-- NACOS AKSU Database Setup
-- Combined migrations for Supabase
-- =========================

-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'exec', 'course_rep');
CREATE TYPE public.course_level AS ENUM ('100', '200', '300', '400');
CREATE TYPE public.semester AS ENUM ('first', 'second');

-- =========================
-- TIMESTAMP TRIGGER FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  assigned_level public.course_level,
  position text,
  photo_url text,
  twitter text,
  linkedin text,
  instagram text,
  whatsapp text,
  email_public text,
  is_approved boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'position'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- USER ROLES
-- =========================
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'exec')
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_level(_user_id UUID)
RETURNS public.course_level
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT assigned_level FROM public.profiles WHERE user_id = _user_id
$$;

CREATE POLICY "Roles are viewable by everyone"
  ON public.user_roles FOR SELECT USING (true);

CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign first user as admin
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_assign_first_admin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

-- =========================
-- EXECUTIVES
-- =========================
CREATE TABLE public.executives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  whatsapp TEXT,
  twitter TEXT,
  linkedin TEXT,
  instagram TEXT,
  term TEXT,
  is_current BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.executives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Executives are viewable by everyone"
  ON public.executives FOR SELECT USING (true);

CREATE POLICY "Staff can insert executives"
  ON public.executives FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update executives"
  ON public.executives FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete executives"
  ON public.executives FOR DELETE USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_executives_updated_at
BEFORE UPDATE ON public.executives
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- COURSES
-- =========================
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  units INT NOT NULL DEFAULT 3,
  level public.course_level NOT NULL,
  semester public.semester NOT NULL DEFAULT 'first',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code)
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Courses are viewable by everyone"
  ON public.courses FOR SELECT USING (true);

CREATE POLICY "Staff can insert courses"
  ON public.courses FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update courses"
  ON public.courses FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete courses"
  ON public.courses FOR DELETE USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- COURSE MATERIALS
-- =========================
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  external_link TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials are viewable by everyone"
  ON public.course_materials FOR SELECT USING (true);

CREATE POLICY "Staff and matching course rep can insert materials"
  ON public.course_materials FOR INSERT WITH CHECK (
    public.is_staff(auth.uid())
    OR (
      public.has_role(auth.uid(), 'course_rep')
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.level = public.get_user_level(auth.uid())
      )
    )
  );

CREATE POLICY "Staff and matching course rep can update materials"
  ON public.course_materials FOR UPDATE USING (
    public.is_staff(auth.uid())
    OR (
      public.has_role(auth.uid(), 'course_rep')
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.level = public.get_user_level(auth.uid())
      )
    )
  );

CREATE POLICY "Staff and matching course rep can delete materials"
  ON public.course_materials FOR DELETE USING (
    public.is_staff(auth.uid())
    OR (
      public.has_role(auth.uid(), 'course_rep')
      AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id AND c.level = public.get_user_level(auth.uid())
      )
    )
  );

CREATE TRIGGER update_course_materials_updated_at
BEFORE UPDATE ON public.course_materials
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- EVENTS
-- =========================
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  venue TEXT,
  cover_url TEXT,
  register_link TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT USING (is_published OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert events"
  ON public.events FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update events"
  ON public.events FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete events"
  ON public.events FOR DELETE USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- NEWS
-- =========================
CREATE TABLE public.news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_url TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news is viewable by everyone"
  ON public.news FOR SELECT USING (is_published OR public.is_staff(auth.uid()));

CREATE POLICY "Staff can insert news"
  ON public.news FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update news"
  ON public.news FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete news"
  ON public.news FOR DELETE USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_news_updated_at
BEFORE UPDATE ON public.news
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- GALLERY ALBUMS
-- =========================
CREATE TABLE public.gallery_albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  event_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Albums are viewable by everyone"
  ON public.gallery_albums FOR SELECT USING (true);

CREATE POLICY "Staff can insert albums"
  ON public.gallery_albums FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update albums"
  ON public.gallery_albums FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete albums"
  ON public.gallery_albums FOR DELETE USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_gallery_albums_updated_at
BEFORE UPDATE ON public.gallery_albums
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- GALLERY PHOTOS
-- =========================
CREATE TABLE public.gallery_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.gallery_albums(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos are viewable by everyone"
  ON public.gallery_photos FOR SELECT USING (true);

CREATE POLICY "Staff can insert photos"
  ON public.gallery_photos FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update photos"
  ON public.gallery_photos FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete photos"
  ON public.gallery_photos FOR DELETE USING (public.is_staff(auth.uid()));

-- =========================
-- SUGGESTIONS (anonymous)
-- =========================
CREATE TABLE public.suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  category TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit suggestions"
  ON public.suggestions FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view suggestions"
  ON public.suggestions FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update suggestions"
  ON public.suggestions FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete suggestions"
  ON public.suggestions FOR DELETE USING (public.is_staff(auth.uid()));

-- =========================
-- MEMBERSHIP SIGNUPS
-- =========================
CREATE TABLE public.membership_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  matric_number TEXT,
  level public.course_level,
  message TEXT,
  is_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can sign up"
  ON public.membership_signups FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can view signups"
  ON public.membership_signups FOR SELECT USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update signups"
  ON public.membership_signups FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete signups"
  ON public.membership_signups FOR DELETE USING (public.is_staff(auth.uid()));

-- =========================
-- ACADEMIC CALENDAR
-- =========================
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Calendar events are viewable by everyone"
  ON public.calendar_events FOR SELECT USING (true);

CREATE POLICY "Staff can insert calendar events"
  ON public.calendar_events FOR INSERT WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Staff can update calendar events"
  ON public.calendar_events FOR UPDATE USING (public.is_staff(auth.uid()));

CREATE POLICY "Staff can delete calendar events"
  ON public.calendar_events FOR DELETE USING (public.is_staff(auth.uid()));

CREATE TRIGGER update_calendar_events_updated_at
BEFORE UPDATE ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- EXEC POSITIONS
-- =========================
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

-- Allow admins to update any profile (for approval workflow)
CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =========================
-- STORAGE BUCKETS
-- =========================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('executives', 'executives', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('events', 'events', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('news', 'news', true);

-- Public read for all
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Public read executives" ON storage.objects FOR SELECT USING (bucket_id = 'executives');
CREATE POLICY "Public read materials" ON storage.objects FOR SELECT USING (bucket_id = 'course-materials');
CREATE POLICY "Public read events" ON storage.objects FOR SELECT USING (bucket_id = 'events');
CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Public read news" ON storage.objects FOR SELECT USING (bucket_id = 'news');

-- Avatar uploads: any authenticated user, in their own folder
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Staff manage executives, events, gallery, news buckets
CREATE POLICY "Staff manage executives bucket insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'executives' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage executives bucket update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'executives' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage executives bucket delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'executives' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff manage events bucket insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'events' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage events bucket update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'events' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage events bucket delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'events' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff manage gallery bucket insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage gallery bucket update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage gallery bucket delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND public.is_staff(auth.uid()));

CREATE POLICY "Staff manage news bucket insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'news' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage news bucket update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'news' AND public.is_staff(auth.uid()));
CREATE POLICY "Staff manage news bucket delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'news' AND public.is_staff(auth.uid()));

-- Course materials: staff OR matching course rep can upload
CREATE POLICY "Materials bucket insert staff or rep" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'course-materials' AND (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'course_rep')));
CREATE POLICY "Materials bucket update staff or rep" ON storage.objects FOR UPDATE
  USING (bucket_id = 'course-materials' AND (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'course_rep')));
CREATE POLICY "Materials bucket delete staff or rep" ON storage.objects FOR DELETE
  USING (bucket_id = 'course-materials' AND (public.is_staff(auth.uid()) OR public.has_role(auth.uid(), 'course_rep')));
