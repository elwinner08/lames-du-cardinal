/**
 * Les Lames du Cardinal - Foundry VTT System (v14 / ApplicationV2)
 * A game system for the tabletop RPG "Les Lames du Cardinal v2" by Elder Craft.
 *
 * @module lames-du-cardinal
 */

// Configuration
import { LAMES } from "./helpers/config.mjs";

// Data Models
import LameData from "./documents/LameData.mjs";
import FigurantData from "./documents/FigurantData.mjs";
import ArmeData from "./documents/ArmeData.mjs";
import ArmureData from "./documents/ArmureData.mjs";
import FeinteData from "./documents/FeinteData.mjs";
import BotteData from "./documents/BotteData.mjs";
import ArcaneData from "./documents/ArcaneData.mjs";
import ProfilData from "./documents/ProfilData.mjs";
import PossessionData from "./documents/PossessionData.mjs";
import EquipementData from "./documents/EquipementData.mjs";
import EcoleData from "./documents/EcoleData.mjs";
import EpeeData from "./documents/EpeeData.mjs";

// Sheets (ApplicationV2)
import LameSheet from "./sheets/LameSheet.mjs";
import FigurantSheet from "./sheets/FigurantSheet.mjs";
import ArmeSheet from "./sheets/ArmeSheet.mjs";
import ArcaneSheet from "./sheets/ArcaneSheet.mjs";
import ProfilSheet from "./sheets/ProfilSheet.mjs";
import GenericItemSheet from "./sheets/GenericItemSheet.mjs";
import EcoleSheet from "./sheets/EcoleSheet.mjs";
import EpeeSheet from "./sheets/EpeeSheet.mjs";

// Tarot des Ombres
import TarotManager from "./tarot/TarotManager.mjs";
import TarotApp from "./tarot/TarotApp.mjs";
import RiviereOverlay from "./tarot/RiviereOverlay.mjs";
import TarotCatalogue from "./tarot/TarotCatalogue.mjs";
import PilesOverlay from "./tarot/PilesOverlay.mjs";
import HandOverlay from "./tarot/HandOverlay.mjs";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */

Hooks.once("init", function () {
  console.log("Lames du Cardinal | Initialisation du système (v14)");

  // Expose config globally
  CONFIG.LAMES = LAMES;

  // ---- Register Actor Data Models ----
  CONFIG.Actor.dataModels.lame = LameData;
  CONFIG.Actor.dataModels.figurant = FigurantData;

  // ---- Register Item Data Models ----
  CONFIG.Item.dataModels.arme = ArmeData;
  CONFIG.Item.dataModels.armure = ArmureData;
  CONFIG.Item.dataModels.feinte = FeinteData;
  CONFIG.Item.dataModels.botte = BotteData;
  CONFIG.Item.dataModels.arcane = ArcaneData;
  CONFIG.Item.dataModels.profil = ProfilData;
  CONFIG.Item.dataModels.possession = PossessionData;
  CONFIG.Item.dataModels.equipement = EquipementData;
  CONFIG.Item.dataModels.ecole = EcoleData;
  CONFIG.Item.dataModels.epee = EpeeData;

  // ---- Register Actor Sheets (ApplicationV2) ----
  DocumentSheetConfig.registerSheet(Actor, "lames-du-cardinal", LameSheet, {
    types: ["lame"],
    makeDefault: true,
    label: "LAMES.ActorTypes.lame"
  });

  DocumentSheetConfig.registerSheet(Actor, "lames-du-cardinal", FigurantSheet, {
    types: ["figurant"],
    makeDefault: true,
    label: "LAMES.ActorTypes.figurant"
  });

  // ---- Register Item Sheets (ApplicationV2) ----
  DocumentSheetConfig.registerSheet(Item, "lames-du-cardinal", ArmeSheet, {
    types: ["arme"],
    makeDefault: true,
    label: "LAMES.ItemTypes.arme"
  });

  DocumentSheetConfig.registerSheet(Item, "lames-du-cardinal", ArcaneSheet, {
    types: ["arcane"],
    makeDefault: true,
    label: "LAMES.ItemTypes.arcane"
  });

  DocumentSheetConfig.registerSheet(Item, "lames-du-cardinal", ProfilSheet, {
    types: ["profil"],
    makeDefault: true,
    label: "LAMES.ItemTypes.profil"
  });

  DocumentSheetConfig.registerSheet(Item, "lames-du-cardinal", EcoleSheet, {
    types: ["ecole"],
    makeDefault: true,
    label: "LAMES.ItemTypes.ecole"
  });

  DocumentSheetConfig.registerSheet(Item, "lames-du-cardinal", EpeeSheet, {
    types: ["epee"],
    makeDefault: true,
    label: "LAMES.ItemTypes.epee"
  });

  DocumentSheetConfig.registerSheet(Item, "lames-du-cardinal", GenericItemSheet, {
    types: ["armure", "feinte", "botte", "possession", "equipement"],
    makeDefault: true,
    label: "LAMES.System"
  });

  // ---- Register Tarot Settings ----
  TarotManager.registerSettings();

  // ---- Register PU (Points d'Unité) shared settings ----
  game.settings.register("lames-du-cardinal", "puPool", {
    name: "Points d'Unité (pool commun)",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });
  game.settings.register("lames-du-cardinal", "puTotalSpent", {
    name: "PU totaux dépensés",
    scope: "world",
    config: false,
    type: Number,
    default: 0
  });

  // ---- Register Handlebars Helpers ----
  _registerHandlebarsHelpers();

  // ---- Preload Handlebars Templates ----
  _preloadTemplates();

  // ---- Allow players to drag their owned PJ from the Actors sidebar ----
  const ActorDir = CONFIG.ui.actors;
  if (ActorDir) {
    ActorDir.prototype._canDragStart = function (selector) { return true; };
  }

  // ---- Keybinding DELETE pour supprimer son propre token (joueurs) ----
  game.keybindings.register("lames-du-cardinal", "supprimerToken", {
    name: "Supprimer son token",
    onDown: () => {
      if (game.user.isGM) return false;
      const owned = (canvas?.tokens?.controlled ?? []).filter(t => t.actor?.isOwner);
      if (!owned.length) return false;
      for (const t of owned) {
        game.socket.emit("system.lames-du-cardinal", {
          type: "lame-delete-token",
          tokenId: t.id,
          sceneId: canvas.scene.id,
          userId: game.user.id
        });
      }
      return true;
    },
    editable: [{ key: "Delete" }]
  });

  console.log("Lames du Cardinal | Système initialisé");
});

/**
 * Ready hook — populate compendiums if empty.
 */
Hooks.once("ready", async function () {
  console.log("Lames du Cardinal | Système prêt");

  // ---- Initialize Tarot des Ombres ----
  const tarot = TarotManager.getInstance();
  await tarot.load();

  // Listen for socket events (state sync)
  game.socket.on("system.lames-du-cardinal", async (data) => {
    if (data.type === "tarot-refresh") {
      await tarot.load();
      Hooks.callAll("lames.tarotChanged", tarot.state);
    }
    // Player sent a state update — GM saves it and broadcasts
    if (data.type === "tarot-player-update" && game.user.isGM) {
      tarot._state = data.state;
      await tarot._save();
      game.socket.emit("system.lames-du-cardinal", { type: "tarot-refresh" });
      Hooks.callAll("lames.tarotChanged", tarot.state);
    }
    if (data.type === "pu-refresh") {
      // Re-render all open Lame sheets to reflect shared PU change
      for (const actor of game.actors) {
        if (actor.type === "lame" && actor.sheet?.rendered) {
          actor.sheet.render();
        }
      }
    }
    // Player requests token placement — only GM can create tokens
    if (data.type === "lame-place-token" && game.user.isGM) {
      const actor = game.actors.get(data.actorId);
      const scene = game.scenes.get(data.sceneId);
      if (!actor || !scene) return;
      const td = await actor.getTokenDocument({ x: data.x, y: data.y });
      await scene.createEmbeddedDocuments("Token", [td.toObject()]);
    }
    // Player requests token deletion
    if (data.type === "lame-delete-token" && game.user.isGM) {
      const scene = game.scenes.get(data.sceneId);
      const token = scene?.tokens.get(data.tokenId);
      if (!token) return;
      const player = game.users.get(data.userId);
      if (token.actor?.testUserPermission(player, "OWNER")) {
        await token.delete();
      }
    }
  });

  // Allow players to drag their owned PJ to the canvas (token creation via GM socket).
  // MUST be synchronous — Hooks.call does not await async functions,
  // so an async handler's "return false" would be ignored (Promise is truthy).
  Hooks.on("dropCanvasData", (canvas, data) => {
    if (data.type !== "Actor" || game.user.isGM) return;
    const actorId = data.id ?? data.uuid?.replace(/^Actor\./, "");
    const actor = actorId ? game.actors.get(actorId) : null;
    if (!actor?.isOwner || actor.type !== "lame") return false;
    let x = data.x ?? 0;
    let y = data.y ?? 0;
    try {
      const snapped = canvas.grid.getSnappedPoint(
        { x, y },
        { mode: CONST.GRID_SNAPPING_MODES.TOP_LEFT_CORNER }
      );
      x = snapped.x;
      y = snapped.y;
    } catch (e) { /* grid snap unavailable */ }
    game.socket.emit("system.lames-du-cardinal", {
      type: "lame-place-token",
      actorId: actor.id,
      sceneId: canvas.scene.id,
      x,
      y
    });
    return false;
  });

  // ---- Initialize HUD overlays ----
  RiviereOverlay.init();
  PilesOverlay.init();
  HandOverlay.init();

  console.log("Lames du Cardinal | Tarot des Ombres initialisé");

  // Only GMs run the following
  if (!game.user.isGM) return;

  // Configure TOKEN permissions so players can move and interact with their own tokens
  try {
    const perms = foundry.utils.deepClone(game.settings.get("core", "permissions") ?? {});
    const playerRoles = [CONST.USER_ROLES.PLAYER, CONST.USER_ROLES.TRUSTED, CONST.USER_ROLES.ASSISTANT];
    let dirty = false;
    for (const key of ["TOKEN_CREATE", "TOKEN_CONFIGURE", "FILES_UPLOAD"]) {
      if (!Array.isArray(perms[key])) perms[key] = [CONST.USER_ROLES.GAMEMASTER];
      for (const role of playerRoles) {
        if (!perms[key].includes(role)) { perms[key].push(role); dirty = true; }
      }
    }
    if (dirty) await game.settings.set("core", "permissions", perms);
  } catch(e) {
    console.warn("Lames du Cardinal | Impossible de configurer les permissions token.", e);
  }

  await _populateCompendiumIfEmpty("lames-du-cardinal.profils",
    "module/compendium-data/profils.json");
  await _populateCompendiumIfEmpty("lames-du-cardinal.arcanes",
    "module/compendium-data/arcanes.json");
  await _populateCompendiumIfEmpty("lames-du-cardinal.ecoles",
    "module/compendium-data/ecoles.json");
  await _populateCompendiumIfEmpty("lames-du-cardinal.epees",
    "module/compendium-data/epees.json");
  await _fixArcanesSort();
  await _stripOuterParagraphs("lames-du-cardinal.profils");
  await _syncCompendiumImgFromJson("lames-du-cardinal.arcanes", "module/compendium-data/arcanes.json");
  await _syncCompendiumImgFromJson("lames-du-cardinal.ecoles", "module/compendium-data/ecoles.json");
  await _syncCompendiumImgFromJson("lames-du-cardinal.profils", "module/compendium-data/profils.json");
  await _syncCompendiumImgFromJson("lames-du-cardinal.epees", "module/compendium-data/epees.json");
});

/* -------------------------------------------- */
/*  Tarot Button — floating button              */
/* -------------------------------------------- */

Hooks.once("ready", () => {
  // Avoid duplicate
  if (document.getElementById("lames-tarot-btn")) return;

  const btn = document.createElement("button");
  btn.id = "lames-tarot-btn";
  btn.type = "button";
  btn.classList.add("tarot-floating-button");
  btn.innerHTML = `<i class="fa-solid fa-cards"></i>`;
  btn.title = game.i18n.localize("LAMES.Tarot.ouvrir");
  btn.addEventListener("click", () => TarotApp.toggle());
  document.body.appendChild(btn);
  console.log("Lames du Cardinal | Bouton Tarot créé");

  // GM-only: Catalogue button
  if (game.user.isGM && !document.getElementById("lames-catalogue-btn")) {
    const catBtn = document.createElement("button");
    catBtn.id = "lames-catalogue-btn";
    catBtn.type = "button";
    catBtn.classList.add("catalogue-floating-button");
    catBtn.innerHTML = `<i class="fa-solid fa-book-open"></i>`;
    catBtn.title = game.i18n.localize("LAMES.Tarot.catalogueOuvrir");
    catBtn.addEventListener("click", () => TarotCatalogue.toggle());
    document.body.appendChild(catBtn);
    console.log("Lames du Cardinal | Bouton Catalogue créé (MJ)");
  }
});

/* -------------------------------------------- */
/*  Double-click token → open actor sheet       */
/* -------------------------------------------- */

Hooks.on("clickToken2", (tokenDoc, event) => {
  // clickToken2 fires on double-click on a token in Foundry v14
  const actor = tokenDoc.actor ?? tokenDoc?.document?.actor;
  if (actor) actor.sheet.render({ force: true });
});

/* -------------------------------------------- */
/*  Token hover → tooltip with name + PJ/PNJ    */
/* -------------------------------------------- */

Hooks.on("hoverToken", (token, hovered) => {
  // Remove any existing tooltip
  const existing = document.getElementById("lames-token-tooltip");
  if (existing) existing.remove();

  if (!hovered) return;

  const actor = token.actor;
  if (!actor) return;

  // Determine PJ/PNJ status: type "lame" → PJ, otherwise PNJ
  const statusKey = actor.type === "lame"
    ? "LAMES.Token.pj"
    : "LAMES.Token.pnj";
  const statusLabel = game.i18n.localize(statusKey);
  const name = token.document?.name ?? actor.name;

  const tooltip = document.createElement("div");
  tooltip.id = "lames-token-tooltip";
  tooltip.classList.add("lames-token-tooltip");
  tooltip.innerHTML = `
    <div class="tooltip-name">${name}</div>
    <div class="tooltip-status">${statusLabel}</div>
  `;
  document.body.appendChild(tooltip);

  // Position above the token
  const bounds = token.bounds;
  if (bounds && canvas?.stage) {
    const screenPos = canvas.stage.toGlobal({ x: bounds.x + bounds.width / 2, y: bounds.y });
    tooltip.style.left = `${screenPos.x}px`;
    tooltip.style.top = `${screenPos.y - 10}px`;
  }
});

Hooks.on("deleteToken", () => {
  document.getElementById("lames-token-tooltip")?.remove();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

function _registerHandlebarsHelpers() {
  Handlebars.registerHelper("eq", (a, b) => a === b);
  Handlebars.registerHelper("ne", (a, b) => a !== b);
  Handlebars.registerHelper("gt", (a, b) => a > b);
  Handlebars.registerHelper("gte", (a, b) => a >= b);
  Handlebars.registerHelper("lt", (a, b) => a < b);
  Handlebars.registerHelper("lte", (a, b) => a <= b);

  Handlebars.registerHelper("add", (a, b) => a + b);
  Handlebars.registerHelper("sub", (a, b) => a - b);
  Handlebars.registerHelper("floor", (a) => Math.floor(a));
  Handlebars.registerHelper("half", (a) => Math.floor(a / 2));

  Handlebars.registerHelper("times", function (n, block) {
    let result = "";
    for (let i = 0; i < n; i++) result += block.fn(i);
    return result;
  });

  Handlebars.registerHelper("localize", (key) => game.i18n.localize(key));

  Handlebars.registerHelper("compSigne", function (key) {
    const info = CONFIG.LAMES.competenceMap[key];
    return info ? info.signe : "";
  });
  Handlebars.registerHelper("compCouleur", function (key) {
    const info = CONFIG.LAMES.competenceMap[key];
    return info ? info.couleur : "";
  });

  Handlebars.registerHelper("succesAuto", (val) => Math.floor(val / 2));

  Handlebars.registerHelper("concat", (...args) => {
    args.pop();
    return args.join("");
  });
}

/* -------------------------------------------- */
/*  Preload Templates                           */
/* -------------------------------------------- */

async function _preloadTemplates() {
  const templatePaths = [
    // Actor - Lame (parts)
    "systems/lames-du-cardinal/templates/actor/lame-header.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-identite.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-competences.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-combat.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-arcanes.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-inventaire.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-relations.hbs",
    "systems/lames-du-cardinal/templates/actor/lame-notes.hbs",
    // Actor - Figurant (parts)
    "systems/lames-du-cardinal/templates/actor/figurant-header.hbs",
    "systems/lames-du-cardinal/templates/actor/figurant-combat.hbs",
    "systems/lames-du-cardinal/templates/actor/figurant-competences.hbs",
    "systems/lames-du-cardinal/templates/actor/figurant-notes.hbs",
    // Partials
    "systems/lames-du-cardinal/templates/partials/competences-block.hbs",
    "systems/lames-du-cardinal/templates/partials/epee-vitalite.hbs",
    "systems/lames-du-cardinal/templates/partials/caracteristique.hbs",
    // Items
    "systems/lames-du-cardinal/templates/item/arme-sheet.hbs",
    "systems/lames-du-cardinal/templates/item/arcane-sheet.hbs",
    "systems/lames-du-cardinal/templates/item/profil-sheet.hbs",
    "systems/lames-du-cardinal/templates/item/generic-item-sheet.hbs",
    "systems/lames-du-cardinal/templates/item/ecole-sheet.hbs",
    "systems/lames-du-cardinal/templates/item/epee-sheet.hbs",
    // Tarot
    "systems/lames-du-cardinal/templates/tarot/tarot-app.hbs",
    "systems/lames-du-cardinal/templates/tarot/tarot-catalogue.hbs"
  ];
  return loadTemplates(templatePaths);
}

/* -------------------------------------------- */
/*  Compendium Population                       */
/* -------------------------------------------- */

/**
 * Fix the sort order of the arcanes compendium so entries appear in numeric order.
 * Runs once on every GM ready — cheap (22 items).
 */
async function _fixArcanesSort() {
  const pack = game.packs.get("lames-du-cardinal.arcanes");
  if (!pack) return;
  const docs = await pack.getDocuments();
  const needsFix = docs.some(d => d.sort !== (d.system.numero ?? 0) * 100);
  if (!needsFix) return;
  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });
  const updates = docs
    .filter(d => d.system?.numero != null)
    .map(d => ({ _id: d.id, sort: d.system.numero * 100 }));
  await Item.updateDocuments(updates, { pack: "lames-du-cardinal.arcanes" });
  if (wasLocked) await pack.configure({ locked: true });
  console.log("Lames du Cardinal | Tri du compendium arcanes corrigé.");
}

/**
 * Re-apply `img` from a JSON source file onto an already-populated compendium,
 * matching entries by `name`. Idempotent: only writes when the img differs.
 */
async function _syncCompendiumImgFromJson(packId, jsonPath) {
  const pack = game.packs.get(packId);
  if (!pack) return;
  let data;
  try {
    const response = await fetch(`systems/lames-du-cardinal/${jsonPath}`);
    data = await response.json();
  } catch (err) {
    console.warn(`Lames du Cardinal | Impossible de lire "${jsonPath}":`, err);
    return;
  }
  const byName = new Map(data.map(d => [d.name, d.img]));
  const docs = await pack.getDocuments();
  const updates = [];
  for (const doc of docs) {
    const newImg = byName.get(doc.name);
    if (newImg && doc.img !== newImg) updates.push({ _id: doc.id, img: newImg });
  }
  if (!updates.length) return;
  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });
  await Item.updateDocuments(updates, { pack: packId });
  if (wasLocked) await pack.configure({ locked: true });
  console.log(`Lames du Cardinal | ${updates.length} image(s) mise(s) à jour dans "${packId}".`);
}

/**
 * Strip a single outer <p>...</p> wrapper from `system.description` of all
 * entries in the given compendium. Idempotent: skips entries that don't match
 * or contain nested <p> blocks.
 */
async function _stripOuterParagraphs(packId) {
  const pack = game.packs.get(packId);
  if (!pack) return;
  const docs = await pack.getDocuments();
  const updates = [];
  for (const doc of docs) {
    const desc = doc.system?.description ?? "";
    if (!desc.startsWith("<p>") || !desc.endsWith("</p>")) continue;
    const inner = desc.slice(3, -4);
    if (inner.includes("<p>") || inner.includes("</p>")) continue;
    updates.push({ _id: doc.id, "system.description": inner });
  }
  if (!updates.length) return;
  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });
  await Item.updateDocuments(updates, { pack: packId });
  if (wasLocked) await pack.configure({ locked: true });
  console.log(`Lames du Cardinal | ${updates.length} description(s) nettoyée(s) dans "${packId}".`);
}

/**
 * Populate a compendium pack from a JSON data file if the pack is empty.
 * @param {string} packId   - The full pack ID (e.g. "lames-du-cardinal.profils")
 * @param {string} jsonPath - Path to the JSON file relative to system root
 */
async function _populateCompendiumIfEmpty(packId, jsonPath) {
  const pack = game.packs.get(packId);
  if (!pack) {
    console.warn(`Lames du Cardinal | Pack "${packId}" introuvable.`);
    return;
  }

  const index = await pack.getIndex();
  if (index.size > 0) return; // Already populated

  console.log(`Lames du Cardinal | Peuplement du compendium "${packId}"...`);
  try {
    // Unlock the pack, populate, then re-lock
    const wasLocked = pack.locked;
    if (wasLocked) await pack.configure({ locked: false });

    const response = await fetch(`systems/lames-du-cardinal/${jsonPath}`);
    const data = await response.json();

    await Item.createDocuments(data, { pack: packId, keepId: false });
    console.log(`Lames du Cardinal | ${data.length} entrées ajoutées à "${packId}".`);

    if (wasLocked) await pack.configure({ locked: true });
  } catch (err) {
    console.error(`Lames du Cardinal | Erreur lors du peuplement de "${packId}":`, err);
  }
}
