/*
  # Fix Project Submission RLS Policy

  1. Problem
    - Users cannot submit projects (change status from draft to submitted)
    - Current UPDATE policy only allows updates when status='draft' in USING clause
    - When status changes to 'submitted', the USING check fails
    
  2. Solution
    - Drop existing UPDATE policy
    - Create new UPDATE policy with proper WITH CHECK clause
    - Allow status transition from draft to submitted
    - Allow admins and managers to update any project
    
  3. Security
    - Users can only update their own projects
    - Users can only update draft projects OR submit draft projects (draft→submitted)
    - Admins and managers can update any project
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own draft projects" ON projects;

-- Create new UPDATE policy with proper status transition handling
CREATE POLICY "Users can update own draft projects"
ON projects
FOR UPDATE
TO authenticated
USING (
  -- Can update if:
  -- 1. Own draft project
  (
    submitter_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
    AND status = 'draft'
  )
  -- OR 2. Admin or Manager
  OR (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
)
WITH CHECK (
  -- After update, must be:
  -- 1. Own project (draft or submitted only) 
  (
    submitter_id IN (
      SELECT users.id
      FROM users
      WHERE users.auth_user_id = auth.uid()
    )
    AND status IN ('draft', 'submitted')
  )
  -- OR 2. Admin or Manager (any status)
  OR (
    EXISTS (
      SELECT 1
      FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
);