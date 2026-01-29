/**
 * Script pour réinitialiser le mot de passe du compte admin@woluma.com
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Charger les variables d'environnement depuis le fichier .env
function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf-8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    return env;
  } catch (error) {
    console.error('❌ Erreur lors de la lecture du fichier .env:', error.message);
    return {};
  }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuration chargée');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Service Role Key length: ${supabaseServiceRoleKey?.length || 0}`);
console.log(`   Service Role Key preview: ${supabaseServiceRoleKey?.substring(0, 50)}...`);
console.log('');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Requis: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('Valeurs lues:', { url: supabaseUrl, key: supabaseServiceRoleKey });
  process.exit(1);
}

// Créer le client admin Supabase
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Nouveau mot de passe
const NEW_PASSWORD = 'Welcome123!';
const ADMIN_EMAIL = 'admin@woluma.com';

async function resetAdminPassword() {
  try {
    console.log('🔍 Recherche du compte admin...\n');

    // Récupérer l'utilisateur admin depuis la table users
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', ADMIN_EMAIL)
      .maybeSingle();

    if (userError) {
      throw userError;
    }

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé avec l'email ${ADMIN_EMAIL}`);
      process.exit(1);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name}`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Auth User ID: ${user.auth_user_id}`);
    console.log('');

    if (!user.auth_user_id) {
      console.error('❌ Ce compte n\'a pas de auth_user_id');
      console.log('   Le compte d\'authentification n\'existe pas.');
      console.log('   Exécutez le script create-auth-accounts.mjs pour créer le compte d\'authentification.');
      process.exit(1);
    }

    // Réinitialiser le mot de passe via l'API admin
    console.log('🔑 Réinitialisation du mot de passe...\n');

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_user_id,
      {
        password: NEW_PASSWORD
      }
    );

    if (authError) {
      console.error('❌ Erreur lors de la réinitialisation du mot de passe:', authError.message);
      throw authError;
    }

    console.log('✅ Mot de passe réinitialisé avec succès!');
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ RÉINITIALISATION TERMINÉE');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n🔐 Informations de connexion:`);
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Mot de passe: ${NEW_PASSWORD}`);
    console.log('\n⚠️  IMPORTANT: Changez ce mot de passe après votre première connexion\n');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
resetAdminPassword();
