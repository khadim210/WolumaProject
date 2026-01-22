/**
 * Script pour appeler la edge function qui crée les comptes d'authentification manquants
 */

import { readFileSync } from 'fs';
import https from 'https';

// Charger les variables d'environnement
function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf-8');
    const env = {};
    envFile.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        if (key && value) {
          env[key] = value;
        }
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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

console.log('🚀 Appel de la edge function pour créer les comptes d\'authentification...\n');

const functionUrl = `${supabaseUrl}/functions/v1/create-missing-auth-accounts`;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
  }
};

const url = new URL(functionUrl);

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const result = JSON.parse(data);

      console.log('═══════════════════════════════════════════════');
      console.log('📊 RÉSULTATS');
      console.log('═══════════════════════════════════════════════\n');

      if (result.success) {
        console.log(`✅ Succès!`);
        console.log(`📋 Total traité: ${result.total_processed} utilisateur(s)`);
        console.log(`🔑 Mot de passe par défaut: ${result.default_password}\n`);

        console.log('Détails par utilisateur:\n');
        result.results.forEach((r, index) => {
          console.log(`${index + 1}. ${r.user}`);
          if (r.status === 'success') {
            console.log(`   ✅ Compte créé avec succès`);
            console.log(`   🆔 Auth ID: ${r.auth_user_id}`);
          } else {
            console.log(`   ❌ Erreur: ${r.message}`);
          }
          console.log('');
        });

        console.log('═══════════════════════════════════════════════');
        console.log('⚠️  IMPORTANT:');
        console.log(`   Tous les comptes ont le mot de passe: ${result.default_password}`);
        console.log('   Demandez aux utilisateurs de le changer lors de leur première connexion');
        console.log('═══════════════════════════════════════════════\n');
      } else {
        console.error('❌ Échec:', result.error);
      }

    } catch (error) {
      console.error('❌ Erreur lors du parsing de la réponse:', error.message);
      console.error('Réponse brute:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur lors de l\'appel:', error.message);
});

req.end();
