-- Script to create storage buckets and policies
-- Run this in Supabase SQL Editor

-- 1. Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('provas', 'provas', true),
  ('procurados', 'procurados', true),
  ('prisoes', 'prisoes', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Set up RLS Policies for 'provas'
-- Allow public access to view files
CREATE POLICY "Public Access Provas"
ON storage.objects FOR SELECT
USING ( bucket_id = 'provas' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload Provas"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'provas' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update/delete their own files (optional)
CREATE POLICY "Authenticated Update Provas"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'provas' AND auth.uid() = owner );

CREATE POLICY "Authenticated Delete Provas"
ON storage.objects FOR DELETE
USING ( bucket_id = 'provas' AND auth.uid() = owner );


-- 3. Set up RLS Policies for 'procurados'
-- Allow public access to view files
CREATE POLICY "Public Access Procurados"
ON storage.objects FOR SELECT
USING ( bucket_id = 'procurados' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload Procurados"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'procurados' AND auth.role() = 'authenticated' );


-- 4. Set up RLS Policies for 'prisoes'
-- Allow public access to view files
CREATE POLICY "Public Access Prisoes"
ON storage.objects FOR SELECT
USING ( bucket_id = 'prisoes' );

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload Prisoes"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'prisoes' AND auth.role() = 'authenticated' );
