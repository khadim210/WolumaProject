/*
  # Add field_eligibility_criteria column to programs

  1. Changes
    - Add field_eligibility_criteria JSONB column to programs table
    - Add GIN index for performance
  
  2. Structure
    Array of objects with:
    - fieldId: ID of the form field
    - fieldName: Name of the field
    - fieldLabel: Label of the field
    - isEligibilityCriteria: Boolean indicating if it's an eligibility criterion
    - conditions: Object with operator, value, value2, errorMessage
*/

-- Add the column for field-based eligibility criteria
ALTER TABLE programs
ADD COLUMN IF NOT EXISTS field_eligibility_criteria jsonb DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN programs.field_eligibility_criteria IS 
'Field-based eligibility criteria. Structure: array of {fieldId, fieldName, fieldLabel, isEligibilityCriteria, conditions{operator, value, value2, errorMessage}}';

-- Add GIN index for JSONB performance
CREATE INDEX IF NOT EXISTS idx_programs_field_eligibility_criteria 
ON programs USING gin(field_eligibility_criteria);