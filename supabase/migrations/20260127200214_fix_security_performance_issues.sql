/*
  # Fix Security and Performance Issues

  ## Overview
  This migration addresses critical security and performance issues identified in the database audit.

  ## Changes

  ### 1. Add Missing Foreign Key Indexes
  Creates indexes on foreign key columns that were missing covering indexes:
  - `disbursement_plan.created_by`
  - `document_requests.requested_by`
  - `document_submissions.validated_by`
  - `programs.form_template_id`
  - `project_archives.archived_by`
  - `projects.eligibility_checked_by`
  - `projects.evaluated_by`
  - `technical_support.created_by`
  - `user_sessions.user_id`

  ### 2. Optimize RLS Policies
  Updates all RLS policies to use `(select auth.<function>())` pattern instead of direct `auth.<function>()` calls.
  This prevents re-evaluation of auth functions for each row, significantly improving query performance at scale.

  ### 3. Fix Function Search Paths
  Updates functions to have immutable search paths for security:
  - `update_updated_at_column`
  - `is_admin`
  - `log_project_status_change`

  ### 4. Fix Overly Permissive RLS Policy
  Updates the `document_submissions` INSERT policy to properly check project ownership instead of allowing any authenticated user.

  ## Security Notes
  - All changes maintain existing access control logic
  - Performance optimizations do not affect security guarantees
  - Function search paths are now secure against malicious schema manipulation
*/

-- =====================================================
-- 1. ADD MISSING FOREIGN KEY INDEXES
-- =====================================================

-- Add index for disbursement_plan.created_by
CREATE INDEX IF NOT EXISTS idx_disbursement_plan_created_by
  ON public.disbursement_plan(created_by);

-- Add index for document_requests.requested_by
CREATE INDEX IF NOT EXISTS idx_document_requests_requested_by
  ON public.document_requests(requested_by);

-- Add index for document_submissions.validated_by
CREATE INDEX IF NOT EXISTS idx_document_submissions_validated_by
  ON public.document_submissions(validated_by);

-- Add index for programs.form_template_id
CREATE INDEX IF NOT EXISTS idx_programs_form_template_id
  ON public.programs(form_template_id);

-- Add index for project_archives.archived_by
CREATE INDEX IF NOT EXISTS idx_project_archives_archived_by
  ON public.project_archives(archived_by);

-- Add index for projects.eligibility_checked_by
CREATE INDEX IF NOT EXISTS idx_projects_eligibility_checked_by
  ON public.projects(eligibility_checked_by);

-- Add index for projects.evaluated_by
CREATE INDEX IF NOT EXISTS idx_projects_evaluated_by
  ON public.projects(evaluated_by);

-- Add index for technical_support.created_by
CREATE INDEX IF NOT EXISTS idx_technical_support_created_by
  ON public.technical_support(created_by);

-- Add index for user_sessions.user_id
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON public.user_sessions(user_id);

-- =====================================================
-- 2. OPTIMIZE RLS POLICIES - REPLACE auth.uid() WITH (SELECT auth.uid())
-- =====================================================

-- Drop and recreate policies for partners table
DROP POLICY IF EXISTS "Admins and managers can manage partners" ON public.partners;
CREATE POLICY "Admins and managers can manage partners"
  ON public.partners
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for projects table
DROP POLICY IF EXISTS "Users can read accessible projects" ON public.projects;
CREATE POLICY "Users can read accessible projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    submitter_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role IN ('admin', 'manager')
    )
    OR EXISTS (
      SELECT 1 FROM public.programs pr
      JOIN public.users u ON u.id = pr.manager_id
      WHERE pr.id = projects.program_id
      AND u.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
CREATE POLICY "Users can create own projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (submitter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own draft projects" ON public.projects;
CREATE POLICY "Users can update own draft projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    (submitter_id = (SELECT auth.uid()) AND status = 'draft')
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for users table
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
CREATE POLICY "Admins can insert users"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete users" ON public.users;
CREATE POLICY "Admins can delete users"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = (SELECT auth.uid())
      AND u.role = 'admin'
    )
  );

-- Drop and recreate policies for form_templates table
DROP POLICY IF EXISTS "Admins and managers can manage form templates" ON public.form_templates;
CREATE POLICY "Admins and managers can manage form templates"
  ON public.form_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for user_sessions table
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.user_sessions;
CREATE POLICY "Users can manage own sessions"
  ON public.user_sessions
  FOR ALL
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Drop and recreate policies for programs table
DROP POLICY IF EXISTS "Admins can manage all programs" ON public.programs;
CREATE POLICY "Admins can manage all programs"
  ON public.programs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
      AND users.role = 'manager'
    )
  );

-- Drop and recreate policies for project_status_history table
DROP POLICY IF EXISTS "Admins can view all status history" ON public.project_status_history;
CREATE POLICY "Admins can view all status history"
  ON public.project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
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
      AND u.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Submitters can view history of own projects" ON public.project_status_history;
CREATE POLICY "Submitters can view history of own projects"
  ON public.project_status_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_status_history.project_id
      AND p.submitter_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate policies for document_requests table
DROP POLICY IF EXISTS "Managers can create document requests" ON public.document_requests;
CREATE POLICY "Managers can create document requests"
  ON public.document_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update document requests" ON public.document_requests;
CREATE POLICY "Managers can update document requests"
  ON public.document_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for document_submissions table
DROP POLICY IF EXISTS "Managers can update document submissions" ON public.document_submissions;
CREATE POLICY "Managers can update document submissions"
  ON public.document_submissions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Fix overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create document submissions" ON public.document_submissions;
CREATE POLICY "Project submitters can create document submissions"
  ON public.document_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_requests dr
      JOIN public.projects p ON dr.project_id = p.id
      WHERE dr.id = document_submissions.request_id
      AND p.submitter_id = (SELECT auth.uid())
    )
  );

-- Drop and recreate policies for technical_support table
DROP POLICY IF EXISTS "Managers can manage technical support" ON public.technical_support;
CREATE POLICY "Managers can manage technical support"
  ON public.technical_support
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update technical support" ON public.technical_support;
CREATE POLICY "Managers can update technical support"
  ON public.technical_support
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for disbursement_plan table
DROP POLICY IF EXISTS "Managers can manage disbursement plans" ON public.disbursement_plan;
CREATE POLICY "Managers can manage disbursement plans"
  ON public.disbursement_plan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update disbursement plans" ON public.disbursement_plan;
CREATE POLICY "Managers can update disbursement plans"
  ON public.disbursement_plan
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for disbursement_tranches table
DROP POLICY IF EXISTS "Managers can manage disbursement tranches" ON public.disbursement_tranches;
CREATE POLICY "Managers can manage disbursement tranches"
  ON public.disbursement_tranches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update disbursement tranches" ON public.disbursement_tranches;
CREATE POLICY "Managers can update disbursement tranches"
  ON public.disbursement_tranches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- Drop and recreate policies for project_archives table
DROP POLICY IF EXISTS "Managers can manage project archives" ON public.project_archives;
CREATE POLICY "Managers can manage project archives"
  ON public.project_archives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Managers can update project archives" ON public.project_archives;
CREATE POLICY "Managers can update project archives"
  ON public.project_archives
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = (SELECT auth.uid())
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
      WHERE users.id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- =====================================================
-- 3. FIX FUNCTION SEARCH PATHS
-- =====================================================

-- Drop and recreate update_updated_at_column with secure search path
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Drop and recreate is_admin with secure search path
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Drop and recreate log_project_status_change with secure search path
DROP FUNCTION IF EXISTS public.log_project_status_change() CASCADE;
CREATE OR REPLACE FUNCTION public.log_project_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
    INSERT INTO public.project_status_history (
      project_id,
      from_status,
      to_status,
      changed_by,
      notes
    ) VALUES (
      NEW.id,
      CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END,
      NEW.status,
      auth.uid(),
      CASE
        WHEN TG_OP = 'INSERT' THEN 'Project created'
        ELSE 'Status changed from ' || COALESCE(OLD.status, 'null') || ' to ' || NEW.status
      END
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate trigger for project status changes
DROP TRIGGER IF EXISTS trigger_log_project_status_change ON public.projects;
CREATE TRIGGER trigger_log_project_status_change
  AFTER INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.log_project_status_change();

-- Recreate triggers for updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_partners_updated_at ON public.partners;
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_programs_updated_at ON public.programs;
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_form_templates_updated_at ON public.form_templates;
CREATE TRIGGER update_form_templates_updated_at
  BEFORE UPDATE ON public.form_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
