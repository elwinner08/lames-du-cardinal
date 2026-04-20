# Épée en marge gauche — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les 8 cases compactes du header de la fiche Lame par une épée verticale (image `assets/Vita-tena.png`) positionnée en marge gauche de la fiche, avec 8 cercles cliquables superposés sur les pastilles blanches et compteurs V/T intégrés à l'image.

**Architecture:** Un nouveau part HBS `epee` ajouté en tête du `PARTS` de `LameSheet`. L'épée est rendue en `position: absolute; left: 0; top: 0` dans le form (Approche 1 : scrolle avec le contenu). Les pips utilisent les actions déjà déclarées (`epeeClick` + listener `contextmenu` pour le clic droit). Pas de mutation des DataModels, pas de migration.

**Tech Stack:** Foundry VTT v14, ApplicationV2 + HandlebarsApplicationMixin, Handlebars, CSS vanilla. Pas de framework de test — tests manuels dans Foundry.

**Note sur le test :** Ce projet n'a pas d'infrastructure de test automatique. Chaque tâche se termine par des étapes de **test manuel** à exécuter dans Foundry (ouverture d'une fiche Lame existante, interactions visuelles, vérifs sur l'écran). Le commit suit si le test manuel passe.

---

## Récap des fichiers touchés

| Fichier | Opération |
|---|---|
| `templates/actor/lame-epee-margin.hbs` | **Create** |
| `module/sheets/LameSheet.mjs` | Modify : ajout `PARTS.epee`; extension du selector dans `_onRender` |
| `templates/actor/lame-header.hbs` | Modify : suppression du bloc `epee-vitalite` |
| `styles/lames.css` | Modify : ajout section marge gauche + suppression section `ÉPÉE DE VITALITÉ` |

---

## Task 1 : Créer le partial HBS de l'épée en marge

**Files:**
- Create: `templates/actor/lame-epee-margin.hbs`

- [ ] **Step 1 : Créer le fichier `templates/actor/lame-epee-margin.hbs`**

Contenu complet :

```hbs
{{!-- Épée de Vitalité/Ténacité en marge gauche - image + 8 pips cliquables --}}
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

- [ ] **Step 2 : Commit**

```bash
git add templates/actor/lame-epee-margin.hbs
git commit -m "Ajout du partial lame-epee-margin.hbs (image Vita-tena.png + 8 pips cliquables + compteurs V/T + statuts evanoui/mort)"
```

---

## Task 2 : Enregistrer le part `epee` dans LameSheet

**Files:**
- Modify: `module/sheets/LameSheet.mjs:51-61` (bloc `static PARTS`)

- [ ] **Step 1 : Ajouter l'entrée `epee` en tête de `PARTS`**

Remplacer le bloc actuel :

```js
static PARTS = {
  header: { template: "systems/lames-du-cardinal/templates/actor/lame-header.hbs" },
  tabs: { template: "templates/generic/tab-navigation.hbs" },
  identite: { template: "systems/lames-du-cardinal/templates/actor/lame-identite.hbs" },
  competences: { template: "systems/lames-du-cardinal/templates/actor/lame-competences.hbs" },
  combat: { template: "systems/lames-du-cardinal/templates/actor/lame-combat.hbs" },
  arcanes: { template: "systems/lames-du-cardinal/templates/actor/lame-arcanes.hbs" },
  inventaire: { template: "systems/lames-du-cardinal/templates/actor/lame-inventaire.hbs" },
  relations: { template: "systems/lames-du-cardinal/templates/actor/lame-relations.hbs" },
  notes: { template: "systems/lames-du-cardinal/templates/actor/lame-notes.hbs" }
};
```

par :

```js
static PARTS = {
  epee: { template: "systems/lames-du-cardinal/templates/actor/lame-epee-margin.hbs" },
  header: { template: "systems/lames-du-cardinal/templates/actor/lame-header.hbs" },
  tabs: { template: "templates/generic/tab-navigation.hbs" },
  identite: { template: "systems/lames-du-cardinal/templates/actor/lame-identite.hbs" },
  competences: { template: "systems/lames-du-cardinal/templates/actor/lame-competences.hbs" },
  combat: { template: "systems/lames-du-cardinal/templates/actor/lame-combat.hbs" },
  arcanes: { template: "systems/lames-du-cardinal/templates/actor/lame-arcanes.hbs" },
  inventaire: { template: "systems/lames-du-cardinal/templates/actor/lame-inventaire.hbs" },
  relations: { template: "systems/lames-du-cardinal/templates/actor/lame-relations.hbs" },
  notes: { template: "systems/lames-du-cardinal/templates/actor/lame-notes.hbs" }
};
```

- [ ] **Step 2 : Test manuel — rechargement Foundry**

1. Relancer Foundry (F5 dans le monde, ou redémarrer le serveur si nécessaire).
2. Ouvrir la fiche d'un personnage Lame existant.
3. Attendu : l'épée (image PNG) s'affiche quelque part — probablement superposée sur le header ou au-dessus, car le CSS n'est pas encore en place. Les 8 pips doivent exister dans le DOM (à inspecter avec F12 → chercher `.lame-epee-margin`).
4. Vérifier la console : aucune erreur JavaScript type "template not found" ou "undefined".

Si KO, inspecter le chemin dans `PARTS.epee.template` et vérifier que le fichier existe à cet emplacement.

- [ ] **Step 3 : Commit**

```bash
git add module/sheets/LameSheet.mjs
git commit -m "Enregistrement du part 'epee' en tête de LameSheet.PARTS (partial lame-epee-margin.hbs rendu avant le header)"
```

---

## Task 3 : Supprimer les 8 cases du header

**Files:**
- Modify: `templates/actor/lame-header.hbs:15-52` (bloc `<div class="epee-vitalite">`)

- [ ] **Step 1 : Supprimer le bloc `epee-vitalite` du header**

Fichier complet `templates/actor/lame-header.hbs` après modification (remplacer tout le contenu par) :

```hbs
{{!-- HEADER: portrait + nom --}}
<header class="sheet-header">
  <img class="profile-img" src="{{actorImg}}"
       alt="{{actor.name}}" title="{{actor.name}}" />
  <div class="header-fields">
    <h1 class="actor-name">{{actor.name}}</h1>
    <div class="header-details">
      <span class="header-profils">
        {{system.profil1}}{{#if system.profil1Variation}} ({{system.profil1Variation}}){{/if}}
        {{#if system.profil2}} / {{system.profil2}}{{#if system.profil2Variation}} ({{system.profil2Variation}}){{/if}}{{/if}}
      </span>
      <span class="header-race">{{localize (concat "LAMES.Races." system.race)}}</span>
    </div>
  </div>
</header>
```

Les lignes 15-52 de l'original (`{{!-- Épée de Vitalité in header --}}` jusqu'au `</div>` fermant avant `</header>`) sont entièrement retirées.

- [ ] **Step 2 : Test manuel — vérification header**

1. F5 dans Foundry.
2. Ouvrir la fiche Lame.
3. Attendu : le header n'affiche plus les 8 petites cases ni les compteurs texte "Ténacité : X / Vitalité : Y". Il contient uniquement : portrait, nom, profils, race.
4. L'épée (image) est toujours visible quelque part (encore sans CSS).
5. Aucune erreur console.

- [ ] **Step 3 : Commit**

```bash
git add templates/actor/lame-header.hbs
git commit -m "Retrait du bloc epee-vitalite du header (8 cases + compteurs V/T migrent dans la marge gauche)"
```

---

## Task 4 : Ajouter le CSS de l'épée en marge

**Files:**
- Modify: `styles/lames.css` (ajout nouvelle section)

- [ ] **Step 1 : Ajouter la nouvelle section CSS**

Ajouter **à la fin** de `styles/lames.css` le bloc complet suivant :

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

/* Positions verticales initiales — À CALIBRER en Task 6 */
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

- [ ] **Step 2 : Test manuel — épée visible et cliquable**

1. F5 dans Foundry.
2. Ouvrir la fiche Lame.
3. Attendu :
   - L'épée apparaît à gauche du header et des onglets, image ~120px de large.
   - Le header et les onglets sont décalés vers la droite (espace ~130px).
   - Les 8 cercles blancs sont superposés sur la lame (leur alignement n'est PAS forcément parfait — Task 6 calibrera).
   - Les compteurs V et T sont dessinés à côté des lettres V et T de l'image (couleur dorée).
4. Cliquer gauche sur un cercle → cycle vierge → cochee (doré + halo) → barree (rouge + X sombre) → vierge.
5. Clic droit ne fonctionne PAS encore (attente Task 5).
6. Hover sur un cercle → grossit + halo doré.
7. Changer d'onglet → l'épée reste visible à gauche.
8. Console propre.

Si l'épée ne réagit pas au clic : vérifier dans F12 que les `.epee-pip` ont bien `pointer-events: auto` et que leur parent `.lame-epee-margin` a `pointer-events: none`.

- [ ] **Step 3 : Commit**

```bash
git add styles/lames.css
git commit -m "Ajout CSS de l'épée en marge gauche (aside 120px absolute, 8 pips cliquables, 3 états vierge/cochee/barree avec halo doré et X sombre, compteurs V/T en or)"
```

---

## Task 5 : Étendre le listener `contextmenu` aux nouveaux pips

**Files:**
- Modify: `module/sheets/LameSheet.mjs` (méthode `_onRender`, bloc "Right-click on épée cases")

- [ ] **Step 1 : Étendre le selector**

Dans `module/sheets/LameSheet.mjs`, trouver le bloc actuel (aux alentours de la ligne 770-774) :

```js
// Right-click on épée cases
this.element.querySelectorAll(".epee-case").forEach(el => {
  el.addEventListener("contextmenu", (event) => {
    LameSheet.#onEpeeRightClick.call(this, event, el);
  });
});
```

Le remplacer par :

```js
// Right-click on épée cases / pips
this.element.querySelectorAll(".epee-case, .epee-pip").forEach(el => {
  el.addEventListener("contextmenu", (event) => {
    LameSheet.#onEpeeRightClick.call(this, event, el);
  });
});
```

- [ ] **Step 2 : Test manuel — clic droit fonctionnel**

1. F5 dans Foundry.
2. Ouvrir la fiche Lame.
3. Clic droit sur un cercle vierge → devient rouge barré (X sombre).
4. Clic droit sur un cercle barré → devient doré.
5. Clic droit sur un cercle doré → redevient vierge.
6. Le menu contextuel natif du navigateur NE doit PAS s'afficher (vérifier `event.preventDefault()` dans `#onEpeeRightClick`, déjà présent).

- [ ] **Step 3 : Commit**

```bash
git add module/sheets/LameSheet.mjs
git commit -m "Extension du listener contextmenu de LameSheet aux nouveaux .epee-pip (clic droit cycle inverse sur les cercles de l'épée)"
```

---

## Task 6 : Calibrer les positions verticales des pips

**Files:**
- Modify: `styles/lames.css` (les 8 règles `.epee-pip[data-index="n"]`)

Cette tâche est **itérative et visuelle**. Les positions 18/27/36/45/54/63/72/80 sont des estimations. Il faut ouvrir une fiche Lame, comparer la position des cercles colorés avec les pastilles blanches de l'image sous-jacente, et ajuster.

- [ ] **Step 1 : Inspecter l'alignement actuel**

1. Ouvrir la fiche Lame dans Foundry.
2. F12 → inspecter `.lame-epee-img` pour connaître sa hauteur rendue (ex: 280px).
3. Pour chaque pastille blanche visible dans l'image, mesurer sa position verticale (en % de la hauteur de l'image) via le picker du devtools.
4. Noter les 8 `%` réels.

- [ ] **Step 2 : Mettre à jour les 8 règles CSS**

Remplacer le bloc :

```css
.epee-pip[data-index="0"] { top: 18%; }
.epee-pip[data-index="1"] { top: 27%; }
.epee-pip[data-index="2"] { top: 36%; }
.epee-pip[data-index="3"] { top: 45%; }
.epee-pip[data-index="4"] { top: 54%; }
.epee-pip[data-index="5"] { top: 63%; }
.epee-pip[data-index="6"] { top: 72%; }
.epee-pip[data-index="7"] { top: 80%; }
```

par les valeurs mesurées à l'étape 1. Également recaler `.lame-epee-count-v` et `.lame-epee-count-t` si les lettres V et T ne sont pas à 18% / 78% exactement.

- [ ] **Step 3 : Test manuel — alignement parfait**

1. F5 dans Foundry.
2. Mettre un cercle en état `vierge` et vérifier qu'il recouvre exactement une pastille blanche de l'image (pas de décalage visible).
3. Répéter pour chacun des 8 cercles.
4. Vérifier que les chiffres V et T sont juste à droite des lettres V et T de l'image (ni dessus, ni trop loin).

- [ ] **Step 4 : Commit**

```bash
git add styles/lames.css
git commit -m "Calibrage des positions verticales des 8 pips de l'épée sur les pastilles blanches de Vita-tena.png (valeurs mesurées au devtools, alignement parfait)"
```

---

## Task 7 : Suppression du CSS legacy `ÉPÉE DE VITALITÉ`

**Files:**
- Modify: `styles/lames.css` (environ lignes 544-633, section `ÉPÉE DE VITALITÉ`)

Les classes `.epee-vitalite`, `.epee-cases`, `.epee-section`, `.epee-case` et variantes ne sont plus utilisées par aucun template actif de la fiche Lame (le header a été nettoyé en Task 3).

- [ ] **Step 1 : Vérifier que les classes sont bien orphelines**

Recherche avant suppression :

```bash
grep -rn "epee-vitalite\|epee-cases\|epee-section\|epee-case\|epee-stat\|epee-status" templates/ module/
```

Attendu : une seule occurrence dans `templates/partials/epee-vitalite.hbs` (partial mort, non référencé dans `LameSheet.mjs`). Si d'autres occurrences vivantes existent, **ne pas supprimer** le CSS et lever le problème.

- [ ] **Step 2 : Supprimer le bloc CSS**

Dans `styles/lames.css`, supprimer entièrement la section comprise entre les commentaires :

```css
/* ============================================= */
/*  ÉPÉE DE VITALITÉ                             */
/* ============================================= */
```

…et le dernier sélecteur de cette section (`.lames-du-cardinal .epee-case.state-barree { ... }`). Environ ~90 lignes à retirer. Conserver la section suivante (ex: `ITEM SHEETS`) intacte.

- [ ] **Step 3 : Test manuel — non-régression visuelle**

1. F5 dans Foundry.
2. Ouvrir la fiche Lame.
3. Vérifier :
   - L'épée en marge gauche s'affiche exactement comme avant cette task.
   - Le header n'a pas bougé.
   - Aucune case carrée parasite nulle part.
4. Ouvrir la fiche d'un Figurant (qui n'utilise pas l'épée) → pas de régression.
5. Ouvrir la fenêtre Tarot → pas de régression.
6. Console propre.

- [ ] **Step 4 : Commit**

```bash
git add styles/lames.css
git commit -m "Suppression du CSS legacy section ÉPÉE DE VITALITÉ (classes .epee-vitalite/.epee-case/.epee-cases/.epee-section plus utilisées depuis la migration vers l'épée en marge gauche)"
```

---

## Task 8 : Tests manuels globaux de non-régression

- [ ] **Step 1 : Parcours complet d'une fiche Lame**

1. F5 dans Foundry.
2. Ouvrir une fiche Lame :
   - [ ] Épée visible à gauche dès l'ouverture
   - [ ] 8 cercles alignés sur les pastilles blanches
   - [ ] Compteurs V/T lisibles et cohérents avec l'état des pips (V = nb vierges côté vitalité, T = nb vierges côté ténacité — vérifier avec le DataModel actuel)
   - [ ] Clic gauche cycle vierge → cochee → barree
   - [ ] Clic droit cycle inverse
   - [ ] Hover = scale + halo
3. Parcourir chaque onglet (Identité, Compétences, Combat, Arcanes, Inventaire, Relations, Notes) → épée visible à chaque fois.
4. Scroller dans un onglet long (ex: Inventaire) → épée scrolle avec le contenu (Approche 1 assumée).
5. Redimensionner la fenêtre → épée reste alignée.
6. Fermer et réouvrir la fiche → état des pips persiste.
7. Ouvrir la fiche sur deux clients différents (si possible) → update d'un pip côté MJ se propage au client joueur.

- [ ] **Step 2 : Vérifier les statuts `evanoui` / `mort`**

1. Dans une console Foundry (ou via un bouton si existant), mettre `actor.system.evanoui = true` (ou utiliser le flag prévu dans le DataModel). Alternative : directement modifier l'état via la fiche si un toggle existe.
2. Vérifier que le statut "Évanoui" apparaît sous l'épée.
3. Même test pour `mort`.

- [ ] **Step 3 : Pas de commit**

Cette task ne produit pas de code, juste une validation. Si un défaut apparaît, revenir sur la task concernée et corriger.

---

## Suivi de la feature

À la fin des 8 tasks, l'état attendu est :

- Toutes les fiches Lame affichent l'épée en marge gauche avec 8 cercles cliquables alignés
- Les compteurs V et T sont intégrés à l'image
- L'ancien bloc de 8 cases est supprimé du header
- Le CSS legacy est nettoyé
- Aucune régression sur les autres types de fiches (Figurant, Arcane, Arme, École, Profil) ni sur le tarot
- Environ 6 commits atomiques dans l'historique, un par task fonctionnelle
