import { LAMES } from "../helpers/config.mjs";

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Actor sheet for "Figurant" (NPC) characters — ApplicationV2.
 */
export default class FigurantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "actor", "figurant"],
    position: { width: 650, height: 780 },
    window: {
      resizable: true,
      icon: "fa-solid fa-skull"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      resistanceMinus: FigurantSheet.#onResistanceMinus,
      resistancePlus: FigurantSheet.#onResistancePlus,
      resistanceReset: FigurantSheet.#onResistanceReset,
      combatTrackerReset: FigurantSheet.#onCombatTrackerReset,
      itemCreate: FigurantSheet.#onItemCreate,
      itemEdit: FigurantSheet.#onItemEdit,
      itemDelete: FigurantSheet.#onItemDelete,
      toggleBoolean: FigurantSheet.#onToggleBoolean
    }
  };

  static PARTS = {
    header: { template: "systems/lames-du-cardinal/templates/actor/figurant-header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    combat: { template: "systems/lames-du-cardinal/templates/actor/figurant-combat.hbs" },
    competences: { template: "systems/lames-du-cardinal/templates/actor/figurant-competences.hbs" },
    notes: { template: "systems/lames-du-cardinal/templates/actor/figurant-notes.hbs" }
  };

  static TABS = {
    primary: {
      tabs: [
        { id: "combat", group: "primary", label: "LAMES.Tabs.combat", icon: "fa-solid fa-swords" },
        { id: "competences", group: "primary", label: "LAMES.Tabs.competences", icon: "fa-solid fa-book" },
        { id: "notes", group: "primary", label: "LAMES.Tabs.notes", icon: "fa-solid fa-pen" }
      ],
      initial: "combat"
    }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;

    context.system = system;
    context.config = LAMES;
    context.tabs = this._prepareTabs("primary");

    context.resumeCombat = system.resumeCombat;
    context.horsComba = system.horsComba;
    context.potentielTotal = system.potentielTotal;

    context.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.description, { async: true });
    context.notesEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(system.notes, { async: true });

    context.armes = this.actor.items.filter(i => i.type === "arme");
    context.feintes = this.actor.items.filter(i => i.type === "feinte");
    context.bottes = this.actor.items.filter(i => i.type === "botte");

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

  static async #onResistanceMinus(event, target) {
    const current = this.actor.system.resistanceActuelle;
    if (current > 0) await this.actor.update({ "system.resistanceActuelle": current - 1 });
  }

  static async #onResistancePlus(event, target) {
    const current = this.actor.system.resistanceActuelle;
    const max = this.actor.system.resistance;
    if (current < max) await this.actor.update({ "system.resistanceActuelle": current + 1 });
  }

  static async #onResistanceReset(event, target) {
    await this.actor.update({ "system.resistanceActuelle": this.actor.system.resistance });
  }

  static async #onCombatTrackerReset(event, target) {
    await this.actor.update({
      "system.combatTracker.attaquesUtilisees": 0,
      "system.combatTracker.defensesUtilisees": 0
    });
  }

  static async #onItemCreate(event, target) {
    const type = target.dataset.type;
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

  static async #onToggleBoolean(event, target) {
    const field = target.dataset.field;
    const current = foundry.utils.getProperty(this.actor, field);
    await this.actor.update({ [field]: !current });
  }
}
