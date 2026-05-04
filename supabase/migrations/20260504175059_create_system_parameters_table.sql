/*
  # Création de la table system_parameters

  1. Nouvelle table
    - `system_parameters` : stocke l'ensemble des paramètres système de l'application
      - Paramètres généraux (nom du site, langue, fuseau horaire)
      - Paramètres de sécurité (timeout session, tentatives de connexion)
      - Paramètres de notifications (SMTP, email)
      - Paramètres d'apparence (thème, couleurs)
      - Paramètres système (taille fichier max, maintenance)
      - Configuration Supabase
      - Configuration IA : clés API et modèles pour OpenAI, Anthropic, Google, Mistral, Cohere, HuggingFace, API custom

  2. Sécurité
    - RLS activé
    - Seuls les admins authentifiés peuvent lire et modifier les paramètres
*/

CREATE TABLE IF NOT EXISTS system_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- General
  site_name text DEFAULT 'Woluma-Flow',
  site_description text DEFAULT 'Plateforme d''Évaluation et de Financement de Projets',
  admin_email text DEFAULT 'admin@woluma.com',
  default_language text DEFAULT 'fr',
  timezone text DEFAULT 'UTC',

  -- Security
  session_timeout integer DEFAULT 480,
  max_login_attempts integer DEFAULT 5,
  require_email_verification boolean DEFAULT false,
  enable_two_factor boolean DEFAULT false,
  enable_password_policy boolean DEFAULT true,

  -- Notifications
  email_notifications boolean DEFAULT true,
  notify_new_submissions boolean DEFAULT true,
  notify_status_changes boolean DEFAULT true,
  notify_deadlines boolean DEFAULT true,
  smtp_server text DEFAULT '',
  smtp_port integer DEFAULT 587,
  smtp_secure boolean DEFAULT true,

  -- Appearance
  default_theme text DEFAULT 'light',
  show_branding boolean DEFAULT true,
  primary_color text DEFAULT '#003366',
  secondary_color text DEFAULT '#00BFFF',

  -- System
  max_projects_per_user integer DEFAULT 10,
  evaluation_deadline_days integer DEFAULT 30,
  max_file_size integer DEFAULT 10,
  enable_maintenance_mode boolean DEFAULT false,
  enable_registration boolean DEFAULT true,
  enable_backups boolean DEFAULT true,

  -- Database
  database_type text DEFAULT 'postgresql',
  database_mode text DEFAULT 'demo',
  database_host text DEFAULT 'localhost',
  database_port integer DEFAULT 5432,
  database_name text DEFAULT 'woluma_flow',
  database_username text DEFAULT 'postgres',
  database_password text DEFAULT '',
  database_ssl boolean DEFAULT false,

  -- Supabase
  supabase_url text DEFAULT '',
  supabase_anon_key text DEFAULT '',
  supabase_service_role_key text DEFAULT '',
  enable_supabase boolean DEFAULT true,

  -- AI Configuration
  ai_provider text DEFAULT 'openai',

  -- OpenAI
  openai_api_key text DEFAULT '',
  openai_model text DEFAULT 'gpt-4.1-mini',
  openai_org_id text DEFAULT '',

  -- Anthropic
  anthropic_api_key text DEFAULT '',
  anthropic_model text DEFAULT 'claude-sonnet-4-5',

  -- Google
  google_api_key text DEFAULT '',
  google_model text DEFAULT 'gemini-2.0-flash',

  -- Mistral
  mistral_api_key text DEFAULT '',
  mistral_model text DEFAULT 'mistral-large-latest',

  -- Cohere
  cohere_api_key text DEFAULT '',
  cohere_model text DEFAULT 'command',

  -- Hugging Face
  huggingface_api_key text DEFAULT '',
  huggingface_model text DEFAULT '',

  -- Custom API
  custom_api_url text DEFAULT '',
  custom_api_key text DEFAULT '',
  custom_api_headers text DEFAULT '',

  -- AI General Settings
  ai_temperature numeric DEFAULT 0.7,
  ai_max_tokens integer DEFAULT 2000,
  enable_ai_evaluation boolean DEFAULT false,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read system parameters"
  ON system_parameters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert system parameters"
  ON system_parameters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update system parameters"
  ON system_parameters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_user_id = auth.uid()
      AND users.role = 'admin'
    )
  );
