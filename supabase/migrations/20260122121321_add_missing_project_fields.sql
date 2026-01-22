/*
  # Add Missing Eligibility and Submission Fields to Projects

  1. Changes
    - Add `eligibility_notes` TEXT field for storing eligibility verification notes
    - Add `eligibility_checked_by` UUID field to track who verified eligibility
    - Add `eligibility_checked_at` TIMESTAMPTZ field to track when eligibility was verified
    - Add `submitted_at` TIMESTAMPTZ field to track when project was submitted

  2. Security
    - These fields follow the same RLS policies as the projects table
    - No additional policies needed as they're part of the existing projects table
*/

-- Add missing eligibility tracking fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS eligibility_notes TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS eligibility_checked_by UUID REFERENCES users(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS eligibility_checked_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Add comments for documentation
COMMENT ON COLUMN projects.eligibility_notes IS 'Notes about eligibility verification process';
COMMENT ON COLUMN projects.eligibility_checked_by IS 'User who verified project eligibility';
COMMENT ON COLUMN projects.eligibility_checked_at IS 'Timestamp when eligibility was verified';
COMMENT ON COLUMN projects.submitted_at IS 'Timestamp when project was officially submitted';
