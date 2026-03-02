/*
  # Fix Project Status History Trigger (Version 2)

  ## Problem
  - The trigger function references columns `from_status`, `to_status`, and `notes`
  - But the actual table has columns `old_status`, `new_status`, and `comment`
  - This causes INSERT errors when creating projects

  ## Changes
  1. Drop the existing trigger first
  2. Drop the function with CASCADE
  3. Recreate the function with correct column names matching the table structure
  4. Recreate the trigger

  ## Security
  - RLS policies remain unchanged
  - Only fixes the column name mismatch in the trigger function
*/

-- Drop the existing trigger first (may have different name)
DROP TRIGGER IF EXISTS log_project_status_change_trigger ON projects;
DROP TRIGGER IF EXISTS trigger_log_project_status_change ON projects;

-- Drop the function with CASCADE to remove dependencies
DROP FUNCTION IF EXISTS log_project_status_change() CASCADE;

-- Recreate the function with correct column names
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO project_status_history (
    project_id,
    old_status,
    new_status,
    changed_by,
    comment
  ) VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status::text END,
    NEW.status::text,
    auth.uid(),
    CASE
      WHEN TG_OP = 'INSERT' THEN 'Project created'
      ELSE 'Status changed from ' || COALESCE(OLD.status::text, 'null') || ' to ' || NEW.status::text
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER trigger_log_project_status_change
  AFTER INSERT OR UPDATE OF status ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_status_change();
