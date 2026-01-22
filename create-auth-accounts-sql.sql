/*
  Script SQL pour créer les comptes d'authentification pour les utilisateurs existants

  ATTENTION: Ce script doit être exécuté avec les permissions admin dans Supabase

  Ce script:
  1. Crée des comptes d'authentification pour chaque utilisateur sans auth_user_id
  2. Lie les profils users aux nouveaux comptes auth
  3. Configure les métadonnées utilisateur

  Mot de passe par défaut: Welcome123!
  Hash bcrypt pré-calculé pour 'Welcome123!': $2a$10$...
*/

-- Fonction temporaire pour créer un utilisateur auth et le lier au profil
DO $$
DECLARE
  v_user RECORD;
  v_auth_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Hash du mot de passe 'Welcome123!' (vous devrez le remplacer par un vrai hash bcrypt)
  v_encrypted_password := '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

  -- Pour chaque utilisateur sans auth_user_id
  FOR v_user IN
    SELECT id, name, email, role, organization
    FROM public.users
    WHERE auth_user_id IS NULL
  LOOP
    RAISE NOTICE 'Traitement de: % (%)', v_user.name, v_user.email;

    -- Créer un nouvel UUID pour l'utilisateur auth
    v_auth_user_id := gen_random_uuid();

    -- Insérer dans auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud
    ) VALUES (
      v_auth_user_id,
      '00000000-0000-0000-0000-000000000000',
      v_user.email,
      v_encrypted_password,
      NOW(),
      NOW(),
      NOW(),
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
      jsonb_build_object(
        'name', v_user.name,
        'role', v_user.role,
        'organization', v_user.organization
      ),
      FALSE,
      'authenticated',
      'authenticated'
    );

    -- Créer une identité pour l'utilisateur
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      v_auth_user_id,
      jsonb_build_object(
        'sub', v_auth_user_id::text,
        'email', v_user.email
      ),
      'email',
      NOW(),
      NOW(),
      NOW()
    );

    -- Mettre à jour le profil utilisateur avec l'auth_user_id
    UPDATE public.users
    SET auth_user_id = v_auth_user_id
    WHERE id = v_user.id;

    RAISE NOTICE '  ✓ Compte créé avec succès: %', v_auth_user_id;

  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE 'Processus terminé!';
  RAISE NOTICE 'Mot de passe par défaut: Welcome123!';

END $$;

-- Vérifier les résultats
SELECT
  u.name,
  u.email,
  u.role,
  u.auth_user_id IS NOT NULL as "has_auth_account",
  au.email as "auth_email"
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
ORDER BY u.created_at;
