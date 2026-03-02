/*
  # Fix Program Deletion with Cascade

  ## Problem
  - The current foreign key constraint on `projects.program_id` does not have `ON DELETE CASCADE`
  - This prevents deletion of programs when they have associated projects (submissions)
  - Users cannot delete programs with existing project submissions

  ## Changes
  1. Drop the existing foreign key constraint on `projects.program_id`
  2. Recreate the constraint with `ON DELETE CASCADE`
  3. This allows deletion of a program to automatically delete all associated projects

  ## Important Note
  - This is intentional: when a program is deleted, all submissions to that program should also be deleted
  - This maintains data integrity and prevents orphaned project records
  - Users should be warned in the UI before deletion

  ## Security
  - RLS policies remain unchanged
  - Only admins and managers can delete programs (existing policy)
  - Cascade deletion is intentional to maintain referential integrity
*/

-- Drop the existing foreign key constraint
ALTER TABLE projects
DROP CONSTRAINT IF EXISTS projects_program_id_fkey;

-- Recreate the constraint with CASCADE deletion
ALTER TABLE projects
ADD CONSTRAINT projects_program_id_fkey
  FOREIGN KEY (program_id)
  REFERENCES programs(id)
  ON DELETE CASCADE;
