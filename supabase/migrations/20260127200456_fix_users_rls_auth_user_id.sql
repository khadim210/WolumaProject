/*
  # Fix Users Table RLS Policies for Login

  ## Problem
  The users table has a separate `id` column and `auth_user_id` column.
  Current RLS policies use `id = auth.uid()` which is incorrect because:
  - `id` is the primary key of the users table (different value)
  - `auth_user_id` is the foreign key that links to auth.users.id
  - `auth.uid()` returns the auth.users.id value
  
  This prevents users from logging in because they cannot read their own profile.

  ## Solution
  Update all RLS policies to use `auth_user_id` instead of `id` when comparing with `auth.uid()`.

  ## Changes
  1. Fix "Users can read own profile" policy
  2. Fix "Users can update own profile" policy
  3. Fix "Admins can read all users" policy
  4. Fix "Admins can insert users" policy
  5. Fix "Admins can update all users" policy
  6. Fix "Admins can delete users" policy

  ## Security
  - Maintains same access control logic
  - Only changes the column used for comparison
*/

-- Drop and recreate "Users can read own profile" policy
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = (SELECT auth.uid()));

-- Drop and recreate "Users can update own profile" policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth_user_id = (SELECT auth.uid()))
  WITH CHECK (auth_user_id = (SELECT auth.uid()));

-- Drop and recreate "Admins can read all users" policy
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

-- Drop and recreate "Admins can insert users" policy
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

-- Drop and recreate "Admins can update all users" policy
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

-- Drop and recreate "Admins can delete users" policy
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );
