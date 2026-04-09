
-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'individual', 'enterprise');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'individual',
  UNIQUE(user_id, role)
);

-- Create nice_classes table
CREATE TABLE public.nice_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_number INTEGER NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_vi TEXT,
  description_en TEXT,
  type TEXT NOT NULL CHECK (type IN ('goods', 'services')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create nice_items table
CREATE TABLE public.nice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.nice_classes(id) ON DELETE CASCADE NOT NULL,
  item_vi TEXT NOT NULL,
  item_en TEXT NOT NULL,
  wipo_basic_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create search_history table
CREATE TABLE public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  results JSONB,
  language TEXT DEFAULT 'vi',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create saved_results table
CREATE TABLE public.saved_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  class_number INTEGER NOT NULL,
  items JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ai_feedback table
CREATE TABLE public.ai_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  ai_class INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  expert_class INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nice_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- NICE classes are public read
CREATE POLICY "Anyone authenticated can view NICE classes" ON public.nice_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage NICE classes" ON public.nice_classes FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- NICE items are public read
CREATE POLICY "Anyone authenticated can view NICE items" ON public.nice_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage NICE items" ON public.nice_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Search history policies
CREATE POLICY "Users can view their own search history" ON public.search_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own search history" ON public.search_history FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own search history" ON public.search_history FOR DELETE USING (auth.uid() = user_id);

-- Saved results policies
CREATE POLICY "Users can view their own saved results" ON public.saved_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own saved results" ON public.saved_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own saved results" ON public.saved_results FOR DELETE USING (auth.uid() = user_id);

-- AI feedback policies
CREATE POLICY "Users can view their own feedback" ON public.ai_feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert feedback" ON public.ai_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all feedback" ON public.ai_feedback FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'account_type')::app_role, 'individual'));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
