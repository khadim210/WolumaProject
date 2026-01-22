/*
  # Add INSERT Policy for User Registration

  1. Changes
    - Add policy to allow authenticated users to insert their own profile
    - This enables user registration flow to work correctly

  2. Security
    - Users can only insert their own profile (auth.uid() = auth_user_id)
    - Prevents users from creating profiles for other users
*/

-- Add INSERT policy for new user registration
CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);
