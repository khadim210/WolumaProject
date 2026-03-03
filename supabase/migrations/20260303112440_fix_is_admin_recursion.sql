/*
  # Fix is_admin() function recursion issue

  1. Problem
    - The is_admin() function queries the users table
    - The users table RLS policies use is_admin()
    - This creates infinite recursion when admin tries to update users

  2. Solution
    - Recreate is_admin() with SECURITY DEFINER to bypass RLS
    - This allows the function to query users table without triggering RLS policies

  3. Security
    - Function still validates auth.uid() matches admin role
    - Only authenticated users can call the function
*/

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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