/*
  # Add missing updated_at triggers

  1. Changes
    - Add updated_at trigger for disbursement_plan
    - Add updated_at trigger for disbursement_tranches
    - Add updated_at trigger for document_requests
    - Add updated_at trigger for technical_support
    - Add updated_at column and trigger for document_submissions

  2. Notes
    - These tables already have updated_at column but no automatic update trigger
    - document_submissions needs both column and trigger
    - project_status_history and user_sessions don't need updated_at (historical/session data)
*/

-- Add trigger for disbursement_plan
DROP TRIGGER IF EXISTS update_disbursement_plan_updated_at ON public.disbursement_plan;
CREATE TRIGGER update_disbursement_plan_updated_at 
  BEFORE UPDATE ON public.disbursement_plan 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for disbursement_tranches
DROP TRIGGER IF EXISTS update_disbursement_tranches_updated_at ON public.disbursement_tranches;
CREATE TRIGGER update_disbursement_tranches_updated_at 
  BEFORE UPDATE ON public.disbursement_tranches 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for document_requests
DROP TRIGGER IF EXISTS update_document_requests_updated_at ON public.document_requests;
CREATE TRIGGER update_document_requests_updated_at 
  BEFORE UPDATE ON public.document_requests 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for technical_support
DROP TRIGGER IF EXISTS update_technical_support_updated_at ON public.technical_support;
CREATE TRIGGER update_technical_support_updated_at 
  BEFORE UPDATE ON public.technical_support 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add updated_at column to document_submissions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'document_submissions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.document_submissions ADD COLUMN updated_at timestamptz DEFAULT now();
    UPDATE public.document_submissions SET updated_at = COALESCE(created_at, now()) WHERE updated_at IS NULL;
  END IF;
END $$;

-- Add trigger for document_submissions
DROP TRIGGER IF EXISTS update_document_submissions_updated_at ON public.document_submissions;
CREATE TRIGGER update_document_submissions_updated_at 
  BEFORE UPDATE ON public.document_submissions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();