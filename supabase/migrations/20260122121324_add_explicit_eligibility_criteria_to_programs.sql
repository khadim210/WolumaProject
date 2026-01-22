/*
  # Add Explicit Eligibility Criteria Field to Programs

  1. Changes
    - Add explicit `eligibility_criteria` TEXT field to programs table
    - This field stores line-by-line textual eligibility criteria
    - Previously used in application code but not formally defined in schema

  2. Security
    - Field follows existing RLS policies on programs table
    - No additional policies needed
*/

-- Add explicit eligibility_criteria column
ALTER TABLE programs ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT;

-- Add comment for documentation
COMMENT ON COLUMN programs.eligibility_criteria IS 'Line-by-line textual eligibility criteria for the program';
