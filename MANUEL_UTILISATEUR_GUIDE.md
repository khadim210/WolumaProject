# Guide d'utilisation du Générateur de Manuel Utilisateur

## Accès au générateur

Le générateur de manuel utilisateur est accessible à tous les utilisateurs connectés via le menu principal de l'application.

### Comment y accéder

1. **Connectez-vous** à l'application avec vos identifiants
2. Dans le **menu latéral gauche**, cliquez sur **"Manuel Utilisateur"** (icône de livre)
3. Vous accédez à la page de génération du manuel

### URL directe

Vous pouvez également accéder directement via l'URL :
```
/dashboard/user-manual
```

## Contenu du manuel généré

Le manuel utilisateur PDF généré couvre l'ensemble des fonctionnalités de la plateforme :

### 1. Introduction
- Présentation de l'application
- Rôles utilisateurs (Admin, Manager, Partner, Submitter)
- Prérequis techniques

### 2. Connexion et Inscription
- Création de compte
- Connexion à l'application
- Récupération de mot de passe

### 3. Tableau de bord
- Vue d'ensemble
- Navigation dans l'application

### 4. Soumission de Projets
- Créer un nouveau projet
- Vérification d'éligibilité
- Documents requis
- Soumission publique (sans compte)

### 5. Suivi de Projets
- Liste des projets
- Détails d'un projet
- Statuts des projets
- Modifier un projet

### 6. Évaluation (pour Managers)
- Accéder aux projets à évaluer
- Processus d'évaluation
- Évaluation IA (si configurée)

### 7. Formalisation
- Projets approuvés
- Demande de documents
- Plan de décaissement
- Support technique

### 8. Suivi et Monitoring
- Suivi des projets actifs
- Rapports périodiques

### 9. Statistiques et Rapports
- Tableaux de bord statistiques
- Export de données

### 10. Administration (pour Admins)
- Gestion des utilisateurs
- Gestion des partenaires
- Gestion des programmes
- Modèles de formulaires
- Configuration de l'IA
- Historique des statuts

### 11. Profil Utilisateur
- Modifier mon profil
- Changer mon mot de passe
- Se déconnecter

### 12. Bonnes Pratiques
- Sécurité
- Soumission de projets
- Qualité du dossier

### 13. Aide et Support
- Obtenir de l'aide
- Problèmes courants
- Contact

## Génération du PDF

### Étapes

1. Sur la page **Manuel Utilisateur**, cliquez sur le bouton **"Télécharger le Manuel PDF"**
2. La génération du PDF commence (cela peut prendre quelques secondes)
3. Le PDF est automatiquement téléchargé dans votre dossier de téléchargements

### Caractéristiques du PDF

- **Format** : A4 (210 x 297 mm)
- **Nombre de pages** : Environ 40-50 pages
- **Contenu** :
  - Page de garde avec logo et titre
  - Table des matières
  - 13 sections principales avec sous-sections
  - Instructions étape par étape
  - Numérotation des pages
  - En-têtes et pieds de page professionnels

### Nom du fichier

Le PDF généré est nommé automatiquement avec la date du jour :
```
Manuel_Utilisateur_YYYY-MM-DD.pdf
```

Exemple : `Manuel_Utilisateur_2026-02-09.pdf`

## Utilisation du manuel

### Pour les administrateurs

- Distribuez le manuel aux nouveaux utilisateurs
- Utilisez-le pour les sessions de formation
- Mettez-le à disposition sur votre intranet
- Imprimez-le si nécessaire

### Pour les utilisateurs

- Consultez le manuel avant la première utilisation
- Gardez-le comme référence pour les fonctionnalités avancées
- Partagez-le avec vos collègues

### Pour les partenaires

- Utilisez le manuel pour former vos équipes
- Référez-vous aux sections pertinentes selon votre rôle
- Consultez la section "Aide et Support" en cas de problème

## Mise à jour du manuel

Le contenu du manuel est intégré directement dans le code de l'application. Pour mettre à jour le contenu :

1. Ouvrir le fichier `/src/pages/admin/UserManualPage.tsx`
2. Modifier le contenu de la variable `manualContent`
3. Reconstruire l'application avec `npm run build`
4. Redéployer l'application

## Notes techniques

### Bibliothèques utilisées

- **jsPDF** : Génération du PDF
- **React** : Interface utilisateur
- **Lucide React** : Icônes

### Compatibilité

- Fonctionne sur tous les navigateurs modernes
- Pas de plugin nécessaire
- Génération côté client (aucune donnée envoyée au serveur)

### Sécurité

- Aucune donnée sensible n'est incluse dans le manuel
- Le manuel contient uniquement des instructions générales
- Peut être partagé librement

## Dépannage

### Le PDF ne se télécharge pas

1. Vérifiez que les popups ne sont pas bloqués
2. Vérifiez l'espace disque disponible
3. Essayez avec un autre navigateur
4. Videz le cache du navigateur

### Le PDF semble incomplet

1. Attendez que la génération soit complète
2. Vérifiez votre connexion Internet
3. Rechargez la page et réessayez

### Erreur lors de la génération

1. Rechargez la page
2. Déconnectez-vous et reconnectez-vous
3. Contactez le support technique

## Support

Pour toute question ou problème avec le générateur de manuel :

- **Email** : support@woluma.com
- **Documentation** : Ce fichier
- **Contact administrateur** : Via l'application

---

**Version** : 1.0
**Date de création** : 2026-02-09
**Dernière mise à jour** : 2026-02-09
