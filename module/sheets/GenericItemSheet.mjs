const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Generic item sheet for armure, feinte, botte, possession, equipement — ApplicationV2.
 */
export default class GenericItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "item"],
    position: { width: 480, height: 400 },
    window: {
      resizable: true,
      icon: "fa-solid fa-box"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      toggleBoolean: GenericItemSheet.#onToggleBoolean
    }
  };

  get title() {
    return this.document.name;
  }

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/generic-item-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.item.system;
    context.item = this.item;
    // Item is from a compendium if it was either imported from one, or still lives in one
    context.isFromCompendium = !!(this.item.pack || this.item._stats?.compendiumSource);
    context.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.description ?? "", { async: true }
    );
    if (this.item.system.effets) {
      context.effetsEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.effets, { async: true });
    }
    return context;
  }

  static async #onToggleBoolean(event, target) {
    const field = target.dataset.field;
    const current = foundry.utils.getProperty(this.item, field);
    await this.item.update({ [field]: !current });
  }
}
