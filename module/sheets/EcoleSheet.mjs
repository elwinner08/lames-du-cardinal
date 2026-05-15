import { LamesItemSheet } from "./base.mjs";
import { enrich } from "../helpers/enrich.mjs";

/**
 * Item sheet for Écoles d'escrime — ApplicationV2.
 */
export default class EcoleSheet extends LamesItemSheet {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "item", "ecole"],
    position: { width: 600, height: 700 },
    window: {
      resizable: true,
      icon: "fa-solid fa-shield-halved"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/ecole-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    // Enrich feinte and botte descriptions
    context.feintesEnriched = [];
    for (const f of this.item.system.feintes) {
      context.feintesEnriched.push({ ...f, descriptionEnriched: await enrich(f.description) });
    }
    context.bottesEnriched = [];
    for (const b of this.item.system.bottes) {
      context.bottesEnriched.push({ ...b, descriptionEnriched: await enrich(b.description) });
    }
    return context;
  }
}
