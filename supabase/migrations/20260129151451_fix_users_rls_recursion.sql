/*
  # Fix RLS Recursion in Users Table

  ## Problem
  The current RLS policies for the users table create an infinite recursion when checking
  if a user is an admin. The policies try to read from the users table to verify admin status,
  which triggers the same policies again, creating a loop.

  ## Solution
  1. Create a helper function that uses SECURITY DEFINER to check admin status without recursion
  2. Drop the existing problematic policies
  3. Create new policies that use the helper function

  ## Changes
  - Create `is_admin()` function with SECURITY DEFINER
  - Drop old admin policies that cause recursion
  - Create new admin policies using the helper function
*/

-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can insert users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create new policies using the helper function
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update all users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (is_admin());
