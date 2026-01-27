/*
  # Système de Formalisation des Projets

  1. Nouvelles Tables
    - `document_requests` - Demandes de documents officiels
    - `document_submissions` - Documents soumis
    - `technical_support` - Accompagnement technique
    - `disbursement_plan` - Plan de décaissement
    - `disbursement_tranches` - Tranches de décaissement
    - `project_archives` - Archives des projets

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour authentification et rôles
    
  3. Storage
    - Bucket pour les documents de formalisation
    - Politiques RLS appropriées
*/

-- Table: document_requests
CREATE TABLE IF NOT EXISTS document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL DEFAULT 'other',
  description text,
  requested_by uuid REFERENCES auth.users(id) NOT NULL,
  requested_at timestamptz DEFAULT now() NOT NULL,
  due_date timestamptz,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'submitted', 'validated', 'rejected')),
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document requests"
  ON document_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can create document requests"
  ON document_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update document requests"
  ON document_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Table: document_submissions
CREATE TABLE IF NOT EXISTS document_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES document_requests(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer DEFAULT 0 NOT NULL,
  submitted_by text NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL,
  validation_status text DEFAULT 'pending' NOT NULL CHECK (validation_status IN ('pending', 'approved', 'rejected')),
  validation_notes text,
  validated_by uuid REFERENCES auth.users(id),
  validated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE document_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document submissions"
  ON document_submissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create document submissions"
  ON document_submissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Managers can update document submissions"
  ON document_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Table: technical_support
CREATE TABLE IF NOT EXISTS technical_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  support_type text DEFAULT 'formation' NOT NULL CHECK (support_type IN ('formation', 'conseil', 'mentoring', 'autre')),
  title text NOT NULL,
  description text,
  scheduled_date timestamptz,
  duration_hours numeric DEFAULT 0,
  provider text,
  participants text,
  status text DEFAULT 'planned' NOT NULL CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  completion_notes text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE technical_support ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view technical support"
  ON technical_support FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage technical support"
  ON technical_support FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update technical support"
  ON technical_support FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete technical support"
  ON technical_support FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Table: disbursement_plan
CREATE TABLE IF NOT EXISTS disbursement_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'XOF' NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE disbursement_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view disbursement plans"
  ON disbursement_plan FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage disbursement plans"
  ON disbursement_plan FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update disbursement plans"
  ON disbursement_plan FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete disbursement plans"
  ON disbursement_plan FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Table: disbursement_tranches
CREATE TABLE IF NOT EXISTS disbursement_tranches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES disbursement_plan(id) ON DELETE CASCADE NOT NULL,
  tranche_number integer NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric DEFAULT 0,
  scheduled_date timestamptz,
  conditions text,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'in_progress', 'disbursed', 'cancelled')),
  actual_disbursement_date timestamptz,
  actual_amount numeric,
  disbursement_reference text,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(plan_id, tranche_number)
);

ALTER TABLE disbursement_tranches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view disbursement tranches"
  ON disbursement_tranches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage disbursement tranches"
  ON disbursement_tranches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update disbursement tranches"
  ON disbursement_tranches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete disbursement tranches"
  ON disbursement_tranches FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Table: project_archives
CREATE TABLE IF NOT EXISTS project_archives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  archive_type text DEFAULT 'export' NOT NULL CHECK (archive_type IN ('closure', 'export', 'backup')),
  archive_path text,
  archive_size bigint DEFAULT 0,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'archived', 'deleted')),
  archived_by uuid REFERENCES auth.users(id) NOT NULL,
  archived_at timestamptz DEFAULT now() NOT NULL,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE project_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view project archives"
  ON project_archives FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage project archives"
  ON project_archives FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update project archives"
  ON project_archives FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can delete project archives"
  ON project_archives FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_requests_project_id ON document_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_document_requests_status ON document_requests(status);
CREATE INDEX IF NOT EXISTS idx_document_submissions_request_id ON document_submissions(request_id);
CREATE INDEX IF NOT EXISTS idx_technical_support_project_id ON technical_support(project_id);
CREATE INDEX IF NOT EXISTS idx_technical_support_status ON technical_support(status);
CREATE INDEX IF NOT EXISTS idx_disbursement_plan_project_id ON disbursement_plan(project_id);
CREATE INDEX IF NOT EXISTS idx_disbursement_tranches_plan_id ON disbursement_tranches(plan_id);
CREATE INDEX IF NOT EXISTS idx_project_archives_project_id ON project_archives(project_id);

-- Create storage bucket for formalization documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'formalization-documents',
  'formalization-documents',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
    'application/zip'
  ];

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Authenticated users can view formalization documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload formalization documents" ON storage.objects;
DROP POLICY IF EXISTS "Managers can delete formalization documents" ON storage.objects;

-- Storage policies for formalization documents
CREATE POLICY "Authenticated users can view formalization documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'formalization-documents');

CREATE POLICY "Authenticated users can upload formalization documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'formalization-documents');

CREATE POLICY "Managers can delete formalization documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'formalization-documents' AND
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.auth_user_id = auth.uid()
      AND users.role IN ('admin', 'manager')
    )
  );
