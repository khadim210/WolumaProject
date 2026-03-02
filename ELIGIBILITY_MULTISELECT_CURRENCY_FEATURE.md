# Amélioration des Critères d'Éligibilité et Ajout du Type de Champ Monétaire

## Vue d'ensemble

Ce document décrit les améliorations apportées au système de gestion des programmes et des formulaires :

1. **Sélection multiple de valeurs éligibles** pour les champs avec options (select, radio, multiple_select)
2. **Nouveau type de champ monétaire** (currency) dans le constructeur de formulaires

## 1. Sélection Multiple de Valeurs Éligibles

### Problème Résolu

Auparavant, lors de la définition des critères d'éligibilité pour un champ avec options (liste déroulante, choix unique, choix multiples), il n'était possible de sélectionner qu'une seule valeur comme éligible.

### Solution Implémentée

Lorsque l'opérateur `in` (Dans la liste) ou `not_in` (Pas dans la liste) est sélectionné, l'interface affiche maintenant une liste de cases à cocher permettant de sélectionner plusieurs valeurs éligibles.

### Localisation des Modifications

**Fichier :** `src/pages/admin/ProgramManagementPage.tsx`

**Section :** Onglet "Critères d'éligibilité" dans le modal de création/modification de programme

### Fonctionnement

1. Lors de la configuration d'un critère d'éligibilité pour un champ `select`, `radio` ou `multiple_select`
2. Si l'opérateur choisi est `in` ou `not_in`
3. Le label change pour "Valeurs éligibles (plusieurs possibles)"
4. Une liste de cases à cocher s'affiche avec toutes les options du champ
5. L'utilisateur peut cocher plusieurs options
6. Les valeurs sélectionnées sont stockées sous forme de chaîne séparée par des virgules

### Exemple d'utilisation

**Scénario :** Un programme demande le type d'organisation (ONG, Association, Entreprise, Coopérative)

**Configuration :**
- Champ : "Type d'organisation" (select)
- Opérateur : "Dans la liste (in)"
- Valeurs éligibles sélectionnées :
  - ☑ ONG
  - ☑ Association
  - ☐ Entreprise
  - ☑ Coopérative

**Résultat :** Seules les soumissions avec type d'organisation "ONG", "Association" ou "Coopérative" seront éligibles.

---

## 2. Nouveau Type de Champ Monétaire (Currency)

### Fonctionnalité Ajoutée

Un nouveau type de champ "Montant monétaire" a été ajouté au constructeur de formulaires. Ce type permet de créer des champs de saisie de montants avec symbole de devise.

### Caractéristiques

- **Type de champ :** `currency`
- **Label :** "Montant monétaire"
- **Symboles de devise supportés :**
  - XOF - Franc CFA (FCFA)
  - EUR - Euro (€)
  - USD - Dollar américain ($)
  - GBP - Livre sterling (£)
  - CHF - Franc suisse (CHF)
  - CAD - Dollar canadien (C$)
  - JPY - Yen japonais (¥)
  - CNY - Yuan chinois (¥)

### Modifications des Fichiers

#### 1. Type de champ ajouté
**Fichier :** `src/stores/formTemplateStore.ts`
```typescript
export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'radio' |
  'checkbox' | 'date' | 'file' | 'multiple_select' | 'currency';

export interface FormField {
  // ... autres propriétés
  currencyCode?: string; // Pour les champs currency
}
```

#### 2. Interface de configuration
**Fichier :** `src/pages/manager/FormBuilderPage.tsx`

Le type "Montant monétaire" apparaît dans la liste des types de champs disponibles. Lors de la sélection, un menu déroulant permet de choisir la devise.

#### 3. Rendu dans les formulaires

Le champ currency est rendu avec :
- Un input de type `number` avec `step="0.01"` et `min="0"`
- Le symbole de la devise affiché à gauche du champ
- Un style cohérent avec les autres champs

**Fichiers modifiés :**
- `src/pages/projects/CreateProjectPage.tsx` - Création de projet
- `src/pages/projects/EditProjectPage.tsx` - Modification de projet
- `src/pages/public/PublicSubmissionPage.tsx` - Soumission publique

#### 4. Support dans les critères d'éligibilité
**Fichier :** `src/pages/admin/ProgramManagementPage.tsx`

Les champs `currency` supportent les mêmes opérateurs que les champs `number` :
- Égal à (==)
- Différent de (!=)
- Supérieur à (>)
- Inférieur à (<)
- Supérieur ou égal (≥)
- Inférieur ou égal (≤)
- Entre (between)

Les valeurs de critères sont affichées avec le symbole de devise approprié.

### Exemple d'utilisation

**Création d'un formulaire avec champ monétaire :**

1. Aller dans "Gestion des formulaires"
2. Créer ou modifier un formulaire
3. Ajouter un champ
4. Sélectionner le type "Montant monétaire"
5. Choisir la devise (ex: EUR pour Euro)
6. Configurer le label, placeholder, etc.

**Configuration d'un critère d'éligibilité :**

1. Dans "Gestion des programmes"
2. Créer ou modifier un programme
3. Onglet "Critères d'éligibilité"
4. Activer le critère pour le champ monétaire
5. Choisir l'opérateur (ex: "Supérieur ou égal (≥)")
6. Saisir la valeur (le symbole de devise s'affiche automatiquement)

**Exemple concret :**
- Champ : "Budget du projet" (currency, EUR)
- Opérateur : "Entre (between)"
- Valeur min : 10000 €
- Valeur max : 50000 €
- Message d'erreur : "Le budget du projet doit être compris entre 10 000 € et 50 000 €"

---

## Résumé des Fichiers Modifiés

1. **src/stores/formTemplateStore.ts**
   - Ajout du type `currency` à `FieldType`
   - Ajout de la propriété `currencyCode` à `FormField`

2. **src/pages/manager/FormBuilderPage.tsx**
   - Ajout du type "Montant monétaire" dans la liste des types
   - Configuration de la devise pour les champs currency

3. **src/pages/admin/ProgramManagementPage.tsx**
   - Sélection multiple de valeurs pour opérateurs `in` et `not_in`
   - Support du type `currency` dans les critères d'éligibilité
   - Affichage du symbole de devise dans les champs de valeur

4. **src/pages/projects/CreateProjectPage.tsx**
   - Rendu du champ currency avec symbole de devise

5. **src/pages/projects/EditProjectPage.tsx**
   - Rendu du champ currency avec symbole de devise

6. **src/pages/public/PublicSubmissionPage.tsx**
   - Rendu du champ currency avec symbole de devise

---

## Tests Effectués

- ✅ Build réussi sans erreurs
- ✅ Ajout du type currency dans la liste des types de champs
- ✅ Configuration de la devise dans le constructeur de formulaires
- ✅ Sélection multiple de valeurs avec cases à cocher (opérateurs in/not_in)
- ✅ Affichage correct du symbole de devise dans les formulaires
- ✅ Support du type currency dans les critères d'éligibilité

---

## Notes Techniques

### Format de stockage des valeurs multiples
Les valeurs multiples sélectionnées pour les critères d'éligibilité sont stockées sous forme de chaîne avec virgules comme séparateur :
```javascript
// Exemple : "ONG,Association,Coopérative"
const selectedValues = criteria.conditions.value.split(',');
```

### Symboles de devise
Les symboles de devise sont mappés directement dans le code pour une performance optimale. Aucune dépendance externe n'est requise.

### Validation des montants
Les champs currency utilisent :
- `type="number"` pour la validation HTML5
- `step="0.01"` pour permettre les décimales
- `min="0"` pour éviter les montants négatifs
