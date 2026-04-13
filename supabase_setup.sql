-- ==========================================
-- 1. DATABASE TABLES & POLICIES
-- ==========================================

-- Create the notes table
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    mood TEXT,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    tasks JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own notes" 
ON public.notes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own notes" 
ON public.notes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.notes FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.notes FOR DELETE 
USING (auth.uid() = user_id);

-- ==========================================
-- 2. STORAGE BUCKET & POLICIES
-- ==========================================

-- Ensure the bucket exists
-- Note: This might fail if run multiple times, but Supabase usually handles it or you can do it via UI
-- INSERT INTO storage.buckets (id, name, public) VALUES ('app-files', 'app-files', false) ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'app-files' bucket

-- 1. Allow users to upload files to their own folder
CREATE POLICY "Users can upload files to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'app-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 2. Allow users to view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'app-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'app-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'app-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);
