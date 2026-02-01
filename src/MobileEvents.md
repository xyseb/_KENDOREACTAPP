# 🖱️ / ✋ / ✏️ Mapping device → event React
| Device / Input | Modèle navigateur | Events React déclenchés | Notes |
|----------------| ----------------- | ------------------------|-------|
| Souris | Mouse Events | `onClick`, `onMouseDown`, `onMouseMove`, `onMouseUp` | Tout fonctionne normalement. Pas de `onTouch*`. |
| Trackpad (scroll + tap) | Mouse + Wheel | `onClick`, `onMouseDown`, `onMouseMove`, `onMouseUp` | Le trackpad simule la souris → déclenche les mêmes events. Scroll multitouch → wheel. Pas de `onTouch*`. |
| Tactile legacy | Touch Events | `onTouchStart`, `onTouchMove`, `onTouchEnd`, `onTouchCancel` + `onClick` (après touchend) | Tous les gestures tactiles passent ici. click synthétique déclenché après touchend si pas annulé. |
| Tactile modèrne | Pointer Events | `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel` + `onClick` (après touchend) | Tous les gestures tactiles passent ici. click synthétique déclenché après touchend si pas annulé. |
| Stylet classique (non tactile) | Mouse Events | `onClick`, `onMouseDown`, `onMouseMove`, `onMouseUp` | Comme la souris. Pas de `onTouch*`. Peut déclencher `pointer*` si Pointer Events activés. |
| Stylet sur écran tactile | Pointer Events | `onPointerDown`, `onPointerMove`, `onPointerUp` (et éventuellement `onTouch*`) | Dépend du navigateur et du driver : certains déclenchent `onTouch*`, d’autres seulement `pointer*`. |

## 📱 Tap mobile — comportements par défaut & events React

| Interaction utilisateur | Comportement par défaut | Event navigateur | Prop React | Notes clés |
|------------------------|------------------------|------------------|------------|-----------|
| Tap court | Click normal | `click` | `onClick` | Déclenché après `touchend` |
| Tap court (début) | Début interaction | `touchstart` | `onTouchStart` | Point d’entrée long press |
| Tap court (fin) | Fin interaction | `touchend` | `onTouchEnd` | Peut déclencher `click` |
| Tap long (~500–700ms) | Menu contextuel | `contextmenu` | `onContextMenu` | À `preventDefault()` |
| Tap long sur texte | Sélection texte | `selectionchange` | ❌ | Non exposé directement |
| Tap long sur image | Menu image | `contextmenu` | `onContextMenu` | Dépend du navigateur |
| Tap + glissement | Scroll | `touchmove` | `onTouchMove` | Annule le click |
| Tap annulé | Interaction annulée | `touchcancel` | `onTouchCancel` | À gérer absolument |
| Double tap | Zoom | `dblclick` / gesture | `onDoubleClick` | Peu fiable mobile |
| Tap sur bouton | Action | `click` | `onClick` | Desktop + mobile |
| Tap long sur bouton | Menu contextuel | `contextmenu` | `onContextMenu` | Même sans clic droit |
| Tap sur lien | Navigation | `click` | `onClick` | Peut être intercepté |
| Tap long sur lien | Menu lien | `contextmenu` | `onContextMenu` | “Ouvrir dans…” |
| Tap sur input | Focus clavier | `focus` | `onFocus` | Ouvre clavier |
| Tap long sur input | Sélection texte | `selectionchange` | ❌ | iOS surtout |
| Tap avec stylet | Action | `pointerdown` | `onPointerDown` | Pointer Events |
| Tap annulé (pointer) | Annulation | `pointercancel` | `onPointerCancel` | Moderne |

---

## 👉 Pointer Events — modèle unifié moderne (recommandé)

> Pointer Events unifient **souris, tactile et stylet** dans une seule API.
> Ils sont aujourd’hui la **solution recommandée** pour les interactions complexes.

### 🧠 Principes clés
- Un **pointer = un contact** (`pointerId`)
- Le navigateur arbitre via `touch-action`
- `preventDefault()` devient rarement nécessaire
- `pointercancel` indique une reprise de contrôle navigateur (scroll, zoom, geste système)

---

### 🧭 Mapping interactions → Pointer Events React

| Interaction utilisateur | Event navigateur | Prop React | Notes clés |
|------------------------|------------------|------------|-----------|
| Appui souris | `pointerdown` | `onPointerDown` | `pointerType = "mouse"` |
| Déplacement souris | `pointermove` | `onPointerMove` | Remplace `mousemove` |
| Relâche souris | `pointerup` | `onPointerUp` | Déclenche souvent `click` |
| Tap doigt | `pointerdown` | `onPointerDown` | `pointerType = "touch"` |
| Drag doigt | `pointermove` | `onPointerMove` | Bloqué ou non selon `touch-action` |
| Fin du tap | `pointerup` | `onPointerUp` | Peut produire un `click` |
| Geste annulé | `pointercancel` | `onPointerCancel` | Scroll, zoom, geste système |
| Stylet | `pointerdown` | `onPointerDown` | `pointerType = "pen"` |
| Multi-touch | Plusieurs `pointerdown` | `onPointerDown` | Chaque doigt a son `pointerId` |
| Scroll vertical natif | — | — | Autorisé par `touch-action: pan-y` |
| Scroll horizontal natif | — | — | Bloqué si `pan-y` |

---

### ⚙️ Comparatif Touch vs Pointer

| Critère | Touch Events | Pointer Events |
|-------|--------------|----------------|
| API | Fragmentée | Unifiée |
| Multi-touch | Complexe (`touches[]`) | Simple (`pointerId`) |
| Scroll / zoom | Flou | Contrôlé via `touch-action` |
| Annulation | `touchcancel` peu fiable | `pointercancel` clair |
| Recommandé en 2024+ | ❌ | ✅ |

---

### ✅ Bonnes pratiques Pointer Events
- Toujours gérer `pointercancel`
- Ne jamais mixer `onTouch*` et `onPointer*`
- Utiliser `touch-action` au lieu de `preventDefault`
- Ne suivre qu’un `pointerId` si l’intention est mono-gesture

---

### 🏁 Conclusion
- **Touch Events** → legacy, cas simples
- **Pointer Events** → UI modernes, gestures fiables
- **Pointer Events + touch-action** → combo gagnant
