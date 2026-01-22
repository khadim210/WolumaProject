/*
  # Create Project Status History Table

  1. New Tables
    - `project_status_history`
      - `id` (uuid, primary key) - Unique identifier
      - `project_id` (uuid, foreign key) - Reference to projects table
      - `old_status` (text) - Previous project status
      - `new_status` (text) - New project status
      - `changed_by` (uuid, foreign key) - User who made the change
      - `changed_at` (timestamptz) - When the change occurred
      - `comment` (text, nullable) - Optional comment about the change
      - `metadata` (jsonb, nullable) - Additional context data

  2. Security
    - Enable RLS on `project_status_history` table
    - Add policy for admins to view all history
    - Add policy for managers to view all history
    - Add policy for partners to view history of their projects
    - Add policy for submitters to view history of their own projects
    - Only system can insert records (via trigger)

  3. Indexes
    - Index on project_id for fast lookups
    - Index on changed_at for chronological queries
    - Index on changed_by for user activity tracking

  4. Trigger
    - Automatic logging when project status changes
*/

-- Create project_status_history table
CREATE TABLE IF NOT EXISTS project_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz DEFAULT now() NOT NULL,
  comment text,
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_status_history_project_id 
  ON project_status_history(project_id);

CREATE INDEX IF NOT EXISTS idx_project_status_history_changed_at 
  ON project_status_history(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_status_history_changed_by 
  ON project_status_history(changed_by);

-- Enable RLS
ALTER TABLE project_status_history ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all history
CREATE POLICY "Admins can view all status history"
  ON project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Policy for managers to view all history
CREATE POLICY "Managers can view all status history"
  ON project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'manager'
    )
  );

-- Policy for partners to view history of their projects (via programs)
CREATE POLICY "Partners can view history of their projects"
  ON project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN programs pr ON pr.id = p.program_id
      JOIN partners pa ON pa.id = pr.partner_id
      JOIN users u ON u.auth_user_id = auth.uid()
      WHERE p.id = project_status_history.project_id
      AND (pa.assigned_manager_id = u.id OR u.role = 'partner')
    )
  );

-- Policy for submitters to view history of their own projects
CREATE POLICY "Submitters can view history of own projects"
  ON project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN users u ON u.id = p.submitter_id
      WHERE p.id = project_status_history.project_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_project_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO project_status_history (
      project_id,
      old_status,
      new_status,
      changed_by,
      changed_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on projects table
DROP TRIGGER IF EXISTS trigger_log_project_status_change ON projects;

CREATE TRIGGER trigger_log_project_status_change
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION log_project_status_change();

-- Grant necessary permissions
GRANT SELECT ON project_status_history TO authenticated;