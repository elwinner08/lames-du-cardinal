import { LAMES } from "../helpers/config.mjs";
import { openAvatarPicker } from "../helpers/avatar-picker.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Actor sheet for "Lame" (PC) characters — ApplicationV2.
 */
export default class LameSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "actor", "lame"],
    position: { width: 780, height: 900 },
    window: {
      resizable: true,
      icon: "fa-solid fa-sword"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      epeeClick: LameSheet.#onEpeeClick,
      epeeRightClick: LameSheet.#onEpeeRightClick,
      compRoll: LameSheet.#onCompetenceRoll,
      itemCreate: LameSheet.#onItemCreate,
      itemEdit: LameSheet.#onItemEdit,
      itemDelete: LameSheet.#onItemDelete,
      compInhabAdd: LameSheet.#onCompInhabAdd,
      compInhabDelete: LameSheet.#onCompInhabDelete,
      lienAdd: LameSheet.#onLienAdd,
      lienDelete: LameSheet.#onLienDelete,
      arcaneBeniAdd: LameSheet.#onArcaneBeniAdd,
      arcaneBeniDelete: LameSheet.#onArcaneBeniDelete,
      toggleBoolean: LameSheet.#onToggleBoolean,
      useFeinte: LameSheet.#onUseFeinte,
      useBotte: LameSheet.#onUseBotte,
      testEscrime: LameSheet.#onTestEscrime,
      testOccultisme: LameSheet.#onTestOccultisme,
      setRessources: LameSheet.#onSetRessources,
      setContacts: LameSheet.#onSetContacts,
      setLienValeur: LameSheet.#onSetLienValeur,
      modifyPex: LameSheet.#onModifyPex,
      modifyPu: LameSheet.#onModifyPu,
      resetPu: LameSheet.#onResetPu
    }
  };

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

  static TABS = {
    primary: {
      tabs: [
        { id: "identite", group: "primary", label: "LAMES.Tabs.identite", icon: "fa-solid fa-id-card" },
        { id: "competences", group: "primary", label: "LAMES.Tabs.competences", icon: "fa-solid fa-book" },
        { id: "combat", group: "primary", label: "LAMES.Tabs.combat", icon: "fa-solid fa-swords" },
        { id: "arcanes", group: "primary", label: "LAMES.Tabs.arcanes", icon: "fa-solid fa-star" },
        { id: "inventaire", group: "primary", label: "LAMES.Tabs.inventaire", icon: "fa-solid fa-bag-shopping" },
        { id: "relations", group: "primary", label: "LAMES.Tabs.relations", icon: "fa-solid fa-handshake" },
        { id: "notes", group: "primary", label: "LAMES.Tabs.notes", icon: "fa-solid fa-pen" }
      ],
      initial: "identite"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;

    context.actor = this.actor;
    context.actorImg = this.actor.img || "icons/svg/mystery-man.svg";
    context.system = system;
    context.config = LAMES;
    context.tabs = this._prepareTabs("primary");

    // Computed values
    context.tenacite = system.tenacite;
    context.vitalite = system.vitalite;
    context.evanoui = system.evanoui;
    context.mort = system.mort;

    // Profils disponibles + bonus de compétences depuis le compendium
    const profilPack = game.packs.get("lames-du-cardinal.profils");
    const profilBonuses = {};
    if (profilPack) {
      const index = await profilPack.getIndex();
      context.profilsDisponibles = Array.from(index).map(e => e.name).sort((a, b) => a.localeCompare(b, "fr"));
      for (const profilName of [system.profil1, system.profil2]) {
        if (!profilName) continue;
        const entry = Array.from(index).find(e => e.name === profilName);
        if (!entry) continue;
        const doc = await profilPack.getDocument(entry._id);
        if (!doc?.system?.competences) continue;
        for (const [key, val] of Object.entries(doc.system.competences)) {
          profilBonuses[key] = (profilBonuses[key] ?? 0) + (val ?? 0);
        }
      }
    } else {
      context.profilsDisponibles = [];
    }

    // Competences grouped by characteristic
    context.competencesGroupees = {};
    for (const [carac, comps] of Object.entries(LAMES.competences)) {
      context.competencesGroupees[carac] = comps.map(key => {
        const base = system.competences[key]?.valeur ?? 0;
        const bonus = profilBonuses[key] ?? 0;
        const total = base + bonus;
        return {
          key,
          label: game.i18n.localize(`LAMES.Competences.${key}`),
          valeur: total,
          valeurBase: base,
          bonusProfil: bonus,
          succesAuto: Math.floor(total / 2),
          signe: LAMES.competenceMap[key]?.signe,
          couleur: LAMES.competenceMap[key]?.couleur
        };
      });
    }

    // Escrime info
    const ecole = system.escrime?.ecole;
    const escrimeBase = system.competences.escrime?.valeur ?? 0;
    const escrimeBonus = profilBonuses.escrime ?? 0;
    const escrimeTotal = escrimeBase + escrimeBonus;
    if (ecole && LAMES.ecoles[ecole]) {
      context.escrimeInfo = {
        ...LAMES.ecoles[ecole],
        valeur: escrimeTotal,
        valeurBase: escrimeBase,
        bonusProfil: escrimeBonus,
        succesAuto: Math.floor(escrimeTotal / 2)
      };
    }

    // Épées disponibles depuis le compendium (liste déroulante de l'onglet Combat)
    const epeePack = game.packs.get("lames-du-cardinal.epees");
    context.epeesDisponibles = [];
    context.epeeHorsCompendium = null;
    if (epeePack) {
      const epeeIndex = await epeePack.getIndex();
      context.epeesDisponibles = Array.from(epeeIndex).map(e => e.name).sort((a, b) => a.localeCompare(b, "fr"));
      const selectedName = system.escrime?.epee;
      if (selectedName && !context.epeesDisponibles.includes(selectedName)) {
        context.epeeHorsCompendium = selectedName;
      }
    }

    // Occultisme
    const occBase = system.competences.occultisme?.valeur ?? 0;
    const occBonus = profilBonuses.occultisme ?? 0;
    const occTotal = occBase + occBonus;
    context.occultisme = {
      valeur: occTotal,
      valeurBase: occBase,
      bonusProfil: occBonus,
      succesAuto: Math.floor(occTotal / 2)
    };

    // Items grouped by type
    context.armes = this.actor.items.filter(i => i.type === "arme");
    context.armures = this.actor.items.filter(i => i.type === "armure");
    context.equipements = this.actor.items.filter(i => i.type === "equipement");

    // Possessions with enriched descriptions for tooltips
    context.possessions = await Promise.all(
      this.actor.items.filter(i => i.type === "possession").map(async (i) => {
        const obj = i.toObject();
        obj.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(i.system.description ?? "", { async: true });
        obj.enrichedEffets = await foundry.applications.ux.TextEditor.implementation.enrichHTML(i.system.effets ?? "", { async: true });
        return obj;
      })
    );

    // Feintes & Bottes with enriched descriptions for tooltips
    context.feintes = await Promise.all(
      this.actor.items.filter(i => i.type === "feinte").map(async (i) => {
        const obj = i.toObject();
        obj.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(i.system.description ?? "", { async: true });
        return obj;
      })
    );
    context.bottes = await Promise.all(
      this.actor.items.filter(i => i.type === "botte").map(async (i) => {
        const obj = i.toObject();
        obj.enrichedDescription = await foundry.applications.ux.TextEditor.implementation.enrichHTML(i.system.description ?? "", { async: true });
        return obj;
      })
    );

    // Arcanes choices for select dropdowns
    context.arcanesChoices = LAMES.arcanes;

    // Ressources & Contacts pips (0-6)
    const makePips = (val, max) => Array.from({ length: max + 1 }, (_, i) => ({ value: i, active: i <= val }));
    context.ressourcesPips = makePips(system.ressources, 6);
    context.contactsPips = makePips(system.contacts, 6);
    context.ressourcesLabel = LAMES.niveauxDeVie[system.ressources] ?? "";
    context.contactsLabel = `${system.contacts} contact(s)`;

    // Niveau de vie label
    context.niveauDeVieLabel = `${system.niveauDeVie} — ${LAMES.niveauxDeVie[system.niveauDeVie] ?? ""}`;

    // Liens enriched with actor portraits
    context.liensEnriched = (system.liens ?? []).map((lien, index) => {
      const linkedActor = lien.actorId ? game.actors.get(lien.actorId) : null;
      return {
        ...lien,
        actorImg: linkedActor?.img ?? null,
        actorName: linkedActor?.name ?? lien.nom,
        pips: Array.from({ length: 4 }, (_, i) => ({ value: i, active: i <= lien.valeur, lienIndex: index }))
      };
    });

    // PU shared pool
    context.puPool = game.settings.get("lames-du-cardinal", "puPool") ?? 0;
    context.puTotalSpent = game.settings.get("lames-du-cardinal", "puTotalSpent") ?? 0;
    context.isGM = game.user.isGM;

    // Enriched HTML
    context.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.description, { async: true });
    context.habillementEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.habillement, { async: true });
    context.notesEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.notes, { async: true });

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    context = await super._preparePartContext(partId, context);
    if (context.tabs[partId]) {
      context.tab = context.tabs[partId];
    }
    return context;
  }

  // ==========================================
  //  ACTIONS
  // ==========================================

  static async #onEpeeClick(event, target) {
    const index = Number(target.dataset.index);
    const epee = foundry.utils.deepClone(this.actor.system.epee);
    const states = ["vierge", "cochee", "barree"];
    const current = states.indexOf(epee[index]);
    epee[index] = states[(current + 1) % 3];
    await this.actor.update({ "system.epee": epee });
  }

  static async #onEpeeRightClick(event, target) {
    event.preventDefault();
    const index = Number(target.dataset.index);
    const epee = foundry.utils.deepClone(this.actor.system.epee);
    const states = ["vierge", "cochee", "barree"];
    const current = states.indexOf(epee[index]);
    epee[index] = states[(current + 2) % 3];
    await this.actor.update({ "system.epee": epee });
  }

  static async #onCompetenceRoll(event, target) {
    const key = target.dataset.competence;

    // Escrime / Occultisme without sign can't be tested from here directly
    if (key === "escrime" || key === "occultisme") {
      ui.notifications.info("Utilisez le panneau Tarot des Ombres pour tester cette compétence.");
      return;
    }

    const valeur = this.actor.system.competences[key]?.valeur ?? 0;
    const label = game.i18n.localize(`LAMES.Competences.${key}`);
    const compInfo = LAMES.competenceMap[key];
    const signeCible = compInfo?.signe;
    const signeLabel = signeCible ? game.i18n.localize(`LAMES.Signes.${signeCible}`) : "?";

    // Difficulty selector
    const diffOptions = Object.entries(LAMES.difficultes)
      .map(([val, lbl]) => `<option value="${val}">${val} — ${lbl}</option>`)
      .join("");

    const dialogContent = `
      <form class="lames-test-dialog">
        <p><strong>${label}</strong> (${valeur}) — ${signeLabel}</p>
        <div class="form-group">
          <label>Difficulté</label>
          <select name="difficulte">${diffOptions}</select>
        </div>
        <div class="form-group">
          <label>Type de test</label>
          <select name="typeTest">
            <option value="eclair">Test éclair</option>
            <option value="dramatique">Test dramatique</option>
          </select>
        </div>
      </form>`;

    const params = await Dialog.prompt({
      title: `Test — ${label}`,
      content: dialogContent,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        return {
          difficulte: parseInt(el.querySelector("[name=difficulte]").value),
          typeTest: el.querySelector("[name=typeTest]").value
        };
      },
      rejectClose: false
    });
    if (!params) return;

    // Delegate to TarotApp test logic
    const { default: TarotApp } = await import("../tarot/TarotApp.mjs");
    TarotApp.runTest(key, params.typeTest, params.difficulte, this.actor);
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;

    // Feintes & Bottes: show picker from the actor's école
    if (type === "feinte" || type === "botte") {
      await LameSheet.#pickFromEcole.call(this, type);
      return;
    }

    const name = game.i18n.localize(`LAMES.ItemTypes.${type}`);
    await this.actor.createEmbeddedDocuments("Item", [{ name, type }]);
  }

  static #onItemEdit(event, target) {
    const itemEl = target.closest("[data-item-id]");
    const itemId = itemEl?.dataset.itemId;
    this.actor.items.get(itemId)?.sheet.render({ force: true });
  }

  static async #onItemDelete(event, target) {
    const itemEl = target.closest("[data-item-id]");
    const itemId = itemEl?.dataset.itemId;
    await this.actor.items.get(itemId)?.delete();
  }

  static async #onCompInhabAdd(event, target) {
    const list = foundry.utils.deepClone(this.actor.system.competencesInhabituelles || []);
    list.push({ nom: "Nouvelle", valeur: 0, caracteristique: "puissance" });
    await this.actor.update({ "system.competencesInhabituelles": list });
  }

  static async #onCompInhabDelete(event, target) {
    const index = Number(target.dataset.index);
    const list = foundry.utils.deepClone(this.actor.system.competencesInhabituelles || []);
    list.splice(index, 1);
    await this.actor.update({ "system.competencesInhabituelles": list });
  }

  static async #onLienAdd(event, target) {
    const list = foundry.utils.deepClone(this.actor.system.liens || []);
    list.push({ actorId: "", nom: "", valeur: 0 });
    await this.actor.update({ "system.liens": list });
  }

  static async #onLienDelete(event, target) {
    const index = Number(target.dataset.index);
    const list = foundry.utils.deepClone(this.actor.system.liens || []);
    list.splice(index, 1);
    await this.actor.update({ "system.liens": list });
  }

  /**
   * Build an arcane-béni object from a numero, using LAMES.arcanes lookup.
   */
  static #buildArcaneBeni(numero) {
    const arc = LAMES.arcanes.find(a => a.numero === numero) ?? LAMES.arcanes[0];
    const oppNum = 21 - arc.numero;
    const opp = LAMES.arcanes.find(a => a.numero === oppNum) ?? LAMES.arcanes[21];
    return {
      numero: arc.numero,
      nom: arc.nom,
      competenceAssociee: arc.comp,
      marque: arc.marque,
      arcaneOppose: { numero: opp.numero, nom: opp.nom }
    };
  }

  static async #onArcaneBeniAdd(event, target) {
    const list = foundry.utils.deepClone(this.actor.system.arcanesBenis || []);
    if (list.length >= 2) return ui.notifications.warn("Maximum 2 arcanes bénis.");
    list.push(LameSheet.#buildArcaneBeni(0));
    await this.actor.update({ "system.arcanesBenis": list });
  }

  static async #onArcaneBeniDelete(event, target) {
    const index = Number(target.dataset.index);
    const list = foundry.utils.deepClone(this.actor.system.arcanesBenis || []);
    list.splice(index, 1);
    await this.actor.update({ "system.arcanesBenis": list });
  }

  static async #onTestEscrime(event, target) {
    const ecole = this.actor.system.escrime?.ecole;
    if (!ecole || !LAMES.ecoles[ecole]) {
      return ui.notifications.warn("Ce personnage n'a pas d'école d'escrime.");
    }

    const diffOptions = Object.entries(LAMES.difficultes)
      .map(([val, lbl]) => `<option value="${val}">${val} — ${lbl}</option>`)
      .join("");
    const typeOptions = `<option value="eclair">Test éclair</option><option value="dramatique">Test dramatique</option>`;

    const params = await Dialog.prompt({
      title: `Test d'Escrime — ${game.i18n.localize(LAMES.ecoles[ecole].label)}`,
      content: `<form class="lames-test-dialog">
        <div class="form-group"><label>Difficulté</label><select name="difficulte">${diffOptions}</select></div>
        <div class="form-group"><label>Type de test</label><select name="typeTest">${typeOptions}</select></div>
      </form>`,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        return {
          difficulte: parseInt(el.querySelector("[name=difficulte]").value),
          typeTest: el.querySelector("[name=typeTest]").value
        };
      },
      rejectClose: false
    });
    if (!params) return;

    const { default: TarotApp } = await import("../tarot/TarotApp.mjs");
    TarotApp.runTest("escrime", params.typeTest, params.difficulte, this.actor);
  }

  static async #onTestOccultisme(event, target) {
    const occVal = this.actor.system.competences?.occultisme?.valeur ?? 0;
    if (occVal === 0) {
      return ui.notifications.warn("Occultisme est à 0.");
    }

    const signeOptions = Object.entries(LAMES.signes)
      .map(([key, info]) => `<option value="${key}">${game.i18n.localize(info.label)}</option>`)
      .join("");
    const diffOptions = Object.entries(LAMES.difficultes)
      .map(([val, lbl]) => `<option value="${val}">${val} — ${lbl}</option>`)
      .join("");
    const typeOptions = `<option value="eclair">Test éclair</option><option value="dramatique">Test dramatique</option>`;

    const params = await Dialog.prompt({
      title: "Test d'Occultisme",
      content: `<form class="lames-test-dialog">
        <div class="form-group"><label>Signe</label><select name="signe">${signeOptions}</select></div>
        <div class="form-group"><label>Difficulté</label><select name="difficulte">${diffOptions}</select></div>
        <div class="form-group"><label>Type de test</label><select name="typeTest">${typeOptions}</select></div>
      </form>`,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        return {
          signe: el.querySelector("[name=signe]").value,
          difficulte: parseInt(el.querySelector("[name=difficulte]").value),
          typeTest: el.querySelector("[name=typeTest]").value
        };
      },
      rejectClose: false
    });
    if (!params) return;

    const { default: TarotApp } = await import("../tarot/TarotApp.mjs");
    TarotApp.runTest(`occultisme:${params.signe}`, params.typeTest, params.difficulte, this.actor);
  }

  static async #onSetRessources(event, target) {
    const val = Number(target.dataset.value);
    await this.actor.update({ "system.ressources": val });
  }

  static async #onSetContacts(event, target) {
    const val = Number(target.dataset.value);
    await this.actor.update({ "system.contacts": val });
  }

  static async #onSetLienValeur(event, target) {
    const index = Number(target.dataset.index);
    const val = Number(target.dataset.value);
    const list = foundry.utils.deepClone(this.actor.system.liens || []);
    if (list[index]) {
      list[index].valeur = val;
      await this.actor.update({ "system.liens": list });
    }
  }

  static async #onModifyPex(event, target) {
    const delta = Number(target.dataset.delta);
    const current = this.actor.system.experience.pex ?? 0;
    const newVal = Math.max(0, current + delta);
    await this.actor.update({ "system.experience.pex": newVal });
  }

  static async #onModifyPu(event, target) {
    const delta = Number(target.dataset.delta);
    const current = game.settings.get("lames-du-cardinal", "puPool") ?? 0;
    const newVal = Math.max(0, current + delta);
    await game.settings.set("lames-du-cardinal", "puPool", newVal);

    // Track total spent (only when spending, i.e. delta < 0)
    if (delta < 0) {
      const totalSpent = game.settings.get("lames-du-cardinal", "puTotalSpent") ?? 0;
      await game.settings.set("lames-du-cardinal", "puTotalSpent", totalSpent + Math.abs(delta));
    }

    // Re-render all open Lame sheets to reflect shared PU change
    for (const actor of game.actors) {
      if (actor.type === "lame" && actor.sheet?.rendered) {
        actor.sheet.render();
      }
    }

    // Broadcast PU change to other clients
    game.socket.emit("system.lames-du-cardinal", { type: "pu-refresh" });
  }

  static async #onResetPu(event, target) {
    await game.settings.set("lames-du-cardinal", "puPool", 0);
    await game.settings.set("lames-du-cardinal", "puTotalSpent", 0);
    for (const actor of game.actors) {
      if (actor.type === "lame" && actor.sheet?.rendered) actor.sheet.render();
    }
    game.socket.emit("system.lames-du-cardinal", { type: "pu-refresh" });
  }

  static async #onToggleBoolean(event, target) {
    const field = target.dataset.field;
    const current = foundry.utils.getProperty(this.actor, field);
    await this.actor.update({ [field]: !current });
  }

  /**
   * Show a picker dialog to add a feinte or botte from the actor's école.
   * Searches the "ecoles" compendium for the matching école item.
   */
  static async #pickFromEcole(type) {
    const ecoleKey = this.actor.system.escrime?.ecole;
    if (!ecoleKey) {
      return ui.notifications.warn("Ce personnage n'a pas d'école d'escrime.");
    }

    // Find the école item in the compendium
    const pack = game.packs.get("lames-du-cardinal.ecoles");
    if (!pack) {
      return ui.notifications.error("Compendium des écoles introuvable.");
    }
    const index = await pack.getIndex();
    let ecoleItem = null;
    for (const entry of index) {
      const doc = await pack.getDocument(entry._id);
      if (doc.system.cle === ecoleKey) {
        ecoleItem = doc;
        break;
      }
    }
    if (!ecoleItem) {
      return ui.notifications.warn(`École "${ecoleKey}" introuvable dans le compendium.`);
    }

    const list = type === "feinte" ? ecoleItem.system.feintes : ecoleItem.system.bottes;
    if (!list?.length) {
      return ui.notifications.info(`Aucune ${type} disponible pour l'école ${game.i18n.localize(LAMES.ecoles[ecoleKey]?.label ?? ecoleKey)}.`);
    }

    // Filter out already-owned items
    const owned = this.actor.items.filter(i => i.type === type).map(i => i.name);
    const available = list.filter(entry => !owned.includes(entry.nom));
    if (!available.length) {
      return ui.notifications.info(`Toutes les ${type}s de cette école sont déjà acquises.`);
    }

    // Build dialog with hover tooltips
    const ecoleLabel = game.i18n.localize(LAMES.ecoles[ecoleKey]?.label ?? ecoleKey);
    const typeLabel = type === "feinte" ? "Feinte" : "Botte";
    const itemsHtml = available.map((entry, idx) => {
      const extras = type === "botte" ? `<span class="picker-figures">${entry.figuresRequises} figures</span>` : "";
      const sig = (type === "feinte" && entry.signature) ? `<span class="picker-signature">Signature</span>` : "";
      return `
        <div class="picker-item" data-index="${idx}">
          <span class="picker-name">${entry.nom}</span>
          ${sig}${extras}
          <div class="picker-tooltip">${entry.description || "<em>Pas de description</em>"}</div>
        </div>`;
    }).join("");

    const dialogContent = `
      <div class="lames-picker-dialog">
        <p>${ecoleLabel} — ${typeLabel}s disponibles :</p>
        <div class="picker-list">${itemsHtml}</div>
      </div>`;

    const chosen = await Dialog.prompt({
      title: `Ajouter une ${typeLabel}`,
      content: dialogContent,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        const selected = el.querySelector(".picker-item.selected");
        return selected ? Number(selected.dataset.index) : null;
      },
      render: (html) => {
        const el = html instanceof HTMLElement ? html : html[0] ?? html;
        el.querySelectorAll(".picker-item").forEach(item => {
          item.addEventListener("click", () => {
            el.querySelectorAll(".picker-item").forEach(i => i.classList.remove("selected"));
            item.classList.add("selected");
          });
        });
      },
      rejectClose: false
    });

    if (chosen === null || chosen === undefined) return;
    const entry = available[chosen];
    if (!entry) return;

    // Create the item on the actor
    const itemData = { name: entry.nom, type };
    if (type === "feinte") {
      itemData.system = {
        source: "ecole",
        ecole: ecoleLabel,
        description: entry.description ?? "",
        cout: 1
      };
    } else {
      itemData.system = {
        ecole: ecoleLabel,
        figuresRequises: entry.figuresRequises ?? 2,
        description: entry.description ?? "",
        cout: 1
      };
    }
    await this.actor.createEmbeddedDocuments("Item", [itemData]);
    ui.notifications.info(`${typeLabel} "${entry.nom}" ajoutée.`);
  }

  /** Use a feinte: costs 1 ténacité, posts to chat. */
  static async #onUseFeinte(event, target) {
    const itemEl = target.closest("[data-item-id]");
    const item = this.actor.items.get(itemEl?.dataset.itemId);
    if (!item) return;

    // Check ténacité
    const system = this.actor.system;
    if (system.tenacite <= 0) {
      return ui.notifications.warn("Plus de Ténacité disponible !");
    }

    // Spend 1 ténacité: find first "vierge" case and mark it "cochee"
    const epee = foundry.utils.deepClone(system.epee);
    const idx = epee.indexOf("vierge");
    if (idx >= 0) {
      epee[idx] = "cochee";
      await this.actor.update({ "system.epee": epee });
    }

    // Post to chat
    const desc = await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description, { async: true });
    const sourceLabel = item.system.source === "ecole"
      ? `École : ${item.system.ecole}`
      : `Épée : ${item.system.epee}`;
    const chatContent = `
      <div class="lames-roll lames-feinte">
        <h3><i class="fa-solid fa-hand-fist"></i> Feinte : ${item.name}</h3>
        <p><strong>${this.actor.name}</strong> — ${sourceLabel}</p>
        <p class="tenacite-cost">-1 Ténacité (reste : ${system.tenacite - 1})</p>
        <div class="feinte-description">${desc}</div>
      </div>`;

    await ChatMessage.create({
      content: chatContent,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }

  /** Use a botte: requires figures in hand, posts to chat. */
  static async #onUseBotte(event, target) {
    const itemEl = target.closest("[data-item-id]");
    const item = this.actor.items.get(itemEl?.dataset.itemId);
    if (!item) return;

    const figuresRequises = item.system.figuresRequises ?? 2;

    // Check hand for figures (cards with valeur >= 11 = Cavalier, Vyverne, Dame, Roi)
    const { default: TarotManager } = await import("../tarot/TarotManager.mjs");
    const mgr = TarotManager.getInstance();
    const main = mgr.getMain(game.user.id);
    const figures = main.filter(c => c.type === "lame" && c.valeur >= 11);

    // Get the école's signe for this actor
    const ecole = this.actor.system.escrime?.ecole;
    const ecoleInfo = ecole ? LAMES.ecoles[ecole] : null;
    const signeCible = ecoleInfo?.signe ?? null;

    // Filter figures of the right sign
    const figuresBonSigne = signeCible
      ? figures.filter(c => c.signe === signeCible)
      : figures;

    if (figuresBonSigne.length < figuresRequises) {
      return ui.notifications.warn(
        `Botte ${item.name} requiert ${figuresRequises} figure(s) de ${signeCible ?? "n'importe quel signe"} en main. Vous en avez ${figuresBonSigne.length}.`
      );
    }

    // Let the player choose which figures to spend
    const figureOptions = figuresBonSigne.map(c =>
      `<label class="botte-figure-choice"><input type="checkbox" name="figure" value="${c.id}" checked /> ${c.label}</label>`
    ).join("");

    const chosenIds = await Dialog.prompt({
      title: `Botte : ${item.name}`,
      content: `<form class="lames-botte-dialog">
        <p>Sélectionnez ${figuresRequises} figure(s) à dépenser :</p>
        <div class="botte-figures">${figureOptions}</div>
      </form>`,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        const checked = el.querySelectorAll("input[name=figure]:checked");
        return Array.from(checked).map(cb => cb.value);
      },
      rejectClose: false
    });

    if (!chosenIds || chosenIds.length < figuresRequises) {
      return ui.notifications.warn(`Vous devez sélectionner au moins ${figuresRequises} figure(s).`);
    }

    // Spend the chosen figures (defausse from hand)
    const spent = chosenIds.slice(0, figuresRequises);
    for (const cardId of spent) {
      await mgr.defausserDepuisMain(game.user.id, cardId);
    }

    // Post to chat
    const desc = await foundry.applications.ux.TextEditor.implementation.enrichHTML(item.system.description, { async: true });
    const spentCards = spent.map(id => mgr.getCard(id)).filter(Boolean);
    const spentHtml = spentCards.map(c =>
      `<img src="${c.img}" alt="${c.label}" class="tarot-card-img-small" title="${c.label}" />`
    ).join("");

    const chatContent = `
      <div class="lames-roll lames-botte">
        <h3><i class="fa-solid fa-burst"></i> Botte : ${item.name}</h3>
        <p><strong>${this.actor.name}</strong> — ${item.system.ecole ?? "?"}</p>
        <p>Figures dépensées (${spent.length}/${figuresRequises}) :</p>
        <div class="tarot-drawn-cards">${spentHtml}</div>
        <div class="botte-description">${desc}</div>
      </div>`;

    await ChatMessage.create({
      content: chatContent,
      speaker: ChatMessage.getSpeaker({ actor: this.actor })
    });
  }

  /** Handle events that need native DOM listeners (right-click, select change) */
  async _onRender(context, options) {
    await super._onRender(context, options);

    // Click on avatar → open avatar picker
    const avatar = this.element.querySelector(".profile-img");
    if (avatar) {
      avatar.addEventListener("click", (event) => {
        event.preventDefault();
        openAvatarPicker(this.actor);
      });
    }

    // Right-click on épée cases / pips
    this.element.querySelectorAll(".epee-case, .epee-pip").forEach(el => {
      el.addEventListener("contextmenu", (event) => {
        LameSheet.#onEpeeRightClick.call(this, event, el);
      });
    });

    // Arcane béni select: change event
    this.element.querySelectorAll(".arcane-beni-select").forEach(select => {
      select.addEventListener("change", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const numero = Number(select.value);
        const index = Number(select.dataset.index);
        const list = foundry.utils.deepClone(this.actor.system.arcanesBenis || []);
        list[index] = LameSheet.#buildArcaneBeni(numero);
        await this.actor.update({ "system.arcanesBenis": list });
      });
    });

    // Arcane éphémère select: change event
    const ephSelect = this.element.querySelector(".arcane-ephemere-select");
    if (ephSelect) {
      ephSelect.addEventListener("change", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const val = ephSelect.value;
        if (val === "") {
          await this.actor.update({
            "system.arcaneEphemere.numero": null,
            "system.arcaneEphemere.nom": "",
            "system.arcaneEphemere.utilise": false
          });
        } else {
          const numero = Number(val);
          const arc = LAMES.arcanes.find(a => a.numero === numero) ?? LAMES.arcanes[0];
          await this.actor.update({
            "system.arcaneEphemere.numero": arc.numero,
            "system.arcaneEphemere.nom": arc.nom,
            "system.arcaneEphemere.utilise": false
          });
        }
      });
    }

    // Drag-drop actors onto liens zone
    const dropZone = this.element.querySelector("[data-drop-zone=lien]");
    if (dropZone) {
      dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drag-over");
      });
      dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drag-over");
      });
      dropZone.addEventListener("drop", async (e) => {
        e.preventDefault();
        dropZone.classList.remove("drag-over");
        let data;
        try { data = JSON.parse(e.dataTransfer.getData("text/plain")); } catch { return; }
        if (data.type !== "Actor") return;
        const droppedActor = await fromUuid(data.uuid);
        if (!droppedActor) return;

        const list = foundry.utils.deepClone(this.actor.system.liens || []);
        // Don't add if already linked
        if (list.some(l => l.actorId === droppedActor.id)) {
          return ui.notifications.info(`${droppedActor.name} est déjà lié.`);
        }
        list.push({ actorId: droppedActor.id, nom: droppedActor.name, valeur: 0 });
        await this.actor.update({ "system.liens": list });
      });
    }
  }
}
