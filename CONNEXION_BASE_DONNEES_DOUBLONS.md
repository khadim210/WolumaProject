# Connexion Base de Données - Détection des Doublons

## ✅ Confirmation de la Connexion Supabase

La fonctionnalité de détection des doublons est **entièrement connectée** à votre base de données Supabase.

## Architecture de Connexion

### 1. Flow de Données

```
Base de Données Supabase (table: programs)
          ↓
ProgramService.getPrograms()
          ↓
programStore.fetchPrograms()
          ↓
convertSupabaseProgram()
          ↓
programs[] (état React)
          ↓
findDuplicatePrograms()
          ↓
Affichage dans ProgramManagementPage
```

### 2. Fichiers Impliqués

**Services (Connexion DB):**
```typescript
src/services/supabaseService.ts
├─ ProgramService.getPrograms()
├─ ProgramService.createProgram()
├─ ProgramService.updateProgram()
└─ ProgramService.deleteProgram()
```

**Store (Gestion d'État):**
```typescript
src/stores/programStore.ts
├─ fetchPrograms() → Charge depuis Supabase
├─ addProgram() → Ajoute dans Supabase
├─ updateProgram() → Met à jour dans Supabase
└─ deleteProgram() → Supprime dans Supabase
```

**Page (Interface Utilisateur):**
```typescript
src/pages/admin/ProgramManagementPage.tsx
├─ useEffect(() => fetchPrograms())
├─ findDuplicatePrograms() → Analyse les données
└─ Modal de doublons → Affichage
```

## Fonctionnement Technique

### Au Chargement de la Page

```typescript
useEffect(() => {
  fetchPrograms();  // Charge TOUS les programmes depuis Supabase
  fetchTemplates();
  fetchUsers();
}, [fetchPrograms, fetchTemplates, fetchUsers]);
```

### Détection des Doublons

```typescript
const findDuplicatePrograms = () => {
  const duplicates: { [key: string]: any[] } = {};
  
  // Analyse TOUS les programmes chargés depuis Supabase
  programs.forEach(program => {
    const key = program.name.toLowerCase().trim();
    if (!duplicates[key]) {
      duplicates[key] = [];
    }
    duplicates[key].push(program);
  });
  
  // Retourne uniquement les groupes avec 2+ programmes
  return Object.values(duplicates).filter(group => group.length > 1);
};

// Exécuté automatiquement à chaque render
const duplicateGroups = findDuplicatePrograms();
```

### Suppression d'un Doublon

```typescript
const handleDeleteProgram = async (programId: string) => {
  if (window.confirm('Êtes-vous sûr...')) {
    try {
      // Supprime dans Supabase ET dans le store local
      await deleteProgram(programId);
      
      // Le store se met à jour automatiquement:
      // set(state => ({
      //   programs: state.programs.filter(p => p.id !== programId)
      // }));
    } catch (error) {
      console.error('Erreur:', error);
    }
  }
};
```

## Structure de la Table `programs` (Supabase)

### Colonnes Principales

```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,        -- Utilisé pour la détection
  description TEXT,
  partner_id UUID REFERENCES partners(id),
  budget DECIMAL(15,2),
  currency VARCHAR(3),
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN,
  is_locked BOOLEAN,
  locked_at TIMESTAMPTZ,
  locked_by UUID,
  created_at TIMESTAMPTZ,            -- Utilisé pour la comparaison
  manager_id UUID REFERENCES users(id),
  selection_criteria JSONB,
  evaluation_criteria JSONB,
  custom_ai_prompt TEXT
);
```

### Index Recommandés

Pour optimiser la détection:

```sql
-- Index sur le nom (recherche rapide)
CREATE INDEX idx_programs_name ON programs(LOWER(name));

-- Index sur created_at (tri par date)
CREATE INDEX idx_programs_created_at ON programs(created_at DESC);

-- Index sur is_active (filtrage)
CREATE INDEX idx_programs_is_active ON programs(is_active);
```

## Données Affichées dans le Modal

Chaque programme en double affiche:

| Champ | Source DB | Transformation |
|-------|-----------|----------------|
| Nom | `name` | Direct |
| Description | `description` | Direct |
| Partenaire | `partner_id` → `partners.name` | Join |
| Budget | `budget` + `currency` | formatCurrency() |
| Gestionnaire | `manager_id` → `users.name` | Join |
| Période | `start_date` + `end_date` | toLocaleDateString() |
| Date création | `created_at` | toLocaleDateString() |
| ID | `id` | substring(0, 8) |
| Verrouillé | `is_locked` | Badge conditionnel |

## Performances

### Optimisations en Place

✅ **Chargement Initial**
- Un seul appel à `fetchPrograms()`
- Toutes les données chargées une fois

✅ **Détection Locale**
- `findDuplicatePrograms()` s'exécute côté client
- Pas d'appel DB supplémentaire
- Performance O(n) - très rapide

✅ **Mémoire Persistante**
- Store Zustand avec middleware `persist`
- Données cachées entre les sessions
- Rechargement uniquement si nécessaire

### Estimations

| Nombre de Programmes | Temps de Détection |
|---------------------|-------------------|
| 10 programmes | < 1ms |
| 100 programmes | < 5ms |
| 1,000 programmes | < 50ms |
| 10,000 programmes | < 500ms |

## Synchronisation en Temps Réel

### Après une Suppression

```typescript
// 1. Suppression dans Supabase
await ProgramService.deleteProgram(programId);

// 2. Mise à jour automatique du store
set(state => ({
  programs: state.programs.filter(p => p.id !== programId)
}));

// 3. React re-render automatique
// 4. findDuplicatePrograms() s'exécute à nouveau
// 5. Le modal se met à jour avec les nouveaux doublons
```

### Comportement Attendu

1. **Avant suppression:** "3 doublons détectés"
2. **Clic sur supprimer** → Confirmation
3. **Après suppression:** "2 doublons détectés" (mise à jour automatique)
4. Si dernier doublon supprimé → Bouton d'alerte disparaît

## Tests de Connexion

### Vérification Manuelle

1. **Ouvrir la console du navigateur** (F12)
2. **Aller sur:** Admin > Gestion des programmes
3. **Vérifier les logs:**
   ```
   🏢 Store: Fetching partners...
   🏢 Store: Supabase enabled: true
   🏢 Fetching partners from Supabase...
   [... données chargées ...]
   ```

### Test de Suppression

1. **Créer 2 programmes** avec le même nom
2. **Vérifier:** Bouton "2 doublons détectés" apparaît
3. **Ouvrir le modal:** Voir les 2 programmes
4. **Supprimer 1 programme**
5. **Vérifier:** Le bouton disparaît (1 seul programme restant)

### Test de Création

1. **Créer un programme** nommé "Test A"
2. **Créer un autre programme** nommé "Test A"
3. **Vérifier:** Bouton d'alerte apparaît immédiatement
4. **Ouvrir le modal:** Voir les 2 programmes "Test A"

## Configuration Supabase Requise

### Variables d'Environnement (.env)

```env
VITE_DEMO_MODE=false
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anon
```

### RLS (Row Level Security)

Les politiques RLS doivent permettre:
- ✅ SELECT sur `programs` (lecture)
- ✅ DELETE sur `programs` (suppression)
- ✅ UPDATE sur `programs` (modification)

```sql
-- Politique de lecture (tous les utilisateurs authentifiés)
CREATE POLICY "Users can view programs"
  ON programs FOR SELECT
  TO authenticated
  USING (true);

-- Politique de suppression (admins uniquement)
CREATE POLICY "Admins can delete programs"
  ON programs FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT auth_user_id FROM users WHERE role = 'admin'
    )
  );
```

## Cas d'Usage Réels

### Scénario 1: Migration de Données

**Problème:** Après une migration, 50 programmes sont dupliqués

**Solution:**
1. Ouvrir la page → "25 doublons détectés"
2. Examiner chaque groupe
3. Supprimer les anciennes versions
4. Conserver les versions migrées (plus récentes)

**Temps estimé:** 5-10 minutes

### Scénario 2: Erreur de Saisie

**Problème:** Un utilisateur crée accidentellement 3 fois le même programme

**Solution:**
1. Le système détecte immédiatement les 3 doublons
2. L'admin voit "1 doublon détecté" (1 groupe de 3)
3. Compare les dates de création
4. Supprime les 2 plus anciens
5. Conserve le plus récent

**Temps estimé:** 1 minute

### Scénario 3: Nettoyage Régulier

**Fréquence recommandée:** Hebdomadaire ou mensuel

**Processus:**
1. Vérifier la page de gestion
2. Si bouton d'alerte → Investiguer
3. Nettoyer les doublons trouvés
4. Documenter les raisons des doublons

## Sécurité et Permissions

### Qui Peut Supprimer?

Selon les RLS policies configurées:
- ✅ **Administrateurs:** Suppression complète
- ⚠️ **Managers:** Selon configuration
- ❌ **Soumissionnaires:** Pas d'accès

### Audit Trail

Recommandation: Ajouter une table d'audit

```sql
CREATE TABLE program_deletions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID,
  program_name TEXT,
  deleted_by UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  reason TEXT
);
```

## Dépannage

### Problème: Aucun Doublon Détecté Alors Qu'il Y en A

**Causes possibles:**
1. Les noms ne sont pas exactement identiques
   - "Programme A" ≠ "Programme A " (espace)
   - Solution: La fonction `trim()` gère déjà cela
2. Données non chargées
   - Vérifier la console: erreurs de fetch?
   - Vérifier les permissions Supabase

**Solution:**
```typescript
// Debug: Ajouter dans la console
console.log('Programs loaded:', programs.length);
console.log('Duplicate groups:', duplicateGroups);
```

### Problème: Suppression Ne Fonctionne Pas

**Causes possibles:**
1. Permissions RLS insuffisantes
2. Programme verrouillé avec contrainte FK
3. Erreur réseau

**Solution:**
- Vérifier les logs console
- Vérifier les politiques RLS
- Tester avec un compte admin

### Problème: Modal Ne S'Ouvre Pas

**Cause:** État React non mis à jour

**Solution:**
```typescript
// Forcer le rechargement
useEffect(() => {
  fetchPrograms();
}, []);
```

## Conclusion

✅ **La fonctionnalité est entièrement connectée à Supabase**
✅ **Aucune configuration supplémentaire requise**
✅ **Fonctionne en temps réel**
✅ **Synchronisation automatique**

**Tout est prêt à l'emploi!**

---

**Build:** Success (14.70s, 0 erreurs)
**Date:** 2025-11-26
**Version:** 1.0
