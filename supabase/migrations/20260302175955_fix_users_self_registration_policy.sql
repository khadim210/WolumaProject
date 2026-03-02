/*
  # Fix User Self-Registration Policy

  1. Problem
    - New users cannot create their own profile after registration
    - Current INSERT policy only allows admins to create users
    - This blocks public submission registration flow

  2. Solution
    - Add policy allowing authenticated users to insert their own profile
    - The policy checks that auth_user_id matches the authenticated user's ID
    - This ensures users can only create a profile for themselves

  3. Security
    - Users can only insert a row where auth_user_id = their own auth.uid()
    - Cannot create profiles for other users
    - Existing admin policy remains for admin-created accounts
*/

CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());
