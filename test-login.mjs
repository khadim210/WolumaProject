/**
 * Script pour tester la connexion admin
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Charger les variables d'environnement
function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf-8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const [key, ...value] = line.split('=');
      if (key && value.length > 0 && !key.trim().startsWith('#')) {
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
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('🧪 Test de connexion');
console.log('═══════════════════════════════════════════════\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testLogin() {
  const email = 'admin@woluma.com';
  const password = 'Welcome123!';

  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Mot de passe: ${password}`);
  console.log('');

  try {
    console.log('🔄 Tentative de connexion...\n');

    // Tenter la connexion
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ ERREUR D\'AUTHENTIFICATION:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Status: ${error.status}`);
      console.error(`   Code: ${error.code || 'N/A'}`);
      console.error('');

      // Vérifier si le compte existe
      console.log('🔍 Vérification du compte dans la base de données...\n');

      // On ne peut pas faire cette requête sans être authentifié
      // donc on utilise l'API admin
      return;
    }

    if (data.user) {
      console.log('✅ CONNEXION RÉUSSIE!');
      console.log('');
      console.log('Informations utilisateur:');
      console.log(`   ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Email confirmé: ${data.user.email_confirmed_at ? 'Oui' : 'Non'}`);
      console.log(`   Dernière connexion: ${data.user.last_sign_in_at || 'N/A'}`);
      console.log('');

      // Récupérer le profil utilisateur
      console.log('🔍 Récupération du profil utilisateur...\n');

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', data.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Erreur lors de la récupération du profil:', profileError.message);
      } else if (profile) {
        console.log('✅ Profil trouvé:');
        console.log(`   Nom: ${profile.name}`);
        console.log(`   Rôle: ${profile.role}`);
        console.log(`   Organisation: ${profile.organization || 'N/A'}`);
        console.log(`   Actif: ${profile.is_active ? 'Oui' : 'Non'}`);
      } else {
        console.error('❌ Aucun profil trouvé dans la table users');
      }

      // Se déconnecter
      await supabase.auth.signOut();
    }

  } catch (error) {
    console.error('❌ ERREUR FATALE:', error.message);
  }
}

testLogin();
