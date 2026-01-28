/*
  # Fix All RLS Policies to Use auth_user_id

  ## Problem
  Many RLS policies across different tables use `users.id = auth.uid()` which is incorrect.
  The correct comparison should be `users.auth_user_id = auth.uid()` because:
  - `users.id` is the primary key (different from auth.users.id)
  - `users.auth_user_id` is the foreign key linking to auth.users.id
  - `auth.uid()` returns auth.users.id

  ## Affected Tables
  - partners
  - programs
  - projects
  - form_templates
  - project_status_history
  - document_requests
  - document_submissions
  - technical_support
  - disbursement_plan
  - disbursement_tranches
  - project_archives

  ## Changes
  Update all RLS policies to use `auth_user_id` instead of `id` when checking user roles.
*/

-- =====================================================
-- FIX PARTNERS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins and managers can manage partners" ON public.partners;
CREATE POLICY "Admins and managers can manage partners"
  ON public.partners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX PROGRAMS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage all programs" ON public.programs;
CREATE POLICY "Admins can manage all programs"
  ON public.programs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can manage all programs" ON public.programs;
CREATE POLICY "Managers can manage all programs"
  ON public.programs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role = 'manager'
    )
  );

-- =====================================================
-- FIX PROJECTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Users can read accessible projects" ON public.projects;
CREATE POLICY "Users can read accessible projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    submitter_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.auth_user_id = (SELECT auth.uid())
      AND u.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM public.programs pr
      JOIN public.users u ON u.id = pr.manager_id
      WHERE pr.id = projects.program_id
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update own draft projects" ON public.projects;
CREATE POLICY "Users can update own draft projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    (submitter_id = (SELECT auth.uid()) AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers and admins can delete projects" ON public.projects;
CREATE POLICY "Managers and admins can delete projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX FORM_TEMPLATES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins and managers can manage form templates" ON public.form_templates;
CREATE POLICY "Admins and managers can manage form templates"
  ON public.form_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX PROJECT_STATUS_HISTORY TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Admins can view all status history" ON public.project_status_history;
CREATE POLICY "Admins can view all status history"
  ON public.project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Managers can view all status history" ON public.project_status_history;
CREATE POLICY "Managers can view all status history"
  ON public.project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "Partners can view history of their projects" ON public.project_status_history;
CREATE POLICY "Partners can view history of their projects"
  ON public.project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.programs pr ON p.program_id = pr.id
      JOIN public.users u ON pr.manager_id = u.id
      WHERE p.id = project_status_history.project_id
      AND u.auth_user_id = (SELECT auth.uid())
    )
  );

-- =====================================================
-- FIX DOCUMENT_REQUESTS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update document requests" ON public.document_requests;
CREATE POLICY "Managers can update document requests"
  ON public.document_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX DOCUMENT_SUBMISSIONS TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update document submissions" ON public.document_submissions;
CREATE POLICY "Managers can update document submissions"
  ON public.document_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX TECHNICAL_SUPPORT TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update technical support" ON public.technical_support;
CREATE POLICY "Managers can update technical support"
  ON public.technical_support
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can delete technical support" ON public.technical_support;
CREATE POLICY "Managers can delete technical support"
  ON public.technical_support
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX DISBURSEMENT_PLAN TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update disbursement plans" ON public.disbursement_plan;
CREATE POLICY "Managers can update disbursement plans"
  ON public.disbursement_plan
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can delete disbursement plans" ON public.disbursement_plan;
CREATE POLICY "Managers can delete disbursement plans"
  ON public.disbursement_plan
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX DISBURSEMENT_TRANCHES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update disbursement tranches" ON public.disbursement_tranches;
CREATE POLICY "Managers can update disbursement tranches"
  ON public.disbursement_tranches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can delete disbursement tranches" ON public.disbursement_tranches;
CREATE POLICY "Managers can delete disbursement tranches"
  ON public.disbursement_tranches
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- FIX PROJECT_ARCHIVES TABLE POLICIES
-- =====================================================

DROP POLICY IF EXISTS "Managers can update project archives" ON public.project_archives;
CREATE POLICY "Managers can update project archives"
  ON public.project_archives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can delete project archives" ON public.project_archives;
CREATE POLICY "Managers can delete project archives"
  ON public.project_archives
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );
