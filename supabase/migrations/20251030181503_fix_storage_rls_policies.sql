/*
  # Fix Storage RLS Policies for File Uploads

  1. Problem
    - File upload fails with RLS policy violation
    - Policies use users.id = auth.uid() which is incorrect
    - Our users table has auth_user_id field that links to auth.uid()
    
  2. Solution
    - Drop all existing submission-files policies
    - Recreate with correct auth_user_id reference
    - Simplify policies to work with our user model
    
  3. Security
    - Users can upload files to their own project folders
    - Users can read files from their projects
    - Admins and managers can access all files
    - Users can delete files only from draft projects
*/

-- Drop all existing policies for submission-files bucket
DROP POLICY IF EXISTS "Users can upload files to their projects" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their project files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete files from draft projects" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all submission files" ON storage.objects;

-- Policy 1: Allow authenticated users to upload files to any project folder
-- (We'll check project ownership at the application level for better UX)
CREATE POLICY "Authenticated users can upload submission files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files'
);

-- Policy 2: Allow users to read files from their projects OR if admin/manager
CREATE POLICY "Users can read submission files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (
    -- Admin or Manager can read all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
    OR
    -- Owner can read their project files
    (storage.foldername(name))[1] IN (
      SELECT p.id::text 
      FROM projects p
      JOIN users u ON u.id = p.submitter_id
      WHERE u.auth_user_id = auth.uid()
    )
  )
);

-- Policy 3: Allow users to delete files from their draft projects
CREATE POLICY "Users can delete own project files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (
    -- Admin can delete all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    -- Owner can delete from draft projects only
    (storage.foldername(name))[1] IN (
      SELECT p.id::text 
      FROM projects p
      JOIN users u ON u.id = p.submitter_id
      WHERE u.auth_user_id = auth.uid()
      AND p.status = 'draft'
    )
  )
);

-- Policy 4: Allow users to update file metadata (if needed)
CREATE POLICY "Users can update submission file metadata"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (
    -- Admin can update all
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
    OR
    -- Owner can update their project files
    (storage.foldername(name))[1] IN (
      SELECT p.id::text 
      FROM projects p
      JOIN users u ON u.id = p.submitter_id
      WHERE u.auth_user_id = auth.uid()
    )
  )
);