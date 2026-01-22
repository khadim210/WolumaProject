/**
 * Script simple pour créer des comptes via l'API REST Supabase
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
const supabaseServiceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Configuration:');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key length: ${supabaseServiceRoleKey?.length || 0}`);
console.log('');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

// Fonction pour faire des requêtes HTTPS
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, supabaseUrl);

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    };

    const req = https.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(jsonData);
          } else {
            reject(new Error(jsonData.message || data));
          }
        } catch (error) {
          reject(new Error(data));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function createAuthAccounts() {
  try {
    console.log('🔍 Récupération des utilisateurs...\n');

    // Récupérer les utilisateurs sans auth_user_id
    const users = await makeRequest('GET', '/rest/v1/users?auth_user_id=is.null&select=*');

    console.log(`📋 ${users.length} utilisateur(s) trouvé(s) sans compte d'authentification\n`);

    if (users.length === 0) {
      console.log('✅ Tous les utilisateurs ont déjà un compte d\'authentification');
      return;
    }

    const DEFAULT_PASSWORD = 'Welcome123!';

    for (const user of users) {
      console.log(`\n👤 Traitement de: ${user.name} (${user.email})`);

      try {
        // Créer le compte d'authentification via l'API admin
        const authUser = await makeRequest('POST', '/auth/v1/admin/users', {
          email: user.email,
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role,
            organization: user.organization
          }
        });

        console.log(`   ✅ Compte créé: ${authUser.id}`);

        // Mettre à jour le profil
        await makeRequest('PATCH', `/rest/v1/users?id=eq.${user.id}`, {
          auth_user_id: authUser.id
        });

        console.log(`   ✅ Profil lié`);

      } catch (error) {
        console.error(`   ❌ Erreur:`, error.message);
      }
    }

    console.log('\n\n✅ PROCESSUS TERMINÉ');
    console.log(`⚠️  Mot de passe par défaut: ${DEFAULT_PASSWORD}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

createAuthAccounts();
