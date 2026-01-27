/*
  # Correction des comptes orphelins et configuration du storage

  1. Comptes orphelins
    - Crée les profils manquants dans `public.users` pour les comptes auth existants
    - ahmathbamba.mbacke@gmail.com (auth ID: 0b148d7e-32aa-4f95-a2b5-57308ffec1a8)
    - ahmathbamba.mbacke@esp.sn (auth ID: a3565908-74f2-4d6e-bcd9-6035bf24f715)

  2. Storage
    - Crée le bucket `submission-files` pour les fichiers de soumission
    - Configure les politiques RLS pour l'upload et le téléchargement
    - Limites: 50MB par fichier, types MIME autorisés (PDF, Word, Excel, images)

  3. Sécurité
    - Les utilisateurs authentifiés peuvent uploader leurs propres fichiers
    - Les administrateurs et managers peuvent accéder à tous les fichiers
    - Les submitters peuvent accéder uniquement à leurs propres fichiers
*/

-- Créer les profils manquants pour les comptes auth orphelins
INSERT INTO public.users (email, name, role, is_active, auth_user_id, created_at)
VALUES 
  (
    'ahmathbamba.mbacke@gmail.com',
    'Ahmath Bamba Mbacke',
    'submitter',
    true,
    '0b148d7e-32aa-4f95-a2b5-57308ffec1a8',
    now()
  ),
  (
    'ahmathbamba.mbacke@esp.sn',
    'Ahmath Bamba Mbacke ESP',
    'submitter',
    true,
    'a3565908-74f2-4d6e-bcd9-6035bf24f715',
    now()
  )
ON CONFLICT (email) DO NOTHING;

-- Créer le bucket submission-files s'il n'existe pas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'submission-files',
  'submission-files',
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
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own files" ON storage.objects;
DROP POLICY IF EXISTS "Admins and managers can read all files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;

-- Politique pour l'upload de fichiers (utilisateurs authentifiés)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour lire ses propres fichiers
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour que les admins et managers puissent lire tous les fichiers
CREATE POLICY "Admins and managers can read all files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.auth_user_id = auth.uid()
    AND users.role IN ('admin', 'manager')
  )
);

-- Politique pour supprimer ses propres fichiers
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour mettre à jour ses propres fichiers
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'submission-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
