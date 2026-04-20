# Épée de Vitalité/Ténacité en marge gauche de la fiche Lame

## Objectif

Remplacer l'affichage compact actuel des 8 cases (vitalité/ténacité) dans le header de la fiche Lame par une représentation visuelle riche : l'image `assets/Vita-tena.png` (épée verticale avec 8 pastilles blanches) positionnée en marge gauche de la fiche, avec des cercles cliquables superposés sur les pastilles de l'image. Les compteurs numériques V et T sont intégrés à l'image, à côté des lettres correspondantes.

## Décisions de conception

- **Portée** : l'épée est affichée en marge gauche de **toute la fiche**, sur tous les onglets (Identité, Compétences, Combat, Arcanes, Inventaire, Relations, Notes).
- **Header** : les 8 cases compactes (`fort` / `faible`) et les compteurs textuels actuels sont **supprimés** du header. Les compteurs V et T migrent dans l'image de l'épée.
- **États visuels** (mix remplissage + halo) :
  - `vierge` : cercle blanc translucide
  - `cochee` : cercle doré plein avec halo lumineux
  - `barree` : cercle cramoisi plein barré d'un X sombre
- **Comportement pendant le scroll** (Approche 1) : l'épée est en `position: absolute` dans le form et scrolle avec le contenu de la fiche. Choix du plus simple, zéro risque de casser la règle `form { display: block; overflow: auto }` documentée dans `CLAUDE.md`.
- **Modèle de données** : inchangé. `system.epee` reste un tableau de 8 états. Les handlers `#onEpeeClick` / `#onEpeeRightClick` ne bougent pas.

## Architecture — fichiers touchés

| Fichier | Nature du changement |
|---|---|
| `templates/actor/lame-epee-margin.hbs` | **Nouveau** — partial de l'épée en marge |
| `templates/actor/lame-header.hbs` | Suppression du bloc `<div class="epee-vitalite">` (lignes 16–52) |
| `module/sheets/LameSheet.mjs` | Ajout de `epee` en tête de `PARTS`; extension du selector `contextmenu` dans `_onRender` pour inclure `.epee-pip` |
| `styles/lames.css` | Nouvelle section `ÉPÉE EN MARGE GAUCHE`; suppression de l'ancienne section `ÉPÉE DE VITALITÉ` (`.epee-vitalite`, `.epee-cases`, `.epee-section`, `.epee-case`) |

Aucun autre fichier impacté : le compendium, les DataModels, les autres sheets et l'overlay tarot restent inchangés.

## Template — `lame-epee-margin.hbs`

```hbs
<aside class="lame-epee-margin">
  <div class="lame-epee-wrapper">
    <img class="lame-epee-img" src="systems/lames-du-cardinal/assets/Vita-tena.png" alt="" />
    <span class="lame-epee-count lame-epee-count-v">{{vitalite}}</span>
    <span class="lame-epee-count lame-epee-count-t">{{tenacite}}</span>
    {{#each system.epee}}
      <div class="epee-pip state-{{this}}"
           data-action="epeeClick"
           data-index="{{@index}}"
           title="{{#if (eq this 'vierge')}}{{localize 'LAMES.Epee.vierge'}}{{else if (eq this 'cochee')}}{{localize 'LAMES.Epee.cochee'}}{{else}}{{localize 'LAMES.Epee.barree'}}{{/if}}">
      </div>
    {{/each}}
    {{#if evanoui}}<div class="lame-epee-status evanoui">{{localize "LAMES.Epee.evanoui"}}</div>{{/if}}
    {{#if mort}}<div class="lame-epee-status mort">{{localize "LAMES.Epee.mort"}}</div>{{/if}}
  </div>
</aside>
```

Les pips sont positionnés verticalement en `%` par sélecteur `[data-index="n"]` en CSS. Les compteurs V/T sont en absolute à côté des lettres gravées sur l'image. Les positions exactes (pourcentages) doivent être calibrées visuellement au moment de l'implémentation, en ouvrant une fiche et en ajustant jusqu'à alignement parfait avec les pastilles blanches de l'image.

## Modifications `LameSheet.mjs`

**1) `PARTS`** : ajouter `epee` en première position.

```js
static PARTS = {
  epee: { template: "systems/lames-du-cardinal/templates/actor/lame-epee-margin.hbs" },
  header: { template: "systems/lames-du-cardinal/templates/actor/lame-header.hbs" },
  tabs: { template: "templates/generic/tab-navigation.hbs" },
  identite: { /* ... */ },
  // ... reste inchangé
};
```

**2) `_onRender`** : étendre le selector qui attache le handler `contextmenu` pour inclure `.epee-pip`.

```js
this.element.querySelectorAll(".epee-case, .epee-pip").forEach(el => {
  el.addEventListener("contextmenu", (event) => {
    LameSheet.#onEpeeRightClick.call(this, event, el);
  });
});
```

**3) Handlers inchangés** : `#onEpeeClick`, `#onEpeeRightClick` fonctionnent tels quels — ils lisent `target.dataset.index` et mettent à jour `system.epee`.

## CSS — section complète

```css
/* ============================================= */
/*  ÉPÉE EN MARGE GAUCHE                         */
/* ============================================= */

.lames-du-cardinal.sheet.lame form {
  position: relative;
  padding-left: 130px;
}

.lame-epee-margin {
  position: absolute;
  left: 0;
  top: 0;
  width: 120px;
  pointer-events: none;
  user-select: none;
}

.lame-epee-wrapper {
  position: relative;
  width: 120px;
}

.lame-epee-img {
  width: 120px;
  height: auto;
  display: block;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
}

.lame-epee-count {
  position: absolute;
  font-family: "Cinzel", Georgia, serif;
  font-weight: bold;
  color: var(--lames-gold);
  font-size: 1.1em;
  text-shadow: 0 0 4px rgba(0,0,0,0.8);
  pointer-events: none;
}
.lame-epee-count-v { top: 18%; right: -4px; }
.lame-epee-count-t { top: 78%; right: -4px; }

.epee-pip {
  position: absolute;
  left: 50%;
  width: 22px;
  height: 22px;
  margin-left: -11px;
  border-radius: 50%;
  border: 2px solid rgba(139, 116, 84, 0.6);
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
  pointer-events: auto;
}
.epee-pip:hover {
  transform: scale(1.15);
  box-shadow: 0 0 8px var(--lames-gold);
}

/* Positions verticales — À CALIBRER sur l'image réelle */
.epee-pip[data-index="0"] { top: 18%; }
.epee-pip[data-index="1"] { top: 27%; }
.epee-pip[data-index="2"] { top: 36%; }
.epee-pip[data-index="3"] { top: 45%; }
.epee-pip[data-index="4"] { top: 54%; }
.epee-pip[data-index="5"] { top: 63%; }
.epee-pip[data-index="6"] { top: 72%; }
.epee-pip[data-index="7"] { top: 80%; }

.epee-pip.state-vierge {
  background: rgba(255, 255, 255, 0.92);
}
.epee-pip.state-cochee {
  background: var(--lames-gold);
  box-shadow: 0 0 10px var(--lames-gold), inset 0 0 4px rgba(255,255,255,0.6);
}
.epee-pip.state-barree {
  background: var(--lames-crimson);
}
.epee-pip.state-barree::after {
  content: "";
  position: absolute;
  inset: 3px;
  background:
    linear-gradient(45deg,
      transparent calc(50% - 2px),
      rgba(0,0,0,0.85) calc(50% - 2px),
      rgba(0,0,0,0.85) calc(50% + 2px),
      transparent calc(50% + 2px)),
    linear-gradient(-45deg,
      transparent calc(50% - 2px),
      rgba(0,0,0,0.85) calc(50% - 2px),
      rgba(0,0,0,0.85) calc(50% + 2px),
      transparent calc(50% + 2px));
}

.lame-epee-status {
  position: absolute;
  left: 0; right: 0;
  top: 100%;
  margin-top: 6px;
  text-align: center;
  font-family: "Cinzel", Georgia, serif;
  font-size: 0.8em;
  pointer-events: none;
}
.lame-epee-status.evanoui { color: var(--lames-warning); }
.lame-epee-status.mort    { color: var(--lames-crimson); font-weight: bold; }
```

## Suppressions dans `styles/lames.css`

Retirer entièrement la section `ÉPÉE DE VITALITÉ` (environ lignes 544–633) :
- `.epee-vitalite`
- `.epee-vitalite h4`
- `.epee-stats`, `.epee-stat`
- `.epee-cases`, `.epee-section`, `.epee-section-label`
- `.epee-case` et ses variantes `state-*`
- `.epee-status`

Ces classes ne sont plus utilisées nulle part (le partial `templates/partials/epee-vitalite.hbs` n'est pas inclus dans la fiche Lame active ; il ne référence pas ces classes depuis un autre contexte actif).

Note : le fichier `templates/partials/epee-vitalite.hbs` semble être un partial mort (non référencé dans `LameSheet.mjs`). Ne pas le supprimer dans cette tâche — ce serait du cleanup hors scope.

## Comportement attendu

1. À l'ouverture d'une fiche Lame, l'épée apparaît immédiatement en marge gauche, avec ses 8 cercles reflétant l'état actuel de `system.epee`.
2. Le changement d'onglet ne touche pas l'épée (elle persiste, car c'est un part distinct du form).
3. Un clic gauche sur un cercle cycle son état `vierge → cochee → barree → vierge`.
4. Un clic droit sur un cercle cycle en sens inverse `vierge → barree → cochee → vierge`.
5. Hover sur un cercle : scale 1.15, halo doré.
6. Les compteurs V et T se mettent à jour automatiquement (déjà géré par le DataModel).
7. Les statuts `evanoui` / `mort` apparaissent sous l'épée si activés.
8. Quand l'utilisateur scrolle la fiche, l'épée scrolle avec le contenu (Approche 1).

## Plan de test

1. **Ouvrir une fiche Lame existante** → vérifier que l'épée apparaît à gauche, que les 8 cercles sont correctement alignés avec les pastilles de l'image, que les compteurs V et T affichent les bonnes valeurs.
2. **Clic gauche sur un cercle vierge** → devient doré avec halo ; compteur T ou V décrémenté.
3. **Clic gauche sur un cercle doré** → devient rouge barré.
4. **Clic gauche sur un cercle barré** → redevient vierge.
5. **Clic droit sur un cercle vierge** → devient rouge barré.
6. **Hover sur un cercle** → grossit et halo doré.
7. **Changer d'onglet** (Compétences, Combat, Arcanes…) → l'épée reste visible et fonctionnelle à gauche.
8. **Scroller la fiche** → l'épée scrolle avec le header (comportement Approche 1 assumé).
9. **Ouvrir la fiche d'un personnage évanoui / mort** → le statut correspondant apparaît sous l'épée.
10. **Redimensionner la fiche** → l'image et les cercles restent alignés (largeur fixe 120px, pips en %).
11. **Ancien contenu** : vérifier que l'ancien bloc des 8 cases dans le header a disparu et que rien d'autre n'a bougé dans le header (portrait, nom, profils, race toujours présents).

## Hors scope

- Suppression du partial mort `templates/partials/epee-vitalite.hbs`.
- Application d'un traitement similaire à `FigurantSheet` (figurants n'ont pas de système épée).
- Animation de transition entre les états.
- Sticky position de l'épée pendant le scroll (c'est l'Approche 2, rejetée).
