/*
  # Fix Partner Deletion with Cascade

  ## Problem
  - The current foreign key constraint on `programs.partner_id` does not have `ON DELETE CASCADE`
  - This prevents deletion of partners when they have associated programs
  - The UI promises to delete both partners and their programs, but it fails

  ## Changes
  1. Drop the existing foreign key constraint on `programs.partner_id`
  2. Recreate the constraint with `ON DELETE CASCADE`
  3. This allows deletion of a partner to automatically delete all associated programs

  ## Security
  - RLS policies remain unchanged
  - Only admins and managers can delete partners (existing policy)
  - Cascade deletion is intentional and matches the UI warning message
*/

-- Drop the existing foreign key constraint
ALTER TABLE programs
DROP CONSTRAINT IF EXISTS programs_partner_id_fkey;

-- Recreate the constraint with CASCADE deletion
ALTER TABLE programs
ADD CONSTRAINT programs_partner_id_fkey
  FOREIGN KEY (partner_id)
  REFERENCES partners(id)
  ON DELETE CASCADE;
