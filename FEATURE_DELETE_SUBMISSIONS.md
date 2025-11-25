# Fonctionnalité: Suppression des Soumissions

## Vue d'ensemble
Cette fonctionnalité permet aux utilisateurs avec les permissions appropriées de supprimer des projets/soumissions depuis la page de gestion des soumissions.

## Fonctionnalités Implémentées

### 1. Bouton de Suppression
- **Emplacement**: Page de liste des projets (`/dashboard/projects`)
- **Visibilité**: Uniquement pour les utilisateurs avec la permission `projects.delete`
- **Apparence**: Icône de corbeille rouge à côté du bouton "Voir le détail"

### 2. Modal de Confirmation
- **Design**: Modal centré avec fond semi-transparent
- **Contenu**:
  - Icône d'alerte rouge
  - Titre: "Confirmer la suppression"
  - Message: Avertissement sur l'irréversibilité de l'action
  - Boutons: "Annuler" et "Supprimer"

### 3. Permissions
Les rôles suivants peuvent supprimer des projets:
- **Admin**: Oui (permission `projects.delete`)
- **Manager**: Non (pas de permission par défaut)
- **Partner**: Non
- **Submitter**: Non

### 4. Gestion des États
- **Loading**: Indicateur de chargement pendant la suppression
- **Success**: Message de confirmation "Projet supprimé avec succès"
- **Error**: Message d'erreur détaillé en cas d'échec

## Implémentation Technique

### Composants Modifiés
1. **ProjectsPage.tsx**
   - Ajout de l'import `Trash2` et `AlertCircle` de lucide-react
   - Ajout des états `showDeleteConfirm` et `deletingProjectId`
   - Fonction `handleDeleteProject` pour gérer la suppression
   - Bouton de suppression dans la liste des projets
   - Modal de confirmation de suppression

### Flux de Suppression
```
1. Utilisateur clique sur l'icône de corbeille
2. Modal de confirmation s'affiche
3. Utilisateur confirme la suppression
4. Appel à `deleteProject(projectId)` du store
5. Affichage du loading pendant la suppression
6. En cas de succès:
   - Projet supprimé de la liste
   - Message de confirmation
   - Modal fermé
7. En cas d'erreur:
   - Message d'erreur détaillé
   - Modal fermé
```

### Sécurité
- Vérification des permissions via `checkPermission('projects.delete')`
- Confirmation requise avant toute suppression
- Messages d'avertissement clairs sur l'irréversibilité

## Utilisation

### Pour l'Administrateur
1. Naviguer vers "Soumissions" dans le menu
2. Trouver le projet à supprimer
3. Cliquer sur l'icône de corbeille rouge
4. Confirmer la suppression dans la modal
5. Le projet est supprimé et disparaît de la liste

### Gestion des Permissions
Pour donner la permission de suppression à d'autres rôles:
1. Aller dans "Gestion des rôles" (page admin)
2. Sélectionner le rôle à modifier
3. Cocher la permission "Supprimer les projets"
4. Enregistrer les modifications

## Améliorations Futures Possibles
- [ ] Suppression en masse (sélection multiple)
- [ ] Corbeille avec restauration (soft delete)
- [ ] Historique des suppressions
- [ ] Export avant suppression
- [ ] Confirmation par mot de passe pour les suppressions critiques
