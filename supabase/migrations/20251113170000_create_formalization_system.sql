/*
  # Système de Formalisation des Projets

  1. Nouvelles Tables
    - `document_requests` - Demandes de documents officiels
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `document_name` (text)
      - `document_type` (text)
      - `description` (text)
      - `requested_by` (uuid, foreign key to auth.users)
      - `requested_at` (timestamptz)
      - `due_date` (timestamptz)
      - `status` (text) - pending, submitted, validated, rejected
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `document_submissions` - Documents soumis
      - `id` (uuid, primary key)
      - `request_id` (uuid, foreign key)
      - `file_name` (text)
      - `file_path` (text)
      - `file_size` (integer)
      - `submitted_by` (text) - email du soumissionnaire
      - `submitted_at` (timestamptz)
      - `validation_status` (text) - pending, approved, rejected
      - `validation_notes` (text)
      - `validated_by` (uuid, foreign key to auth.users)
      - `validated_at` (timestamptz)
      - `created_at` (timestamptz)

    - `technical_support` - Accompagnement technique
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `support_type` (text) - formation, conseil, mentoring, autre
      - `title` (text)
      - `description` (text)
      - `scheduled_date` (timestamptz)
      - `duration_hours` (numeric)
      - `provider` (text)
      - `participants` (text)
      - `status` (text) - planned, in_progress, completed, cancelled
      - `completion_notes` (text)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `disbursement_plan` - Plan de décaissement
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `total_amount` (numeric)
      - `currency` (text)
      - `created_by` (uuid, foreign key to auth.users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `disbursement_tranches` - Tranches de décaissement
      - `id` (uuid, primary key)
      - `plan_id` (uuid, foreign key)
      - `tranche_number` (integer)
      - `amount` (numeric)
      - `percentage` (numeric)
      - `scheduled_date` (timestamptz)
      - `conditions` (text)
      - `status` (text) - pending, in_progress, disbursed, cancelled
      - `actual_disbursement_date` (timestamptz)
      - `actual_amount` (numeric)
      - `disbursement_reference` (text)
      - `notes` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `project_archives` - Archives des projets
      - `id` (uuid, primary key)
      - `project_id` (uuid, foreign key)
      - `archive_type` (text) - closure, export, backup
      - `archive_path` (text)
      - `archive_size` (bigint)
      - `status` (text) - active, archived, deleted
      - `archived_by` (uuid, foreign key to auth.users)
      - `archived_at` (timestamptz)
      - `notes` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz)

  2. Sécurité
    - Enable RLS sur toutes les tables
    - Politiques pour authentification et rôles
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
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Managers can update document requests"
  ON document_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
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
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
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
  ON technical_support FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  );

-- Table: disbursement_plan
CREATE TABLE IF NOT EXISTS disbursement_plan (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'FCFA' NOT NULL,
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
  ON disbursement_plan FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
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
  ON disbursement_tranches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
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
  ON project_archives FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
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
INSERT INTO storage.buckets (id, name, public)
VALUES ('formalization-documents', 'formalization-documents', false)
ON CONFLICT (id) DO NOTHING;

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
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.role IN ('admin', 'manager')
    )
  );
