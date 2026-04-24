const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Item sheet for weapons (arme) — ApplicationV2.
 */
export default class ArmeSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "item", "arme"],
    position: { width: 520, height: 480 },
    window: {
      resizable: true,
      icon: "fa-solid fa-sword"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    },
    actions: {
      toggleEquipe: ArmeSheet.#onToggleEquipe
    }
  };

  get title() {
    return this.document.name;
  }

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/arme-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.item.system;
    context.item = this.item;
    context.isFromCompendium = !!(this.item.pack || this.item._stats?.compendiumSource);
    context.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.description, { async: true });
    context.notesEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.notes, { async: true });
    return context;
  }

  static async #onToggleEquipe(event, target) {
    await this.item.update({ "system.equipe": !this.item.system.equipe });
  }
}
