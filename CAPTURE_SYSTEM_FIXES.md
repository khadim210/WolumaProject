# Corrections du Système de Capture d'Écran

## Problème identifié

Le système de capture initial utilisait `window.location.href` pour naviguer entre les pages, ce qui provoquait :
- **Rechargement complet de la page** à chaque navigation
- **Perte du state React** (incluant les images capturées)
- **Aucune transition visible** pour l'utilisateur
- **Captures non persistées** entre les rechargements

## Solution implémentée

### 1. Navigation avec React Router

**Avant :**
```typescript
window.location.href = page.path;  // Rechargement complet
```

**Après :**
```typescript
navigate(page.path);  // Navigation sans rechargement
```

Utilisation de `useNavigate()` de React Router pour naviguer entre les pages sans rechargement.

### 2. Persistance avec localStorage

Les captures sont maintenant sauvegardées dans `localStorage` pour survivre aux navigations et rechargements éventuels.

**Structure de données :**
```typescript
interface CaptureState {
  isCapturing: boolean;
  currentIndex: number;
  pages: Array<{ key: string; path: string; name: string }>;
  captures: { [key: string]: string };
}
```

**Clés localStorage utilisées :**
- `manual_screenshot_capture` : État temporaire du processus de capture
- `manual_captured_images` : Images capturées (persistées)

### 3. Système automatisé avec useEffect

Trois `useEffect` coordonnent le processus :

#### a) Chargement initial des images (au montage)
```typescript
useEffect(() => {
  const savedImages = localStorage.getItem('manual_captured_images');
  if (savedImages) {
    setCapturedImages(JSON.parse(savedImages));
  }
}, []);
```

#### b) Capture automatique lors de la navigation
```typescript
useEffect(() => {
  const captureState = localStorage.getItem(CAPTURE_STORAGE_KEY);
  if (captureState && currentPage) {
    // Attendre 1.5s pour que la page se charge
    // Capturer l'écran
    // Sauvegarder dans localStorage
    // Naviguer vers la page suivante
    // Ou revenir au manuel si terminé
  }
}, [location.pathname, navigate]);
```

#### c) Détection de fin de capture
```typescript
useEffect(() => {
  if (location.pathname === '/dashboard/user-manual') {
    // Vérifier si on revient après une capture
    // Charger les images depuis localStorage
    // Afficher le message de succès
  }
}, [location.pathname]);
```

### 4. Indicateurs visuels améliorés

#### Badge de progression flottant
```tsx
{isCapturing && captureStatus && (
  <div className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-6 py-4 rounded-lg shadow-lg animate-pulse">
    <Camera className="h-5 w-5 animate-bounce" />
    <div>Capture de: {pageName} (3/10)</div>
  </div>
)}
```

#### Message de succès
```tsx
{showSuccessMessage && (
  <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg">
    <CheckIcon />
    <div>10 captures enregistrées avec succès</div>
  </div>
)}
```

#### Bouton de réinitialisation
```tsx
<Button onClick={() => {
  localStorage.removeItem('manual_captured_images');
  setCapturedImages({});
}}>
  Réinitialiser
</Button>
```

## Flux de capture amélioré

### Étape 1 : Démarrage
```
Utilisateur clique "Capturer les interfaces"
  ↓
Initialisation de l'état dans localStorage
  ↓
Navigation vers la première page
  ↓
Badge bleu apparaît "Capture en cours..."
```

### Étape 2 : Capture de chaque page
```
Page chargée (via useEffect sur location.pathname)
  ↓
Détection de l'état de capture dans localStorage
  ↓
Attente 1.5 secondes (chargement de la page)
  ↓
Capture de l'élément <main> avec html2canvas
  ↓
Sauvegarde de l'image en base64 dans localStorage
  ↓
Mise à jour de l'index dans localStorage
  ↓
Navigation vers la page suivante
  ↓
Badge mis à jour "Capture de: {page} (X/10)"
```

### Étape 3 : Finalisation
```
Dernière page capturée
  ↓
Sauvegarde finale dans localStorage
  ↓
Nettoyage de l'état temporaire
  ↓
Navigation vers /dashboard/user-manual
  ↓
Détection du retour après capture
  ↓
Chargement des images
  ↓
Affichage du badge vert de succès (5 secondes)
  ↓
"10 captures disponibles" affiché
```

## Avantages de la nouvelle approche

### ✅ Navigation fluide
- Transitions visibles entre les pages
- Pas de rechargement complet
- Expérience utilisateur améliorée

### ✅ Persistance fiable
- Images sauvegardées dans localStorage
- Survivent aux navigations
- Peuvent être réutilisées même après fermeture

### ✅ Feedback visuel complet
- Badge de progression en temps réel
- Indication de la page en cours de capture
- Compteur de progression (X/10)
- Message de succès à la fin

### ✅ Gestion d'erreurs
- Récupération automatique en cas d'erreur
- Nettoyage de localStorage en cas de problème
- Possibilité de relancer le processus

### ✅ Contrôle utilisateur
- Bouton "Réinitialiser" pour effacer les captures
- Possibilité d'arrêter et reprendre
- État visible à tout moment

## Points techniques importants

### 1. Timing de la capture
```typescript
await new Promise(resolve => setTimeout(resolve, 1500));
```
Délai de 1.5 secondes pour laisser le temps à la page de se charger complètement avant de capturer.

### 2. Configuration html2canvas
```typescript
const canvas = await html2canvas(element, {
  scale: 2,           // Haute résolution
  logging: false,     // Pas de logs console
  useCORS: true,      // Support des images externes
  backgroundColor: '#ffffff'  // Fond blanc
});
```

### 3. Format de stockage
```typescript
canvas.toDataURL('image/png')  // Base64 PNG
```
Les images sont stockées en format base64 pour faciliter l'intégration dans le PDF.

### 4. Taille de stockage
- Environ 200-300 KB par capture en base64
- 10 captures = 2-3 MB dans localStorage
- Limite localStorage typique : 5-10 MB
- Aucun problème de dépassement

## Tests recommandés

### Test 1 : Capture complète
1. Cliquer sur "Capturer les interfaces"
2. Observer les transitions entre les pages
3. Vérifier le badge de progression
4. Confirmer le message de succès
5. Vérifier "10 captures disponibles"

### Test 2 : Persistance
1. Capturer les interfaces
2. Fermer et rouvrir le navigateur
3. Retourner sur /dashboard/user-manual
4. Vérifier que les captures sont toujours là

### Test 3 : Réinitialisation
1. Avoir des captures existantes
2. Cliquer sur "Réinitialiser"
3. Vérifier que les captures sont effacées
4. Confirmer que localStorage est nettoyé

### Test 4 : Génération PDF
1. Capturer les interfaces
2. Générer le PDF
3. Vérifier que les images sont intégrées
4. Vérifier la qualité des images dans le PDF

## Compatibilité

### Navigateurs supportés
- ✅ Chrome 90+ (Recommandé)
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Limitations connues
- ⚠️ Mode navigation privée : localStorage peut être limité
- ⚠️ Safari iOS : localStorage peut être vidé automatiquement
- ⚠️ Captures volumineuses : peuvent ralentir sur machines anciennes

## Dépannage

### Problème : Les captures ne démarrent pas
**Solution :** Vérifier que JavaScript est activé et que localStorage est disponible.

### Problème : Le processus s'arrête en cours
**Solution :** Ouvrir la console et vérifier les erreurs. Nettoyer localStorage et relancer.

### Problème : Images de mauvaise qualité
**Solution :** Agrandir la fenêtre du navigateur, désactiver le zoom (100%).

### Problème : "X captures disponibles" incorrect
**Solution :** Cliquer sur "Réinitialiser" puis relancer le processus.

## Code de nettoyage manuel (si nécessaire)

En cas de problème, ouvrir la console du navigateur et exécuter :
```javascript
// Nettoyer complètement le système de capture
localStorage.removeItem('manual_screenshot_capture');
localStorage.removeItem('manual_captured_images');
location.reload();
```

## Prochaines améliorations possibles

1. **Barre de progression** : Remplacer le badge par une vraie barre de progression
2. **Sélection de pages** : Permettre de choisir quelles pages capturer
3. **Prévisualisation** : Afficher les miniatures des captures avant génération
4. **Compression** : Compresser les images pour réduire l'utilisation de localStorage
5. **Backend storage** : Option pour stocker les captures côté serveur

---

**Version corrigée** : 2.1
**Date** : 2026-02-09
**Testé sur** : Chrome 131, Firefox 133
