/*
  # Fix RLS infinite recursion policies

  1. Policy Changes
    - Remove recursive policies that cause infinite loops
    - Simplify admin policies to avoid circular references
    - Use direct auth.uid() checks instead of table lookups
    
  2. Security
    - Maintain security while avoiding recursion
    - Allow admins to manage users without circular checks
    - Keep user data access restricted appropriately
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create simplified non-recursive policies
CREATE POLICY "Allow authenticated users to read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Allow authenticated users to update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- Allow service role to insert users (for admin user creation)
CREATE POLICY "Allow service role to insert users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow service role to manage all users (for admin operations)
CREATE POLICY "Allow service role to manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a function to check if current user is admin (without recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  );
$$;

-- Allow admins to read all users using the non-recursive function
CREATE POLICY "Allow admins to read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (is_admin() OR auth_user_id = auth.uid());

-- Allow admins to manage all users using the non-recursive function
CREATE POLICY "Allow admins to manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());