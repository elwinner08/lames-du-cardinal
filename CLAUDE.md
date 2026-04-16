# Lames du Cardinal — Système Foundry VTT v14

Système Foundry VTT v14 pour le JDR **Les Lames du Cardinal v2** (cape et épée / XVIIe siècle alternatif).

## Stack technique

- Foundry VTT **v14** (ApplicationV2 partout)
- ActorSheetV2 / ItemSheetV2 avec `HandlebarsApplicationMixin`
- Handlebars pour les templates (`.hbs`)
- ESM modules (`.mjs`)
- Langue principale : **français** (code, UI, données). `en.json` maintenu en parallèle.

## Arborescence

```
systems/lames-du-cardinal/
├── system.json
├── module/
│   ├── lames-du-cardinal.mjs      # Entrée principale, hooks init/ready, socket
│   ├── sheets/                     # ActorSheet, ItemSheet (V2)
│   ├── tarot/                      # TarotManager, HandOverlay, PilesOverlay, RiviereOverlay
│   └── data/                       # DataModels
├── templates/
│   ├── actor/                      # lame-*.hbs, figurant-*.hbs
│   └── item/                       # arcane-sheet, arme-sheet, profil-sheet, generic-item-sheet
├── styles/lames.css                # CSS unique
├── lang/fr.json + en.json
├── packs/                          # Compendiums (arcanes, bottes, feintes, profils, écoles)
└── assets/
```

## Conventions de code

- **Noms en français** pour tout ce qui touche au domaine métier : `jouerCarte`, `ajouterArcaneEphemere`, `piocherArcaneEnMain`, `retirerCarte`, `transfererCarte`, `main`, `defausse`, `pioche`, `tenacite`, `epee` (les cases cochées de l'épée), etc.
- Nommage anglais uniquement pour les primitives techniques (`_save`, `_broadcast`, `_ensureMains`).
- **Pas d'emojis** dans le code / les fichiers sauf demande explicite.
- **Pas de documentation auto** : ne pas créer de `README.md` ou autres `.md` sans demande.

## Règles de données / state

### Tarot (world settings)
Un seul world setting `tarotState` contient tout :
```js
{
  piocheLames, defausseLames,
  piocheArcanes, defausseArcanes,
  mains: { [userId]: [cards] },
  arcanesEphemeres: { [userId]: [cards] }  // 0 à 2 par joueur
}
```

### Permissions joueur → GM
Les joueurs n'ont pas la permission d'update un world setting. **Toute mutation d'état tarot faite côté joueur DOIT passer par socket au GM** :

```js
// dans TarotManager._broadcast()
if (game.user.isGM) {
  await this._save();
  game.socket.emit("system.lames-du-cardinal", { type: "tarot-refresh" });
} else {
  game.socket.emit("system.lames-du-cardinal", {
    type: "tarot-player-update",
    state: this._state
  });
}
```

Le GM reçoit `tarot-player-update`, sauvegarde, puis rebroadcast `tarot-refresh`.

## Règles métier clés

### Arcane éphémère
- Chaque joueur peut avoir 0 à 2 arcanes éphémères (face visible, public).
- Donné par le GM via clic sur la pioche des arcanes → choix du joueur.
- Hover : tooltip = `${numero} — ${nom}` uniquement.
- Jouer un arcane éphémère coûte **1 ténacité** (une case `vierge` → `cochee` sur `system.epee`).
- Après avoir été jouée, la carte part dans la **pioche des lames** (qui est remélangée), pas dans la défausse.

### Arcane piochée depuis le paquet des lames
Si un joueur pioche une carte et que celle-ci est un arcane :
- Elle est **jouée automatiquement** (va dans la défausse des arcanes, pas dans la pioche des lames).
- Le joueur perd **1 ténacité**.
- Un message d'alerte est posté dans le chat (`.lames-arcane-alert`, border-left violet).

### Chat
Quand un joueur joue une carte, poster le même message de chat que lorsque le GM joue une carte (même format, même style).

## Règles UI

### Compendium readonly
Un item dont la source est un compendium est **en lecture seule pour sa description**.
Détection dans `_prepareContext` :
```js
context.item = this.item;
context.isFromCompendium = !!(this.item.pack || this.item._stats?.compendiumSource);
```
Puis dans le template :
```hbs
<textarea name="system.description" {{#if isFromCompendium}}readonly{{/if}}>{{system.description}}</textarea>
```
**Exception** : les champs "notes" personnels (ex: `arme-sheet.hbs` notes) restent éditables — ce sont des notes du joueur, pas du contenu compendium.

### Fenêtres scrollables
**Toutes** les fenêtres du système doivent être redimensionnables **ET** scrollables horizontalement/verticalement.

Solution CSS (dans `styles/lames.css`) :
```css
.window-content:has(.lames-du-cardinal),
.window-content:has(.tarot-app),
.window-content:has(.tarot-catalogue) {
  overflow: hidden;
  padding: 0;
}
.lames-du-cardinal form,
.tarot-app,
.tarot-catalogue {
  display: block;    /* PAS flex — flex casse le scroll */
  height: 100%;
  width: 100%;
  overflow: auto;
}
```

### Textareas simples (pas de ProseMirror)
Toujours utiliser `<textarea>` — jamais `<prose-mirror>` — pour les zones de texte. L'éditeur riche est trop lourd pour ce projet.

```hbs
<textarea name="system.description" rows="5" {{#if isFromCompendium}}readonly{{/if}}>{{system.description}}</textarea>
```

CSS attendu :
```css
textarea { width: 100%; resize: vertical; min-height: 60px; }
textarea[readonly] {
  background: rgba(139, 116, 84, 0.08);
  border-color: rgba(139, 116, 84, 0.3);
  cursor: default;
}
```

### Hand overlay (joueur)
- Conteneur principal `#hand-overlay` : fixed, `bottom: -70px; left: 50%`, z-index 60.
- Fan/arc : `maxSpread = 30°`, `arcRadius = 900`, `tx = sin(θ)·R`, `ty = (1−cos(θ))·R`.
- Positionnement via custom properties : `--fan-tx` sur `left: calc(-50px + var(--fan-tx))`, `--fan-angle` + `--fan-ty` dans `transform`.
- **Le hover doit agrandir la carte dans sa propre verticale** (ne pas la recentrer) :
  ```css
  .hand-card:hover {
    transform: rotate(0deg) translateY(-80px) scale(1.6);
    z-index: 100;
  }
  ```
- Clic gauche = jouer. Clic droit = menu contextuel (défausser / envoyer à un autre joueur).

### Piles overlay
- `.piles-overlay` : `left: 100px; flex-direction: row` (décalé de 20px + row).
- Ordre : lames (pioche + défausse) à gauche, arcanes (pioche + défausse) à droite avec `border-left` séparateur.

### Ephemeral overlay
- Conteneur **séparé** du hand-overlay : `#eph-overlay`, `position: fixed; bottom: 100px; left: 16px; flex-direction: column`.
- Ne pas le nester dans `.hand-overlay` (qui a `bottom: -70px`) — ça le rendrait invisible.

### Token tooltip
Hook `hoverToken` : tooltip `#lames-token-tooltip` affichant :
- Nom (Cinzel doré)
- Statut italique : **PJ** (si actor.hasPlayerOwner) ou **PNJ**

## Localisation

Clés importantes déjà ajoutées (ne pas dupliquer) :
- `LAMES.Tarot.defausser`, `defausserConfirm`, `defaussee`, `envoyerA`, `envoyee`, `jouerConfirm`, `jouee`
- `LAMES.Tarot.arcaneEphemere`, `ephMaxAtteint`, `joueArcaneEph`, `plusDeTenacite`
- `LAMES.Tarot.arcanePiochee`, `arcaneGrave`, `arcanePiocheeDesc`
- `LAMES.Divers.annuler`, `description`, `notes`
- `LAMES.Token.pj`, `pnj`

Toujours synchroniser `fr.json` **et** `en.json`.

## Pièges connus à éviter

1. **Ne pas mettre `display: flex` sur le form scrollable** — ça casse le scroll. Utiliser `display: block`.
2. **Ne pas utiliser le CSS transform pour la position horizontale des cartes en fan** — le hover perdrait le décalage. Utiliser `left: calc(... + var(--fan-tx))`.
3. **Ne pas faire d'update settings côté joueur** — toujours passer par socket GM.
4. **Ne pas nester l'ephemeral overlay dans le hand overlay** — la chaîne de `bottom` le masque.
5. **Ne pas réactiver ProseMirror** — l'utilisateur veut du textarea simple.
6. **Arcane depuis pioche lames ≠ arcane joué depuis la main** : le premier va dans la défausse arcanes avec perte de ténacité automatique ; pas dans la pioche lames.

## Tests

Après chaque change, toujours fournir des **étapes de test claires et détaillées** (conformément à la préférence utilisateur) :
- Action à faire
- État attendu
- Ce qu'il faut vérifier précisément

## État du projet

- **Phase 1** (fiches, items, tarot de base) : en cours / quasi finie
- **Phase 2** (hand overlay, arcanes éphémères, sync socket) : intégrée
- **Phase 3** (Combat dramatique) : différée à la fin
- Tests multi-machines du sync socket PU : différés
