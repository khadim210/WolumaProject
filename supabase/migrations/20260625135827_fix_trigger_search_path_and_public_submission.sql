
-- Fix 1: log_project_status_change broke after we set search_path=''
-- The function body uses unqualified table name "project_status_history"
-- which is not found when search_path is empty.
-- Solution: recreate with schema-qualified names AND keep search_path='' for security.

CREATE OR REPLACE FUNCTION public.log_project_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.project_status_history (
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
$$;

-- Fix 2: Public submission — allow the service role to create user profiles
-- when no session exists yet (e.g. email confirmation enabled).
-- The "service_role full access" policy already exists on users but only
-- applies to the supabaseAdmin client.
-- Ensure the anon role can INSERT into users when auth_user_id is set
-- (handled by a new policy restricted to the anon role for self-registration).
-- This covers the case where signUp returns no session.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users'
    AND policyname = 'Anon can create own profile after signup'
  ) THEN
    CREATE POLICY "Anon can create own profile after signup"
      ON users
      FOR INSERT
      TO anon
      WITH CHECK (auth_user_id = auth.uid());
  END IF;
END $$;
