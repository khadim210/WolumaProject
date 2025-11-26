# Guide de Nettoyage des Doublons - Instructions Complètes

## 🎯 Objectif

Supprimer automatiquement tous les programmes en double de votre base de données Supabase en conservant intelligemment la meilleure version de chaque programme.

## 📋 Pré-requis

- ✅ Accès à votre Dashboard Supabase
- ✅ Permissions d'édition SQL
- ✅ Fichier `clean_duplicates.sql` disponible

## 🚀 Méthode 1: Script SQL Automatique (RECOMMANDÉ)

### Étape 1: Accéder à Supabase

1. Ouvrir votre navigateur
2. Aller sur: https://supabase.com/dashboard
3. Se connecter à votre compte
4. Sélectionner votre projet

### Étape 2: Ouvrir l'Éditeur SQL

1. Dans le menu de gauche, cliquer sur **"SQL Editor"**
2. Cliquer sur **"New query"** (Nouvelle requête)

### Étape 3: Exécuter le Script

1. Ouvrir le fichier `clean_duplicates.sql` dans votre éditeur
2. **Copier tout le contenu** (Ctrl+A puis Ctrl+C)
3. **Coller** dans l'éditeur SQL de Supabase (Ctrl+V)
4. Cliquer sur le bouton **"Run"** (Exécuter) en bas à droite
5. **Attendre** la fin de l'exécution (quelques secondes)

### Étape 4: Lire le Rapport

Le script affiche un rapport détaillé:

```
╔════════════════════════════════════════════════════════════╗
║   NETTOYAGE INTELLIGENT DES PROGRAMMES DUPLIQUÉS          ║
╚════════════════════════════════════════════════════════════╝

📊 STATISTIQUES INITIALES:
   Total programmes: 10

🔍 ANALYSE DES DOUBLONS:

   ⚠️  Groupe 3 doublons: "Innovation Technologique 2025"
   ⚠️  Groupe 2 doublons: "Transition Énergétique Durable"

   Total groupes de doublons: 2

🧹 DÉBUT DU NETTOYAGE...

   ✅ CONSERVATION: "Innovation Technologique 2025"
      ID: a1b2c3d4...
      Créé: 2025-11-26 14:30
      Projets: 3
      Verrouillé: false

      ❌ Supprimé: e5f6g7h8...
      ❌ Supprimé: i9j0k1l2...

╔════════════════════════════════════════════════════════════╗
║   RÉSULTATS DU NETTOYAGE                                  ║
╚════════════════════════════════════════════════════════════╝

📊 STATISTIQUES FINALES:
   Programmes avant: 10
   Programmes après: 5
   Doublons supprimés: 5
   Groupes nettoyés: 2

✅ NETTOYAGE TERMINÉ AVEC SUCCÈS!
```

## 🛡️ Stratégie de Conservation

Le script conserve le **meilleur** programme de chaque groupe selon ces priorités:

### Priorité 1: Programme Verrouillé 🔒
- Si un programme est verrouillé (`is_locked = true`)
- Il est automatiquement conservé
- Les autres sont supprimés

### Priorité 2: Projets Associés 📊
- Le programme avec le **plus de projets** est conservé
- Exemple: Programme A (5 projets) vs Programme B (0 projets)
- → Programme A est conservé

### Priorité 3: Plus Récent 📅
- Si aucune des priorités ci-dessus ne s'applique
- Le programme le plus **récent** (created_at DESC) est conservé
- Les plus anciens sont supprimés

### Sécurité: Réassignation Automatique 🔄

Si un programme supprimé avait des projets associés:
- Les projets sont **automatiquement réassignés** au programme conservé
- **Aucun projet n'est perdu**
- Message de log: "Projets réassignés: XXX → YYY"

## 📊 Vérification Post-Nettoyage

### Option 1: Via le Script (déjà inclus)

Le script affiche automatiquement:
- Nombre de doublons supprimés
- Liste des programmes restants
- Statistiques complètes

### Option 2: Requête Manuelle

Pour vérifier qu'il n'y a plus de doublons:

```sql
-- Doit retourner 0 lignes
SELECT
  LOWER(TRIM(name)) as nom,
  COUNT(*) as nombre
FROM programs
GROUP BY LOWER(TRIM(name))
HAVING COUNT(*) > 1;
```

### Option 3: Via l'Interface Application

1. Aller sur: **Admin > Gestion des programmes**
2. Vérifier que le bouton **"doublons détectés"** n'apparaît plus
3. Si le bouton est présent, cliquer dessus pour voir les détails

## 🔧 Méthode 2: Interface Application (Alternative)

Si vous préférez utiliser l'interface de l'application:

### Étape 1: Accéder à la Page

1. Lancer l'application
2. Se connecter en tant qu'**Admin**
3. Aller sur: **Admin > Gestion des programmes**

### Étape 2: Détecter les Doublons

- Si des doublons existent:
  - Bouton orange: **"⚠️ X doublons détectés"**
  - Cliquer dessus

### Étape 3: Supprimer Manuellement

Pour chaque groupe de doublons:
1. **Comparer** les informations (dates, budgets, gestionnaires)
2. Identifier le programme à **conserver** (voir stratégie ci-dessus)
3. Cliquer sur **"Supprimer"** pour les autres
4. Confirmer la suppression

**⚠️ Attention:** Cette méthode est manuelle et prend plus de temps.

## 🎨 Cas d'Usage

### Cas 1: Après un Redéploiement

**Situation:**
- Application redéployée sur 3 machines
- Chaque machine a créé les mêmes programmes de seed
- Total: 6 programmes (2 × 3)

**Solution:**
1. Exécuter `clean_duplicates.sql`
2. Résultat: 2 programmes uniques (les plus récents)
3. 4 doublons supprimés

### Cas 2: Mode DEMO Activé/Désactivé

**Situation:**
- VITE_DEMO_MODE changé plusieurs fois
- Programmes créés à chaque changement
- Doublons accumulés

**Solution:**
1. Désactiver le seed (déjà fait dans App.tsx)
2. Exécuter `clean_duplicates.sql`
3. Base nettoyée

### Cas 3: Programmes Avec Projets

**Situation:**
- Programme "Innovation 2025" (ID: AAA) → 10 projets
- Programme "Innovation 2025" (ID: BBB) → 0 projets
- Les deux existent en double

**Solution automatique:**
1. Script identifie AAA comme meilleur (10 projets)
2. BBB est supprimé
3. Les 10 projets restent associés à AAA
4. Rien n'est perdu

## ⚠️ Messages d'Erreur Possibles

### Erreur 1: Permission Denied

**Message:**
```
permission denied for table programs
```

**Cause:** Pas assez de permissions

**Solution:**
- Vérifier que vous êtes connecté avec le bon compte
- Utiliser un compte avec rôle `admin` ou `service_role`

### Erreur 2: Table Not Found

**Message:**
```
relation "programs" does not exist
```

**Cause:** Base de données non initialisée

**Solution:**
- Vérifier que les migrations ont été appliquées
- Exécuter les migrations initiales

### Erreur 3: Syntaxe Error

**Message:**
```
syntax error at or near...
```

**Cause:** Script mal copié

**Solution:**
- Copier à nouveau le script complet
- Vérifier qu'aucun caractère n'a été coupé

## 🔄 Fréquence Recommandée

### En Production
- **Après chaque redéploiement majeur**
- **Si le bouton "doublons détectés" apparaît**
- **Mensuel** (vérification préventive)

### En Développement
- **Après changements de configuration**
- **Avant passage en production**
- **Si localStorage a été vidé**

## 📝 Logs et Traçabilité

### Logs du Script

Le script génère des logs détaillés:

```
RAISE NOTICE '✅ Conservation: "Programme X"'
RAISE NOTICE '❌ Supprimé: ID abc123...'
RAISE NOTICE '↳ Projets réassignés: xxx → yyy'
```

Ces logs sont visibles:
- Dans l'onglet "Results" de Supabase SQL Editor
- Dans les logs du serveur Supabase

### Commentaire sur la Table

Le script ajoute automatiquement:

```sql
COMMENT ON TABLE programs IS 'Table des programmes - nettoyée des doublons le 2025-11-26';
```

Pour voir ce commentaire:
```sql
SELECT obj_description('programs'::regclass);
```

## 🎯 Checklist Complète

Avant de commencer:
- [ ] Backup de la base de données (optionnel mais recommandé)
- [ ] Accès à Supabase Dashboard
- [ ] Fichier `clean_duplicates.sql` disponible

Pendant l'exécution:
- [ ] Script copié dans SQL Editor
- [ ] Bouton "Run" cliqué
- [ ] Attendre la fin de l'exécution
- [ ] Lire le rapport

Après nettoyage:
- [ ] Vérifier le nombre de programmes restants
- [ ] Vérifier que les projets sont préservés
- [ ] Tester l'interface application
- [ ] Vérifier que le bouton "doublons" a disparu

## 💡 Conseils et Bonnes Pratiques

### ✅ À FAIRE

1. **Exécuter le script pendant les heures creuses**
   - Moins d'utilisateurs connectés
   - Moins de risque de conflit

2. **Vérifier les résultats après exécution**
   - Compter les programmes restants
   - Vérifier quelques programmes manuellement

3. **Documenter les suppressions**
   - Noter combien de doublons supprimés
   - Garder une trace dans les logs

### ❌ À ÉVITER

1. **Ne pas modifier le script sans comprendre**
   - Le script est optimisé et testé
   - Les modifications peuvent causer des pertes de données

2. **Ne pas exécuter plusieurs fois simultanément**
   - Risque de conflit
   - Le script est idempotent mais séquentiel

3. **Ne pas ignorer les messages d'erreur**
   - Lire attentivement les erreurs
   - Résoudre avant de continuer

## 🆘 Support

### Problème Non Résolu?

Si après l'exécution du script vous avez toujours des doublons:

1. **Vérifier les logs:** Y a-t-il des erreurs?
2. **Réexécuter le script:** Il est idempotent
3. **Vérifier manuellement:** Interface application
4. **Nettoyer localStorage:** Empêche re-seed

### Script Alternatif - Suppression Manuelle

Si le script automatique ne fonctionne pas:

```sql
-- Identifier manuellement les doublons
SELECT id, name, created_at
FROM programs
WHERE name = 'NOM_DU_PROGRAMME'
ORDER BY created_at DESC;

-- Supprimer manuellement (remplacer UUID_A_SUPPRIMER)
DELETE FROM programs WHERE id = 'UUID_A_SUPPRIMER';
```

## 📚 Ressources

- **Documentation Supabase:** https://supabase.com/docs
- **SQL Editor:** https://supabase.com/docs/guides/database/overview
- **Migrations:** https://supabase.com/docs/guides/cli/local-development

## ✅ Résumé

1. **Copier** `clean_duplicates.sql`
2. **Coller** dans Supabase SQL Editor
3. **Exécuter** (bouton "Run")
4. **Vérifier** le rapport
5. **Tester** l'application

**Temps total:** 2-5 minutes
**Risque:** Très faible (sécurité intégrée)
**Résultat:** Base de données propre sans doublons

---

**Date:** 2025-11-26
**Version:** 1.0
**Status:** ✅ PRÊT À L'EMPLOI
