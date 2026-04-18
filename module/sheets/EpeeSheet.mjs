const { ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Item sheet for Épées — ApplicationV2.
 */
export default class EpeeSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "item", "epee"],
    position: { width: 620, height: 680 },
    window: {
      resizable: true,
      icon: "fa-solid fa-khanda"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/epee-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.system = this.item.system;
    context.item = this.item;
    context.isFromCompendium = !!(this.item.pack || this.item._stats?.compendiumSource);
    context.descriptionEnriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item.system.description ?? "", { async: true }
    );
    context.capacitesEnriched = [];
    for (const c of this.item.system.capacites ?? []) {
      context.capacitesEnriched.push({
        ...c,
        descriptionEnriched: await foundry.applications.ux.TextEditor.implementation.enrichHTML(c.description ?? "", { async: true })
      });
    }
    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);
    // Cacher l'image si elle ne charge pas (fichier absent)
    const img = this.element.querySelector(".epee-sword-img");
    if (img) {
      const hide = () => { img.style.display = "none"; };
      img.addEventListener("error", hide);
      // Cas où l'image a déjà échoué avant l'attach du listener
      if (img.complete && img.naturalWidth === 0) hide();
    }
  }
}
