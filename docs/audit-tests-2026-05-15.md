# Plan de tests post-audit — branche `audit`

Tests à effectuer en jeu (Foundry v14) après pull de la branche `audit`. Couvre les commits :
- `2c826fb` — Pass 1 d'audit (nettoyages §1, §2.x, §4.x)
- (commit suivant) — Refactor §5.1+5.2+5.3+5.5 (helper `enrich`, classes de base `LamesActorSheet`/`LamesItemSheet`)

## Comment tester

Ouvrir Foundry sur un monde de dev avec le système `lames-du-cardinal`. Si tu as un Lame existant + quelques items, parfait — sinon créer rapidement un Lame, un Figurant, et un exemplaire de chaque type d'item.

Console ouverte (F12) pendant les tests pour repérer toute erreur JS.

---

## 1. Fiches d'acteurs

### 1.1 Fiche Lame (PJ)

- [ ] Ouvrir la fiche d'une **Lame** existante
- [ ] **Titre de la fenêtre** = nom du personnage (pas "TYPES.actor.lame")
- [ ] **Avatar (.profile-img) cliquable** → ouvre la popup avatar-picker (drop d'image)
- [ ] Onglet **Identité** : profil/race/description affichés correctement
- [ ] Onglet **Compétences** : valeurs et roll par clic OK
- [ ] Onglet **Combat** : épée de vitalité, école d'escrime, dialogue test escrime OK
- [ ] Onglet **Arcanes** : arcanes bénis affichés, ajout/suppression OK
- [ ] Onglet **Inventaire** : armes/armures/équipements/possessions OK ; **tooltips des possessions** apparaissent au hover (description enrichie)
- [ ] Onglet **Relations** : liens, ressources, niveau de vie. **Le label "Niveau de vie : X — Aisé"** doit s'afficher avec la traduction française (vérification i18n §4.1)
- [ ] Onglet **Notes** : zones description/habillement/notes affichées

### 1.2 Fiche Figurant (PNJ)

- [ ] Ouvrir la fiche d'un **Figurant** existant
- [ ] **Titre de la fenêtre** = nom du PNJ
- [ ] **Avatar cliquable** → ouvre l'avatar-picker
- [ ] Header : type figurant + modificateur s'affichent (sans classes `.figurant-type`/`.figurant-modificateur` qui ont été retirées — vérifier que le rendu reste OK visuellement)
- [ ] Statut "Hors combat" : passer `resistanceActuelle` à 0 → la mention "Hors combat" doit s'afficher (clé i18n `LAMES.Figurant.horsCombat` renommée depuis `horsComba` §4.2)
- [ ] Onglet Combat / Compétences / Notes

---

## 2. Fiches d'items

### 2.1 Arme

- [ ] Ouvrir une fiche **Arme** (depuis un acteur OU depuis le compendium)
- [ ] **Titre** = nom de l'arme
- [ ] Champ "Catégorie" (mêlée/distance/explosif) OK
- [ ] Toggle "Équipée" fonctionne
- [ ] Description rendue en `<div>` enrichi si compendium, en `<textarea>` éditable sinon
- [ ] **Notes** : toujours éditables (même en compendium — `notesEnriched` indépendant du flag)

### 2.2 Arcane

- [ ] Ouvrir une fiche **Arcane** depuis le compendium
- [ ] Titre = "L'Astrologue en Prière" (ou autre)
- [ ] Le **select numéro d'arcane** fonctionne : changer 0 → 5 met à jour automatiquement le nom, la valeur draconique, la compétence associée, la marque
- [ ] **Arcane opposé** affiché (ex : 0 ↔ 21)
- [ ] Description + descriptionMarque rendues HTML

### 2.3 Épée

- [ ] Ouvrir une fiche **Épée** depuis le compendium
- [ ] Titre = nom de l'épée
- [ ] Description rendue
- [ ] Capacités listées avec leurs descriptions enrichies
- [ ] Image de l'épée s'affiche, ou est cachée si fichier manquant (test `_onRender`)

### 2.4 École d'escrime

- [ ] Ouvrir une fiche **École** depuis le compendium
- [ ] Titre = nom de l'école
- [ ] Description rendue
- [ ] **Feintes** listées avec leur description enrichie
- [ ] **Bottes** listées avec leur description enrichie

### 2.5 Profil

- [ ] Ouvrir une fiche **Profil** depuis le compendium
- [ ] Titre = nom du profil (ex "Mousquetaire")
- [ ] Description rendue
- [ ] **Catégorie** localisée (ex "Combattant")

### 2.6 Items génériques (armure / feinte / botte / equipement / possession)

- [ ] Ouvrir un exemplaire de chaque type
- [ ] Titre = nom
- [ ] Description rendue + effets (si présents) rendus

---

## 3. Tarot des Ombres

### 3.1 Pioche & main

- [ ] Le GM peut ouvrir l'overlay des piles
- [ ] Un joueur peut piocher une carte → arrive dans sa main
- [ ] Hover sur une carte de la main → s'agrandit dans sa verticale
- [ ] Clic gauche sur une carte → joue la carte (message de chat posté avec style `.lames-roll` — sans la classe `.lames-tarot-draw` retirée §2.3)
- [ ] Clic droit → menu contextuel (défausser / envoyer)

### 3.2 Arcanes éphémères

- [ ] Le GM clique sur la pioche des arcanes → choix du joueur, l'arcane apparaît en éphémère côté joueur
- [ ] Le joueur peut jouer l'arcane éphémère (coût 1 ténacité) → la carte va dans la pioche des lames remélangée

### 3.3 Test de compétence depuis fiche Lame

- [ ] Cliquer sur une compétence (ex Athlétisme) → dialogue qui s'ouvre
- [ ] **Le select Difficulté** doit afficher les 6 libellés français : "Moyenne", "Difficile", "Très difficile", "Extrêmement difficile", "Insensée", "Chimérique" (test i18n §4.1)
- [ ] Lancer le test → résultat posté en chat

### 3.4 Test Escrime / Occultisme

- [ ] Bouton "Test d'Escrime" → dialogue avec libellés difficultés FR
- [ ] Bouton "Test d'Occultisme" → dialogue avec choix signe + difficulté

### 3.5 Arcane piochée depuis pioche Lames

- [ ] Lorsqu'un joueur pioche et qu'il tombe sur une arcane :
  - L'arcane part dans la défausse des arcanes (PAS dans la pioche des lames)
  - Le joueur perd 1 ténacité
  - Message d'alerte violet posté en chat

---

## 4. CSS / Visuel

- [ ] Le statut **"Évanoui"** d'une Lame s'affiche en **doré foncé** (`#b8860b`, var `--lames-warning`) — pour tester, mettre toutes les cases ténacité à barrée
- [ ] Les fiches restent **scrollables** verticalement et horizontalement
- [ ] Les fenêtres restent **redimensionnables**

---

## 5. Erreurs JS à surveiller

Pendant tous ces tests, surveiller la console (F12) pour :
- Aucun `TypeError` lié à `enrichHTML`, `_prepareContext`, `_onRender`, `get title`
- Aucun `Cannot read property 'X' of undefined` autour des sheets refactorisées
- Aucun warning Foundry sur des helpers Handlebars manquants (les 9 helpers `gt/lte/add/sub/floor/half/compSigne/compCouleur/succesAuto` ont été retirés — si un template les utilisait par erreur, ça crasherait au rendu)
- Aucune clé i18n manquante (les 17 clés `LAMES.Combat.*`, `LAMES.Caracteristiques.titre/valeur`, `LAMES.Tarot.jusquiame/cartesTirees/continuer/meteo` ont été retirées — si un template référence encore l'une d'elles, on verra `LAMES.Combat.assaut` brut dans l'UI)

---

## 6. Rollback en cas de problème

Si un bug bloquant apparaît :

```bash
git checkout main
git branch -D audit  # ou garder la branche pour analyse
```

Les modifications ne sont pas mergées vers main tant que tu ne valides pas. La branche `audit` est isolée.
