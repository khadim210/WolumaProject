# Vérification - Lien de Soumission Publique

## 🔍 Problème "Page Not Found"

### Cause Probable
Le serveur de développement doit être relancé après les modifications du code.

### ✅ Solution Immédiate

**1. Arrêter le serveur**
```bash
# Dans le terminal où tourne npm run dev
Ctrl + C
```

**2. Relancer le serveur**
```bash
npm run dev
```

**3. Tester le lien**
```
1. Login admin
2. Admin > Gestion des programmes
3. Éditer un programme
4. Cliquer sur "Tester"
```

### 🎯 Checklist Rapide

- [ ] Serveur lancé avec `npm run dev`
- [ ] Message "ready in XXXms" affiché
- [ ] URL: `localhost:5173` dans le navigateur
- [ ] Au moins 1 programme existe dans la base
- [ ] Hard reload: Ctrl + Shift + R

### 📝 URL Correcte

**Format attendu:**
```
http://localhost:5173/submit/[UUID-du-programme]
```

**Exemple:**
```
http://localhost:5173/submit/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 🧪 Test Rapide

```bash
# 1. Lancer serveur
npm run dev

# 2. Dans navigateur
http://localhost:5173

# 3. Login admin

# 4. Cliquer "Tester" sur un programme
```

### 💡 Si Toujours "Page Not Found"

**Hard Reload:**
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

**Clear Vite Cache:**
```bash
rm -rf node_modules/.vite
npm run dev
```

---

**Status:** Guide rapide de dépannage
