/*
  # Fix RLS recursion for all tables

  1. Problem
    - Multiple tables have UPDATE/INSERT/DELETE policies that query the users table
    - When these policies run, they trigger users table RLS policies
    - This can cause recursion or permission denied errors

  2. Solution
    - Create helper functions with SECURITY DEFINER to bypass RLS
    - has_role(role_name) - Check if current user has a specific role
    - has_any_role(role_names) - Check if current user has any of the specified roles
    - Update all policies to use these helper functions

  3. Security
    - Functions still validate auth.uid() 
    - SECURITY DEFINER runs with owner privileges to bypass RLS
    - search_path is explicitly set to prevent hijacking
*/

-- Create has_role function
CREATE OR REPLACE FUNCTION has_role(required_role user_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = required_role
  );
END;
$$;

-- Create has_any_role function for checking multiple roles
CREATE OR REPLACE FUNCTION has_any_role(required_roles user_role[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = ANY(required_roles)
  );
END;
$$;

-- Create is_manager function for convenience
CREATE OR REPLACE FUNCTION is_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role = 'manager'
  );
END;
$$;

-- Create is_admin_or_manager function for convenience
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'manager')
  );
END;
$$;

-- =====================================================
-- UPDATE PARTNERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins and managers can update partners" ON partners;
CREATE POLICY "Admins and managers can update partners" ON partners
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Admins and managers can insert partners" ON partners;
CREATE POLICY "Admins and managers can insert partners" ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Admins and managers can delete partners" ON partners;
CREATE POLICY "Admins and managers can delete partners" ON partners
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE PROGRAMS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can update programs" ON programs;
DROP POLICY IF EXISTS "Managers can update programs" ON programs;
CREATE POLICY "Admins and managers can update programs" ON programs
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can insert programs" ON programs;
DROP POLICY IF EXISTS "Managers can insert programs" ON programs;
CREATE POLICY "Admins and managers can insert programs" ON programs
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Admins can delete programs" ON programs;
DROP POLICY IF EXISTS "Managers can delete programs" ON programs;
CREATE POLICY "Admins and managers can delete programs" ON programs
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE FORM_TEMPLATES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins and managers can manage form templates" ON form_templates;

CREATE POLICY "Admins and managers can insert form templates" ON form_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins and managers can update form templates" ON form_templates
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Admins and managers can delete form templates" ON form_templates
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE PROJECTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can update own draft projects" ON projects;
CREATE POLICY "Users can update projects" ON projects
  FOR UPDATE
  TO authenticated
  USING (
    is_admin_or_manager()
    OR (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = projects.submitter_id 
        AND users.auth_user_id = auth.uid()
      )
      AND status = 'draft'
    )
  )
  WITH CHECK (
    is_admin_or_manager()
    OR (
      EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = projects.submitter_id 
        AND users.auth_user_id = auth.uid()
      )
      AND status = 'draft'
    )
  );

DROP POLICY IF EXISTS "Managers and admins can delete projects" ON projects;
CREATE POLICY "Admins and managers can delete projects" ON projects
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;
CREATE POLICY "Users can read accessible projects" ON projects
  FOR SELECT
  TO authenticated
  USING (
    is_admin_or_manager()
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = projects.submitter_id 
      AND users.auth_user_id = auth.uid()
    )
  );

-- =====================================================
-- UPDATE DISBURSEMENT_PLAN POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update disbursement plans" ON disbursement_plan;
CREATE POLICY "Admins and managers can update disbursement plans" ON disbursement_plan
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can manage disbursement plans" ON disbursement_plan;
CREATE POLICY "Admins and managers can insert disbursement plans" ON disbursement_plan
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can delete disbursement plans" ON disbursement_plan;
CREATE POLICY "Admins and managers can delete disbursement plans" ON disbursement_plan
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE DISBURSEMENT_TRANCHES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update disbursement tranches" ON disbursement_tranches;
CREATE POLICY "Admins and managers can update disbursement tranches" ON disbursement_tranches
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can manage disbursement tranches" ON disbursement_tranches;
CREATE POLICY "Admins and managers can insert disbursement tranches" ON disbursement_tranches
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can delete disbursement tranches" ON disbursement_tranches;
CREATE POLICY "Admins and managers can delete disbursement tranches" ON disbursement_tranches
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE DOCUMENT_REQUESTS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update document requests" ON document_requests;
CREATE POLICY "Admins and managers can update document requests" ON document_requests
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can create document requests" ON document_requests;
CREATE POLICY "Admins and managers can insert document requests" ON document_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

-- =====================================================
-- UPDATE DOCUMENT_SUBMISSIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update document submissions" ON document_submissions;
CREATE POLICY "Admins and managers can update document submissions" ON document_submissions
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

-- =====================================================
-- UPDATE TECHNICAL_SUPPORT POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update technical support" ON technical_support;
CREATE POLICY "Admins and managers can update technical support" ON technical_support
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can manage technical support" ON technical_support;
CREATE POLICY "Admins and managers can insert technical support" ON technical_support
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can delete technical support" ON technical_support;
CREATE POLICY "Admins and managers can delete technical support" ON technical_support
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE PROJECT_ARCHIVES POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update project archives" ON project_archives;
CREATE POLICY "Admins and managers can update project archives" ON project_archives
  FOR UPDATE
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can manage project archives" ON project_archives;
CREATE POLICY "Admins and managers can insert project archives" ON project_archives
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin_or_manager());

DROP POLICY IF EXISTS "Managers can delete project archives" ON project_archives;
CREATE POLICY "Admins and managers can delete project archives" ON project_archives
  FOR DELETE
  TO authenticated
  USING (is_admin_or_manager());

-- =====================================================
-- UPDATE PROJECT_STATUS_HISTORY POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all status history" ON project_status_history;
DROP POLICY IF EXISTS "Managers can view all status history" ON project_status_history;
DROP POLICY IF EXISTS "Submitters can view history of own projects" ON project_status_history;
DROP POLICY IF EXISTS "Partners can view history of their projects" ON project_status_history;

CREATE POLICY "Admins and managers can view all status history" ON project_status_history
  FOR SELECT
  TO authenticated
  USING (is_admin_or_manager());

CREATE POLICY "Users can view history of own projects" ON project_status_history
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