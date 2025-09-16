/*
  # Initial Schema Migration

  1. New Tables
    - `users` - User accounts with roles and organizations
    - `partners` - Partner organizations
    - `programs` - Funding programs with criteria
    - `projects` - Project submissions with evaluations
    - `form_templates` - Dynamic form templates
    - `user_sessions` - Session management

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure user data and project information

  3. Data Types
    - Custom ENUM types for roles and statuses
    - JSONB fields for flexible data storage
    - UUID primary keys for security
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'partner', 'manager', 'submitter');
CREATE TYPE project_status AS ENUM (
  'draft', 'submitted', 'under_review', 'pre_selected', 
  'selected', 'formalization', 'financed', 'monitoring', 
  'closed', 'rejected'
);
CREATE TYPE field_type AS ENUM (
  'text', 'textarea', 'number', 'select', 'radio', 
  'checkbox', 'date', 'file', 'multiple_select'
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'submitter',
  organization VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_manager_id UUID REFERENCES users(id)
);

-- Form templates table
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  partner_id UUID NOT NULL REFERENCES partners(id),
  form_template_id UUID REFERENCES form_templates(id),
  budget DECIMAL(15,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  manager_id UUID REFERENCES users(id),
  selection_criteria JSONB DEFAULT '[]',
  evaluation_criteria JSONB DEFAULT '[]',
  custom_ai_prompt TEXT
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'draft',
  budget DECIMAL(15,2) NOT NULL,
  timeline VARCHAR(100) NOT NULL,
  submitter_id UUID NOT NULL REFERENCES users(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submission_date TIMESTAMPTZ,
  evaluation_scores JSONB,
  evaluation_comments JSONB,
  total_evaluation_score INTEGER,
  evaluation_notes TEXT,
  evaluated_by UUID REFERENCES users(id),
  evaluation_date TIMESTAMPTZ,
  formalization_completed BOOLEAN DEFAULT FALSE,
  nda_signed BOOLEAN DEFAULT FALSE,
  tags JSONB DEFAULT '[]',
  form_data JSONB,
  recommended_status project_status,
  manually_submitted BOOLEAN DEFAULT FALSE
);

-- User sessions table for better session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = auth_user_id OR EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role = 'admin'
  ));

-- RLS Policies for partners table
CREATE POLICY "Partners visible to authenticated users" ON partners
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage partners" ON partners
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- RLS Policies for programs table
CREATE POLICY "Programs visible to authenticated users" ON programs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage programs" ON programs
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- RLS Policies for projects table
CREATE POLICY "Users can read accessible projects" ON projects
  FOR SELECT TO authenticated
  USING (
    submitter_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager', 'partner'))
  );

CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (submitter_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update own draft projects" ON projects
  FOR UPDATE TO authenticated
  USING (
    (submitter_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()) AND status = 'draft') OR
    EXISTS (SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Managers and admins can delete projects" ON projects
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- RLS Policies for form_templates table
CREATE POLICY "Form templates visible to authenticated users" ON form_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins and managers can manage form templates" ON form_templates
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE auth_user_id = auth.uid() AND role IN ('admin', 'manager')
  ));

-- RLS Policies for user_sessions table
CREATE POLICY "Users can manage own sessions" ON user_sessions
  FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_partners_manager ON partners(assigned_manager_id);
CREATE INDEX IF NOT EXISTS idx_programs_partner ON programs(partner_id);
CREATE INDEX IF NOT EXISTS idx_programs_manager ON programs(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_submitter ON projects(submitter_id);
CREATE INDEX IF NOT EXISTS idx_projects_program ON projects(program_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON form_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();