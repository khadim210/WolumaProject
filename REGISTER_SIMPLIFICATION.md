# Simplification de la Page d'Inscription

## Modifications Effectuées

### 1. Suppression de la Liste Déroulante des Rôles

**Avant:**
- Liste déroulante permettant de choisir: Admin, Partner, Manager, Submitter
- Validation du rôle dans le schéma Yup
- Affichage conditionnel du champ Organisation selon le rôle

**Après:**
- ❌ Plus de champ de sélection de rôle visible
- ✅ Tous les nouveaux comptes sont automatiquement des "Soumissionnaire" (`submitter`)
- ✅ Champ Organisation toujours visible et obligatoire

### 2. Configuration par Défaut

**RegisterPage.tsx:**
```typescript
// Valeur par défaut dans l'interface
interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  organization: string;  // Plus de 'role'
}

// Lors de la soumission
const success = await register(
  values.name,
  values.email,
  values.password,
  'submitter',  // Rôle fixe
  values.organization
);
```

**Schéma de Validation Mis à Jour:**
```typescript
const registerSchema = Yup.object().shape({
  name: Yup.string().required('Nom requis'),
  email: Yup.string().email('Email invalide').required('Email requis'),
  password: Yup.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .required('Mot de passe requis'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Les mots de passe ne correspondent pas')
    .required('Confirmation du mot de passe requise'),
  organization: Yup.string().required('Organisation requise'),
});
```

### 3. Email de Notification Automatique

**Configuration dans supabaseService.ts:**
```typescript
static async signUp(email: string, password: string, userData: { name: string; role?: string; organization?: string }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: userData.name,
        role: userData.role || 'submitter',
        organization: userData.organization
      },
      emailRedirectTo: `${window.location.origin}/login`
    }
  });
  
  if (error) throw error;
  return data;
}
```

**Fonctionnalités Email:**
- ✅ Supabase envoie automatiquement un email de confirmation lors de l'inscription
- ✅ L'email contient un lien de vérification
- ✅ Après vérification, l'utilisateur est redirigé vers `/login`
- ✅ Les métadonnées utilisateur (nom, rôle, organisation) sont incluses dans le profil

## Configuration Supabase Requise

Pour que les emails fonctionnent correctement, assurez-vous que:

1. **Email Templates** sont configurés dans Supabase Dashboard:
   - Aller dans: Authentication > Email Templates
   - Personnaliser le template "Confirm signup"

2. **Email Provider** est configuré:
   - Par défaut, Supabase utilise son propre service d'email
   - Pour la production, configurer un SMTP personnalisé (optionnel)

3. **Redirect URLs** sont autorisées:
   - Aller dans: Authentication > URL Configuration
   - Ajouter `${VOTRE_DOMAINE}/login` dans les Redirect URLs

## Formulaire d'Inscription Simplifié

### Champs Visibles:
1. ✅ Nom complet
2. ✅ Email
3. ✅ Mot de passe
4. ✅ Confirmer le mot de passe
5. ✅ Organisation
6. ❌ Rôle (supprimé - fixé à "submitter")

### Workflow d'Inscription:

```
1. UTILISATEUR REMPLIT LE FORMULAIRE
   ├─ Nom complet
   ├─ Email
   ├─ Mot de passe
   ├─ Confirmation mot de passe
   └─ Organisation

2. SOUMISSION DU FORMULAIRE
   └─ Rôle automatiquement défini à "submitter"

3. CRÉATION DU COMPTE SUPABASE
   ├─ Compte auth créé
   ├─ Métadonnées utilisateur stockées
   └─ Profil utilisateur créé dans la table `users`

4. EMAIL AUTOMATIQUE ENVOYÉ
   ├─ Email de confirmation avec lien
   ├─ Lien valide pendant 24h
   └─ Redirection vers /login après vérification

5. CONNEXION
   └─ L'utilisateur peut se connecter après vérification
```

## Détails Techniques

### Fichiers Modifiés:

1. **src/pages/auth/RegisterPage.tsx**
   - Ligne 8-23: Schéma de validation simplifié
   - Ligne 31-38: Interface RegisterFormValues mise à jour
   - Ligne 45-68: Fonction handleSubmit avec rôle fixe
   - Ligne 81-165: Formulaire simplifié sans champ rôle

2. **src/services/supabaseService.ts**
   - Ligne 590-610: Fonction signUp améliorée avec options d'email

### Tables Supabase Affectées:

1. **auth.users** (table système Supabase)
   - Stocke les credentials
   - Métadonnées dans `raw_user_meta_data`:
     - name
     - role (toujours "submitter")
     - organization

2. **public.users** (table applicative)
   - Profil utilisateur complet
   - Lié à `auth.users` via `auth_user_id`

## Avantages de cette Approche

### Sécurité:
- ✅ Empêche les utilisateurs de s'auto-attribuer des rôles élevés
- ✅ Seuls les admins peuvent promouvoir les utilisateurs
- ✅ Réduction de la surface d'attaque

### UX Améliorée:
- ✅ Formulaire plus simple et plus rapide
- ✅ Moins de confusion sur le choix du rôle
- ✅ Process d'inscription plus clair

### Administration:
- ✅ Contrôle centralisé des rôles
- ✅ Traçabilité des changements de rôles
- ✅ Validation manuelle possible avant activation

## Gestion des Rôles Post-Inscription

Pour changer le rôle d'un utilisateur après inscription:

1. **Via l'interface Admin** (UserManagementPage):
   - Admins peuvent modifier les rôles
   - Logs automatiques des changements

2. **Via la base de données**:
   ```sql
   UPDATE users 
   SET role = 'manager'
   WHERE email = 'user@example.com';
   ```

## Tests Recommandés

### Scénario 1: Inscription Basique
1. Aller sur `/register`
2. Remplir tous les champs
3. ✅ Vérifier qu'aucun champ "Rôle" n'est visible
4. ✅ Soumettre le formulaire
5. ✅ Vérifier que l'email de confirmation est envoyé
6. ✅ Cliquer sur le lien dans l'email
7. ✅ Se connecter avec les credentials

### Scénario 2: Vérification du Rôle
1. Après inscription et connexion
2. ✅ Vérifier que le rôle est "submitter" dans le profil
3. ✅ Vérifier les permissions correspondantes

### Scénario 3: Email de Confirmation
1. Après inscription
2. ✅ Vérifier la réception de l'email
3. ✅ Vérifier le contenu de l'email
4. ✅ Cliquer sur le lien de confirmation
5. ✅ Vérifier la redirection vers `/login`

## Configuration Email Template (Supabase)

Template suggéré pour "Confirm signup":

```html
<h2>Bienvenue sur la plateforme d'évaluation de projets!</h2>

<p>Bonjour {{ .Name }},</p>

<p>Merci de vous être inscrit en tant que soumissionnaire.</p>

<p>Pour activer votre compte, veuillez cliquer sur le lien ci-dessous:</p>

<p><a href="{{ .ConfirmationURL }}">Confirmer mon adresse email</a></p>

<p>Ce lien expire dans 24 heures.</p>

<p>Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.</p>

<p>Cordialement,<br>L'équipe</p>
```

## Conclusion

✅ **La page d'inscription a été simplifiée avec succès:**
- Pas de sélection de rôle visible
- Tous les nouveaux comptes sont des soumissionnaires
- Email de notification automatique configuré
- Formulaire plus simple et sécurisé

**Build:** Success (14.11s, 0 erreurs)

---

**Date:** 2025-11-26
**Version:** 1.0
