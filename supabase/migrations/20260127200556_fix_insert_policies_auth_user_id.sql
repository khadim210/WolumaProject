/*
  # Fix INSERT Policies to Use auth_user_id

  ## Problem
  Several INSERT policies use WITH CHECK with `users.id = auth.uid()` instead of `users.auth_user_id = auth.uid()`.

  ## Affected Tables
  - document_requests
  - technical_support
  - disbursement_plan
  - disbursement_tranches
  - project_archives

  ## Changes
  Update all INSERT policies to use `auth_user_id` instead of `id`.
*/

-- FIX DOCUMENT_REQUESTS INSERT POLICY
DROP POLICY IF EXISTS "Managers can create document requests" ON public.document_requests;
CREATE POLICY "Managers can create document requests"
  ON public.document_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- FIX TECHNICAL_SUPPORT INSERT POLICY
DROP POLICY IF EXISTS "Managers can manage technical support" ON public.technical_support;
CREATE POLICY "Managers can manage technical support"
  ON public.technical_support
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- FIX DISBURSEMENT_PLAN INSERT POLICY
DROP POLICY IF EXISTS "Managers can manage disbursement plans" ON public.disbursement_plan;
CREATE POLICY "Managers can manage disbursement plans"
  ON public.disbursement_plan
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- FIX DISBURSEMENT_TRANCHES INSERT POLICY
DROP POLICY IF EXISTS "Managers can manage disbursement tranches" ON public.disbursement_tranches;
CREATE POLICY "Managers can manage disbursement tranches"
  ON public.disbursement_tranches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );

-- FIX PROJECT_ARCHIVES INSERT POLICY
DROP POLICY IF EXISTS "Managers can manage project archives" ON public.project_archives;
CREATE POLICY "Managers can manage project archives"
  ON public.project_archives
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = (SELECT auth.uid())
      AND users.role IN ('admin', 'manager')
    )
  );
