# Correction: Visibilité des Projets Éligibles dans l'Évaluation

## Problème Identifié

Les projets marqués comme **éligibles** (`status = 'eligible'`) n'étaient pas visibles dans la page d'évaluation.

### Ancien Code (EvaluationPage.tsx ligne 98-99)

```typescript
// Include projects that are submitted OR evaluated but waiting for manual submission
const isEvaluationPending = project.status === 'submitted' || 
                           (project.evaluationScores && !project.manuallySubmitted);
```

**Problème:** Seuls les projets avec statut `submitted` étaient inclus.

## Solution Implémentée

### Nouveau Code (EvaluationPage.tsx ligne 97-100)

```typescript
// Include projects that are submitted, eligible OR evaluated but waiting for manual submission
const isEvaluationPending = project.status === 'submitted' ||
                           project.status === 'eligible' ||
                           (project.evaluationScores && !project.manuallySubmitted);
```

**Amélioration:** Les projets avec statut `eligible` sont maintenant inclus dans le filtre.

## Flux de Travail Complet

### 1. Soumission
```
draft → submitted
```

### 2. Vérification d'Éligibilité (EligibilityPage)
```
submitted → eligible / ineligible
```

**Fonction:** Ligne 145 et 174 dans `EligibilityPage.tsx`
```typescript
// Marquer comme éligible
await updateProject(selectedProject, {
  status: 'eligible',
  eligibilityNotes: eligibilityNotes,
  eligibilityCheckedBy: user?.id,
  eligibilityCheckedAt: new Date()
});

// OU marquer comme non éligible
await updateProject(selectedProject, {
  status: 'ineligible',
  eligibilityNotes: eligibilityNotes,
  eligibilityCheckedBy: user?.id,
  eligibilityCheckedAt: new Date()
});
```

### 3. Évaluation (EvaluationPage)

**Projets Visibles:**
- ✅ `submitted` - Projets soumis mais pas encore vérifiés
- ✅ `eligible` - Projets marqués comme éligibles (NOUVEAU)
- ✅ Projets évalués mais non validés (`evaluationScores` présent et `!manuallySubmitted`)

```typescript
const submittedProjects = projects.filter(project => {
  const isEvaluationPending = project.status === 'submitted' ||
                             project.status === 'eligible' ||
                             (project.evaluationScores && !project.manuallySubmitted);
  
  return isEvaluationPending && isAccessible && matchesSearch && matchesProgram;
});
```

### 4. Validation et Sélection
```
eligible → [Évaluation] → selected / pre_selected / rejected
```

### 5. Formalisation
```
selected → formalization → financed
```

## Statuts des Projets

| Statut | Description | Visible dans Éligibilité | Visible dans Évaluation |
|--------|-------------|--------------------------|-------------------------|
| `draft` | Brouillon | ❌ | ❌ |
| `submitted` | Soumis | ✅ | ✅ |
| `eligible` | Éligible | ❌ (déjà traité) | ✅ (CORRIGÉ) |
| `ineligible` | Non éligible | ❌ (déjà traité) | ❌ |
| `pre_selected` | Présélectionné | ❌ | ❌ |
| `selected` | Sélectionné | ❌ | ❌ |
| `formalization` | En formalisation | ❌ | ❌ |
| `financed` | Financé | ❌ | ❌ |
| `rejected` | Rejeté | ❌ | ❌ |

## Impact de la Correction

### Avant la Correction ❌
1. Projet soumis → Vérification d'éligibilité
2. Marqué comme `eligible`
3. **❌ N'apparaît PAS dans la page d'évaluation**
4. Bloqué dans le workflow

### Après la Correction ✅
1. Projet soumis → Vérification d'éligibilité
2. Marqué comme `eligible`
3. **✅ Apparaît dans la page d'évaluation**
4. Peut être évalué et passer à `selected`

## Tests Recommandés

### Scénario 1: Projet Éligible Direct
1. Créer un projet
2. Soumettre le projet (`status = 'submitted'`)
3. Aller dans Éligibilité
4. Marquer comme éligible (`status = 'eligible'`)
5. ✅ Vérifier qu'il apparaît dans Évaluation

### Scénario 2: Workflow Complet
1. Projet soumis → Éligibilité → Éligible
2. Éligible → Évaluation → Scores attribués
3. Validation → Selected
4. Selected → Visible dans Formalisation

## Fichiers Modifiés

1. **EvaluationPage.tsx** (ligne 90-106)
   - Ajout de `project.status === 'eligible'` dans le filtre
   - Mise à jour du commentaire pour refléter le changement

## Conclusion

✅ **Les projets éligibles sont maintenant correctement visibles dans la page d'évaluation.**

Le workflow est complet:
```
draft → submitted → eligible → [évaluation] → selected → formalization → financed
```

**Build:** Success (15.24s, 0 erreurs)
