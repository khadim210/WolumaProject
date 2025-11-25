# Vérification du Workflow: Évaluation → Formalisation

## Flux Actuel Identifié

### 1. Soumission du Projet
- **Statut initial**: `draft`
- **Action**: Soumissionnaire crée et soumet le projet
- **Nouveau statut**: `submitted`

### 2. Évaluation du Projet

#### 2.1 Évaluation Manuelle/IA
- **Page**: `/dashboard/evaluation`
- **Fonction**: `handleSubmitEvaluation()` (ligne 265)
- **Actions**:
  - Calcul des scores pondérés
  - Enregistrement des commentaires
  - **Stockage de `recommendedStatus`** (valeurs possibles: `pre_selected`, `selected`, `rejected`)
  - **⚠️ Le statut reste `submitted`** (ligne 294)
  - `manuallySubmitted` reste `false`

#### 2.2 Validation de l'Évaluation
- **Fonction**: `handleSubmitEvaluatedProject()` (ligne 390)
- **Bouton**: "✅ Soumettre" (ligne 813-816)
- **Action**:
  ```typescript
  await updateProject(project.id, {
    status: project.recommendedStatus,  // Change vers 'selected', 'pre_selected', ou 'rejected'
    manuallySubmitted: true,
  });
  ```

### 3. Formalisation

#### 3.1 Projets Éligibles
- **Page**: `/dashboard/formalization`
- **Filtre** (ligne 91-93):
  ```typescript
  const selectedProjectsData = projects.filter(
    p => p.status === 'selected' || p.status === 'formalization'
  );
  ```

#### 3.2 Transition Manquante
- ❌ **Problème**: Pas de transition automatique de `selected` → `formalization`
- ⚠️ **Impact**: Les projets sélectionnés restent en statut `selected`

## Statuts de Projet Disponibles

```typescript
type ProjectStatus =
  | 'draft'          // Brouillon
  | 'submitted'      // Soumis pour évaluation
  | 'eligible'       // Éligible (après vérification)
  | 'ineligible'     // Non éligible
  | 'under_review'   // En cours de revue
  | 'pre_selected'   // Présélectionné
  | 'selected'       // Sélectionné (prêt pour formalisation)
  | 'formalization'  // En cours de formalisation
  | 'financed'       // Financé
  | 'monitoring'     // Suivi
  | 'closed'         // Clôturé
  | 'rejected'       // Rejeté
```

## Workflow Complet Vérifié

```
┌─────────┐
│  draft  │ (Création)
└────┬────┘
     │ Soumission
     ▼
┌──────────┐
│submitted │ (Évaluation en attente)
└────┬─────┘
     │ Évaluation IA/Manuelle
     │ (recommendedStatus stocké)
     ▼
┌──────────────────────┐
│ submitted            │
│ + recommendedStatus  │ (Évaluation terminée, attente validation)
└────┬─────────────────┘
     │ Clic sur "✅ Soumettre"
     ▼
┌────────────────┐
│ selected /     │
│ pre_selected / │ (Validation de l'évaluation)
│ rejected       │
└────┬───────────┘
     │ ✅ Accessible dans Formalisation
     ▼
┌──────────────┐
│formalization │ (Processus de formalisation)
└────┬─────────┘
     │
     ▼
┌─────────┐
│financed │
└─────────┘
```

## ✅ Validation du Workflow

### Ce qui fonctionne:
1. ✅ Les projets soumis (`submitted`) apparaissent dans la page d'évaluation
2. ✅ L'évaluation stocke les scores et `recommendedStatus`
3. ✅ Le bouton "Soumettre" change le statut vers `selected`, `pre_selected`, ou `rejected`
4. ✅ La page de formalisation accepte les projets avec statut `selected`

### Transition Évaluation → Formalisation:

**Étape 1**: Évaluation
- Le gestionnaire évalue le projet
- Les scores sont enregistrés
- Un statut est recommandé (`selected`, `pre_selected`, `rejected`)

**Étape 2**: Validation
- Le gestionnaire clique sur "✅ Soumettre" (ligne 813)
- Le statut du projet passe à `selected`
- `manuallySubmitted` = true

**Étape 3**: Accès à Formalisation
- Le projet avec statut `selected` apparaît automatiquement dans la page de formalisation
- Le gestionnaire peut commencer le processus de formalisation

## ✅ CONCLUSION

Le workflow fonctionne correctement:
1. Un projet **sélectionné** (`selected`) peut passer à l'étape de **formalisation**
2. La page de formalisation filtre et affiche les projets `selected` (ligne 91-93)
3. Le gestionnaire peut alors:
   - Demander des documents
   - Fournir un accompagnement technique
   - Créer un plan de décaissement
4. Une fois en formalisation active, le statut peut être changé manuellement vers `formalization`

### Flux Validé:
```
submitted → [Évaluation] → selected → [Formalisation] → formalization → financed
```

### Recommandations d'Amélioration (Optionnelles):
1. Ajouter un bouton "Démarrer la formalisation" qui change automatiquement le statut de `selected` → `formalization`
2. Ajouter une étape de confirmation avant de valider l'évaluation
3. Notification automatique au soumissionnaire quand son projet passe en formalisation
