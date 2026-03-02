/*
  # Add Public Access to Form Templates

  1. Security Changes
    - Add RLS policy to allow anonymous users to read active form templates
    - This enables the public submission page to load form fields without authentication

  2. Notes
    - Only allows SELECT (read) operations for anonymous users
    - Only returns active templates (is_active = true)
*/

CREATE POLICY "Public can view active form templates"
  ON form_templates
  FOR SELECT
  TO anon
  USING (is_active = true);
