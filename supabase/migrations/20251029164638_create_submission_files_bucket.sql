/*
  # Create Storage Bucket for Submission Files

  1. Storage Bucket
    - Create `submission-files` bucket for storing project submission files
    - Configure bucket to be private by default
    
  2. Security Policies
    - Allow authenticated users to upload files to their own project folders
    - Allow users to read files from projects they have access to
    - Allow admins and managers to access all files
    
  3. Important Notes
    - Files are organized by project ID: `{project_id}/{filename}`
    - Maximum file size: 50MB
    - Supported file types: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, etc.
*/

-- Create the storage bucket for submission files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-files',
  'submission-files',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to upload files to their project folders
CREATE POLICY "Users can upload files to their projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects WHERE submitter_id = auth.uid()
  )
);

-- Policy: Allow users to read files from their own projects
CREATE POLICY "Users can read their project files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (
    -- Own projects
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE submitter_id = auth.uid()
    )
    -- OR admin/manager roles
    OR EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
);

-- Policy: Allow users to delete their own project files (draft status only)
CREATE POLICY "Users can delete files from draft projects"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM projects 
    WHERE submitter_id = auth.uid() 
    AND status = 'draft'
  )
);

-- Policy: Allow admins to manage all files
CREATE POLICY "Admins can manage all submission files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'submission-files' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);