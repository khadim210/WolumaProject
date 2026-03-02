# Correctif : Problème d'Enregistrement des Programmes

## Problème Identifié

Les programmes ne pouvaient pas être enregistrés correctement. Le problème venait de ce que certains champs essentiels (notamment `fieldEligibilityCriteria`, `selectionCriteria`, et `evaluationCriteria`) n'étaient pas correctement transmis lors de la création ou de la mise à jour d'un programme.

## Cause Racine

Dans les fonctions `handleCreateProgram` et `handleUpdateProgram` du fichier `ProgramManagementPage.tsx`, les données du formulaire étaient copiées avec l'opérateur spread (`...values`), mais certains champs spécifiques n'étaient pas explicitement inclus, ce qui pouvait causer leur perte lors de la transmission.

De plus, dans le store `programStore.ts`, la fonction `updateProgram` utilisait des vérifications conditionnelles avec `if (updates.field)` au lieu de `if (updates.field !== undefined)`, ce qui empêchait la mise à jour de certains champs lorsque leur valeur était falsy (comme un tableau vide `[]`).

## Solutions Implémentées

### 1. Fichier : `src/pages/admin/ProgramManagementPage.tsx`

#### Fonction `handleCreateProgram`

**Avant :**
```typescript
const programData = {
  ...values,
  startDate: new Date(values.startDate),
  endDate: new Date(values.endDate),
  budget: Number(values.budget),
  formTemplateId: values.formTemplateId || null,
  managerId: values.managerId || null
};
```

**Après :**
```typescript
const programData = {
  ...values,
  startDate: new Date(values.startDate),
  endDate: new Date(values.endDate),
  budget: Number(values.budget),
  formTemplateId: values.formTemplateId || null,
  managerId: values.managerId || null,
  fieldEligibilityCriteria: values.fieldEligibilityCriteria || [],
  selectionCriteria: values.selectionCriteria || [],
  evaluationCriteria: values.evaluationCriteria || [],
  isActive: true
};
```

#### Fonction `handleUpdateProgram`

**Avant :**
```typescript
const programData = {
  ...values,
  startDate: new Date(values.startDate),
  endDate: new Date(values.endDate),
  budget: Number(values.budget),
  formTemplateId: values.formTemplateId || null,
  managerId: values.managerId || null
};
```

**Après :**
```typescript
const programData = {
  ...values,
  startDate: new Date(values.startDate),
  endDate: new Date(values.endDate),
  budget: Number(values.budget),
  formTemplateId: values.formTemplateId || null,
  managerId: values.managerId || null,
  fieldEligibilityCriteria: values.fieldEligibilityCriteria || [],
  selectionCriteria: values.selectionCriteria || [],
  evaluationCriteria: values.evaluationCriteria || []
};
```

### 2. Fichier : `src/stores/programStore.ts`

#### Fonction `updateProgram`

**Avant :**
```typescript
if (updates.selectionCriteria) supabaseUpdates.selection_criteria = updates.selectionCriteria;
if (updates.fieldEligibilityCriteria !== undefined) supabaseUpdates.field_eligibility_criteria = updates.fieldEligibilityCriteria;
if (updates.evaluationCriteria) supabaseUpdates.evaluation_criteria = updates.evaluationCriteria;
```

**Problème :** La vérification `if (updates.selectionCriteria)` retourne `false` si `selectionCriteria` est un tableau vide `[]`, empêchant ainsi sa mise à jour.

**Après :**
```typescript
if (updates.selectionCriteria !== undefined) supabaseUpdates.selection_criteria = updates.selectionCriteria;
if (updates.fieldEligibilityCriteria !== undefined) supabaseUpdates.field_eligibility_criteria = updates.fieldEligibilityCriteria;
if (updates.evaluationCriteria !== undefined) supabaseUpdates.evaluation_criteria = updates.evaluationCriteria;
```

**Solution :** Utilisation de `!== undefined` pour vérifier la présence du champ, indépendamment de sa valeur.

### 3. Ajout de Logs de Débogage

Des logs console ont été ajoutés pour faciliter le diagnostic en cas de problèmes futurs :

**Dans `ProgramManagementPage.tsx` :**
```typescript
console.log('Creating program with values:', values);
console.log('Program data to send:', programData);
```

**Dans `programStore.ts` :**
```typescript
console.log('Store addProgram - programData received:', programData);
console.log('Store addProgram - dataToSend:', dataToSend);
console.log('Store updateProgram - updates received:', updates);
console.log('Store updateProgram - supabaseUpdates to send:', supabaseUpdates);
```

### 4. Amélioration de la Gestion des Erreurs

Ajout d'alertes utilisateur en cas d'erreur :

```typescript
catch (error) {
  console.error('Erreur lors de la création du programme:', error);
  alert('Erreur lors de la création du programme. Vérifiez les logs de la console.');
}
```

## Champs Concernés

Les champs suivants sont maintenant correctement transmis lors de la création et de la mise à jour d'un programme :

1. **`fieldEligibilityCriteria`** - Critères d'éligibilité basés sur les champs du formulaire
2. **`selectionCriteria`** - Critères de sélection
3. **`evaluationCriteria`** - Critères d'évaluation
4. **`isActive`** - Statut actif du programme (pour la création)

## Tests Effectués

- ✅ Build réussi sans erreurs TypeScript
- ✅ Les champs sont correctement inclus dans les données envoyées
- ✅ Les logs de débogage sont fonctionnels
- ✅ La gestion d'erreur est améliorée avec des messages utilisateur

## Comment Tester

1. Ouvrir la console du navigateur (F12)
2. Aller dans "Gestion des programmes"
3. Créer un nouveau programme ou modifier un existant
4. Vérifier dans la console les logs qui affichent les données envoyées
5. Vérifier que le programme est correctement enregistré dans la base de données

## Vérifications Supplémentaires

Si le problème persiste, vérifier :

1. **Permissions de la base de données** - Assurez-vous que l'utilisateur connecté a les permissions d'insertion/mise à jour sur la table `programs`
2. **Schéma de la table** - Vérifiez que la colonne `field_eligibility_criteria` existe bien dans la table
3. **Logs Supabase** - Consultez les logs de Supabase pour voir les erreurs SQL éventuelles
4. **Logs Console** - Les nouveaux logs ajoutés permettent de voir exactement quelles données sont envoyées

## Structure des Données

### fieldEligibilityCriteria

```typescript
[
  {
    fieldId: "champ-1",
    fieldName: "budget",
    fieldLabel: "Budget du projet",
    fieldType: "currency",
    isEligibilityCriteria: true,
    conditions: {
      operator: ">=",
      value: "10000",
      value2: "",
      errorMessage: "Le budget minimum requis est de 10 000"
    }
  }
]
```

### selectionCriteria

```typescript
[
  {
    id: "criterion-1",
    name: "Secteur géographique",
    description: "Zone d'intervention",
    type: "select",
    required: true,
    options: ["Urbain", "Rural", "Périurbain"]
  }
]
```

### evaluationCriteria

```typescript
[
  {
    id: "eval-1",
    name: "Pertinence du projet",
    description: "Évaluation de la pertinence",
    weight: 30,
    maxScore: 100
  }
]
```

## Notes Importantes

1. Les tableaux vides (`[]`) sont maintenant correctement gérés et transmis
2. Les champs optionnels sont définis à `null` ou `undefined` de manière cohérente
3. La validation Yup n'a pas été modifiée car elle fonctionnait correctement
4. Le type `SupabaseProgram` dans `supabaseService.ts` est correct et inclut déjà `field_eligibility_criteria`

## Prochaines Étapes

Si le problème persiste après ces correctifs :

1. Ouvrir la console du navigateur
2. Tenter de créer/modifier un programme
3. Copier tous les logs console (notamment ceux préfixés par "Store addProgram" ou "Store updateProgram")
4. Vérifier s'il y a des erreurs rouges dans la console
5. Partager ces informations pour un diagnostic plus approfondi
