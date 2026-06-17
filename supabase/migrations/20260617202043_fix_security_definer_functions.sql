
-- Fix mutable search_path on log_project_status_change
ALTER FUNCTION public.log_project_status_change()
  SET search_path = '';

-- Revoke EXECUTE from anon and authenticated on all exposed SECURITY DEFINER functions

REVOKE EXECUTE ON FUNCTION public.has_any_role(public.user_role[]) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(public.user_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_manager() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_manager() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_project_status_change() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
