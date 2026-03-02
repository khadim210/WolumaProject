/*
  # Fix partners UPDATE policy

  1. Changes
    - Drop existing policy that uses ALL command
    - Create separate policies for INSERT, UPDATE, DELETE commands
    - Each policy has appropriate USING and WITH CHECK clauses
  
  2. Security
    - Ensures admins and managers can properly update partner data including description
*/

-- Drop existing ALL policy
DROP POLICY IF EXISTS "Admins and managers can manage partners" ON partners;

-- Create separate policies for each command
CREATE POLICY "Admins and managers can insert partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can update partners"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins and managers can delete partners"
  ON partners
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );