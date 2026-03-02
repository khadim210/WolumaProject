/*
  # Fix Projects RLS Policy for Submitter ID

  1. Problem
    - Current INSERT policy checks submitter_id = auth.uid()
    - But the application uses user.id from the users table
    - This causes "new row violates row-level security policy" errors

  2. Solution
    - Update INSERT policy to allow users to create projects where
      submitter_id matches their auth.uid() directly OR
      submitter_id matches their users.id (linked via auth_user_id)
    - This allows flexibility in how submitter_id is populated

  3. Security
    - Users can only create projects for themselves
    - The policy still restricts access appropriately
*/

DROP POLICY IF EXISTS "Users can create own projects" ON projects;

CREATE POLICY "Users can create own projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    submitter_id = auth.uid()
    OR
    submitter_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );
