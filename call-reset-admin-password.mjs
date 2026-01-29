/**
 * Script pour appeler la fonction Edge reset-admin-password
 */

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
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log('🔧 Appel de la fonction Edge reset-admin-password');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

async function callResetPassword() {
  try {
    const apiUrl = `${supabaseUrl}/functions/v1/reset-admin-password`;

    console.log(`📡 Appel de: ${apiUrl}`);
    console.log('');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@woluma.com'
      })
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Mot de passe réinitialisé avec succès!');
      console.log('');
      console.log('═══════════════════════════════════════════════');
      console.log('🔐 INFORMATIONS DE CONNEXION');
      console.log('═══════════════════════════════════════════════');
      console.log(`   Email: ${result.email}`);
      console.log(`   Mot de passe: ${result.new_password}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Changez ce mot de passe après votre première connexion');
      console.log('');
    } else {
      console.error('❌ Erreur:', result.error);
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'appel:', error.message);
  }
}

callResetPassword();
