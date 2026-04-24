const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Item sheet for profiles — ApplicationV2.
 */
export default class ProfilSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "item", "profil"],
    position: { width: 520, height: 600 },
    window: {
      resizable: true,
      icon: "fa-solid fa-id-badge"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  get title() {
    return this.document.name;
  }

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/profil-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.item.system;
    context.item = this.item;
    context.isFromCompendium = !!(this.item.pack || this.item._stats?.compendiumSource);
    context.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.item.system.description, { async: true });
    return context;
  }
}
