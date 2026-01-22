/**
 * Script pour créer les comptes d'authentification pour les utilisateurs existants
 * et les lier aux profils dans la table users
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

console.log('🔧 Configuration chargée:');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NON DEFINIE'}`);
console.log(`   Service Role Key: ${supabaseServiceRoleKey ? supabaseServiceRoleKey.substring(0, 20) + '...' : 'NON DEFINIE'}`);
console.log('');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Requis: VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Créer le client admin Supabase
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Mot de passe par défaut pour tous les comptes créés
const DEFAULT_PASSWORD = 'Welcome123!';

async function createAuthAccounts() {
  try {
    console.log('🔍 Récupération des utilisateurs sans compte d\'authentification...\n');

    // Test de connexion
    const { data: testData, error: testError } = await supabaseAdmin
      .from('users')
      .select('count');

    if (testError) {
      console.error('❌ Erreur de connexion à Supabase:', testError);
      throw testError;
    }

    console.log('✅ Connexion à Supabase réussie\n');

    // Récupérer tous les utilisateurs qui n'ont pas de auth_user_id
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .is('auth_user_id', null);

    if (usersError) {
      throw usersError;
    }

    console.log(`📋 ${users.length} utilisateur(s) trouvé(s) sans compte d'authentification\n`);

    if (users.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà un compte d\'authentification');
      return;
    }

    // Pour chaque utilisateur, créer un compte d'authentification
    for (const user of users) {
      console.log(`\n👤 Traitement de: ${user.name} (${user.email})`);
      console.log(`   Rôle: ${user.role}`);

      try {
        // Créer le compte d'authentification avec l'API admin
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true, // Confirmer l'email automatiquement
          user_metadata: {
            name: user.name,
            role: user.role,
            organization: user.organization
          }
        });

        if (authError) {
          console.error(`   ❌ Erreur lors de la création du compte auth:`, authError.message);
          continue;
        }

        console.log(`   ✅ Compte d'authentification créé: ${authData.user.id}`);

        // Mettre à jour le profil utilisateur avec l'auth_user_id
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update({ auth_user_id: authData.user.id })
          .eq('id', user.id);

        if (updateError) {
          console.error(`   ❌ Erreur lors de la mise à jour du profil:`, updateError.message);

          // Supprimer le compte auth créé si la mise à jour échoue
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
          console.log(`   🔄 Compte auth supprimé (rollback)`);
          continue;
        }

        console.log(`   ✅ Profil lié au compte d'authentification`);
        console.log(`   🔑 Mot de passe par défaut: ${DEFAULT_PASSWORD}`);

      } catch (error) {
        console.error(`   ❌ Erreur inattendue:`, error.message);
      }
    }

    console.log('\n\n═══════════════════════════════════════════════');
    console.log('✅ PROCESSUS TERMINÉ');
    console.log('═══════════════════════════════════════════════');
    console.log(`\n⚠️  IMPORTANT:`);
    console.log(`   Mot de passe par défaut: ${DEFAULT_PASSWORD}`);
    console.log(`   Demandez aux utilisateurs de changer leur mot de passe lors de leur première connexion\n`);

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
createAuthAccounts();
