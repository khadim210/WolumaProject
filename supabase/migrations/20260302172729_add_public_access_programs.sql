/*
  # Add Public Access to Programs

  1. Security Changes
    - Add RLS policy to allow anonymous users to read active programs
    - This enables the public submission page to load program information without authentication

  2. Notes
    - Only allows SELECT (read) operations for anonymous users
    - Only returns active programs (is_active = true)
*/

CREATE POLICY "Public can view active programs"
  ON programs
  FOR SELECT
  TO anon
  USING (is_active = true);
