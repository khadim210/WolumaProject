/*
  # Fix RLS infinite recursion with JWT-based policies

  1. Security Changes
    - Drop all existing recursive policies on users table
    - Create new policies using JWT metadata instead of table queries
    - Use auth.jwt()->>'role' to avoid recursion
    - Allow users to access their own profile via auth.uid()
    - Allow admins to manage all users via JWT role check

  2. Policy Structure
    - Individual access: users can read/update their own profile
    - Admin access: admins can manage all users
    - Service role: full access for system operations
    - No recursive queries on users table
*/

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Allow admins to manage all users" ON users;
DROP POLICY IF EXISTS "Allow admins to read all users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to update own profile" ON users;
DROP POLICY IF EXISTS "Allow service role to insert users" ON users;
DROP POLICY IF EXISTS "Allow service role to manage users" ON users;

-- Create safe policies using JWT metadata (no recursion)
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin')
  WITH CHECK (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (auth.jwt()->>'role' = 'admin');

-- Service role has full access (bypasses RLS)
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);