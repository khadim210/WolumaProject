# Déploiement sur Netlify - wolumaFlow.netlify.app

## Configuration Automatique

Ce projet est configuré pour être déployé automatiquement sur **wolumaFlow.netlify.app**.

### Fichiers de Configuration

#### `netlify.toml`
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production.environment]
  VITE_APP_URL = "https://wolumaFlow.netlify.app"
```

#### `public/_redirects`
```
/*    /index.html   200
```

Ce fichier assure que toutes les routes de l'application React Router fonctionnent correctement.

## Déploiement Initial

### 1. Créer le Site sur Netlify

#### Option A: Via l'Interface Web
1. Connectez-vous à [Netlify](https://app.netlify.com)
2. Cliquez sur "Add new site" > "Import an existing project"
3. Connectez votre dépôt Git (GitHub, GitLab, etc.)
4. Netlify détectera automatiquement les paramètres depuis `netlify.toml`

#### Option B: Via Netlify CLI
```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Initialiser le site
netlify init

# Déployer
netlify deploy --prod
```

### 2. Configurer le Nom du Site

1. Allez dans `Site settings` > `Site details`
2. Dans "Site name", changez-le en: **wolumaFlow**
3. Votre URL sera automatiquement: `https://wolumaFlow.netlify.app`

### 3. Configurer les Variables d'Environnement

**Important:** Vous devez ajouter les variables Supabase manuellement.

1. Allez dans `Site settings` > `Environment variables`
2. Cliquez sur "Add a variable"
3. Ajoutez les variables suivantes:

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | `https://votre-projet.supabase.co` | URL de votre projet Supabase |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGc...` | Clé anonyme Supabase |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | Clé service role (optionnel) |
| `VITE_DEMO_MODE` | `false` | Désactiver le mode démo |

**Note:** La variable `VITE_APP_URL` est déjà configurée dans `netlify.toml` avec la valeur `https://wolumaFlow.netlify.app`

### 4. Déclencher le Premier Déploiement

Après avoir ajouté les variables d'environnement:
1. Allez dans l'onglet "Deploys"
2. Cliquez sur "Trigger deploy" > "Deploy site"

Ou poussez un commit sur votre branche principale:
```bash
git add .
git commit -m "Configure Netlify deployment"
git push origin main
```

## Déploiements Automatiques

Une fois configuré, Netlify déploiera automatiquement:
- ✅ À chaque push sur la branche `main`
- ✅ À chaque merge de Pull Request
- ✅ Previews automatiques pour les branches et PRs

### Désactiver les Déploiements Auto (optionnel)
1. Allez dans `Site settings` > `Build & deploy` > `Continuous deployment`
2. Vous pouvez désactiver les auto-deployments si nécessaire

## Vérification Post-Déploiement

### 1. Vérifier l'URL de Production
Visitez: https://wolumaFlow.netlify.app

### 2. Tester les Liens de Soumission Publique

1. Connectez-vous à l'application
2. Allez dans `Admin` > `Gestion des Programmes`
3. Sélectionnez un programme
4. Vérifiez que le lien de soumission publique commence par:
   ```
   https://wolumaFlow.netlify.app/submit/...
   ```

5. Cliquez sur "Tester" pour vérifier que le formulaire s'ouvre correctement

### 3. Vérifier les Routes SPA

Testez que toutes les routes fonctionnent:
- ✅ `/` - Page d'accueil
- ✅ `/login` - Connexion
- ✅ `/register` - Inscription
- ✅ `/dashboard` - Tableau de bord
- ✅ `/submit/:programId` - Formulaire de soumission

Si vous obtenez une erreur 404 sur ces routes, vérifiez que:
- Le fichier `_redirects` existe dans `dist/`
- La configuration `[[redirects]]` est présente dans `netlify.toml`

## Domaine Personnalisé (Optionnel)

Pour utiliser un domaine personnalisé au lieu de `wolumaFlow.netlify.app`:

### 1. Ajouter le Domaine
1. Allez dans `Site settings` > `Domain management`
2. Cliquez sur "Add domain alias"
3. Entrez votre domaine: `app.woluma.com`

### 2. Configurer DNS
Ajoutez un enregistrement DNS chez votre registrar:
```
Type: CNAME
Name: app (ou @)
Value: wolumaFlow.netlify.app
```

### 3. Activer HTTPS
Netlify activera automatiquement HTTPS avec Let's Encrypt.

### 4. Mettre à Jour la Variable d'Environnement
1. Allez dans `Site settings` > `Environment variables`
2. Modifiez `VITE_APP_URL` (ou ajoutez-le):
   ```
   VITE_APP_URL=https://app.woluma.com
   ```
3. Redéployez le site

Ou mettez à jour `netlify.toml`:
```toml
[context.production.environment]
  VITE_APP_URL = "https://app.woluma.com"
```

## Rollback (Annuler un Déploiement)

Si un déploiement pose problème:
1. Allez dans l'onglet "Deploys"
2. Sélectionnez un déploiement précédent
3. Cliquez sur "Publish deploy"

## Logs et Monitoring

### Voir les Logs de Build
1. Allez dans "Deploys"
2. Cliquez sur un déploiement
3. Consultez les logs dans "Deploy log"

### Voir les Logs d'Exécution
Netlify fournit des analytics basiques:
1. Allez dans "Analytics"
2. Consultez le trafic, les erreurs, etc.

## Résolution de Problèmes

### Erreur: "Build failed"
1. Vérifiez les logs de build
2. Testez localement: `npm run build`
3. Vérifiez que Node 18 est utilisé

### Erreur: "Page not found" sur les routes
1. Vérifiez que `_redirects` existe dans `dist/`
2. Vérifiez la configuration `[[redirects]]` dans `netlify.toml`
3. Redéployez le site

### Variables d'environnement non prises en compte
1. Les variables doivent commencer par `VITE_` pour être accessibles
2. Redéployez après avoir ajouté des variables
3. Videz le cache: `Site settings` > `Build & deploy` > "Clear cache and deploy site"

### Lien de soumission incorrect
1. Vérifiez que `VITE_APP_URL` est définie correctement
2. Vérifiez dans `netlify.toml`: `VITE_APP_URL = "https://wolumaFlow.netlify.app"`
3. Redéployez le site
4. Videz le cache du navigateur (Ctrl+Shift+R)

## Commandes Utiles

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Se connecter
netlify login

# Lier le projet
netlify link

# Déployer en mode draft (prévisualisation)
netlify deploy

# Déployer en production
netlify deploy --prod

# Ouvrir le site dans le navigateur
netlify open:site

# Ouvrir l'admin Netlify
netlify open:admin

# Voir les variables d'environnement
netlify env:list

# Ajouter une variable d'environnement
netlify env:set VITE_SUPABASE_URL "https://votre-projet.supabase.co"
```

## Support

- Documentation Netlify: https://docs.netlify.com
- Support Netlify: https://www.netlify.com/support/
- Community Forums: https://answers.netlify.com/

---

**Site de Production:** https://wolumaFlow.netlify.app

**Configuration complète et automatique via `netlify.toml` et `public/_redirects`**
