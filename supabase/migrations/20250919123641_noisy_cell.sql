/*
  # Fix RLS policies for programs table

  1. Security Changes
    - Drop existing recursive policies on programs table
    - Create new policies using JWT metadata instead of table queries
    - Use auth.jwt()->>'role' to avoid recursion issues
    - Allow proper access for admins and managers
    - Enable partners and submitters to view relevant programs

  2. Policy Structure
    - Admin access: full management via JWT role check
    - Manager access: full management via JWT role check
    - Partner access: read-only for all programs
    - Submitter access: read-only for all programs
    - No recursive queries on users table
*/

-- Drop all existing policies that might cause issues
DROP POLICY IF EXISTS "Programs visible to authenticated users" ON programs;
DROP POLICY IF EXISTS "Admins and managers can manage programs" ON programs;

-- Create safe policies using JWT metadata (no recursion)
CREATE POLICY "All authenticated users can read programs"
  ON programs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage all programs"
  ON programs
  FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Managers can manage all programs"
  ON programs
  FOR ALL
  TO authenticated
  USING (auth.jwt()->>'role' = 'manager')
  WITH CHECK (auth.jwt()->>'role' = 'manager');

-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access on programs"
  ON programs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);