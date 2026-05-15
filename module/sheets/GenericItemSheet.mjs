import { LamesItemSheet } from "./base.mjs";
import { enrich } from "../helpers/enrich.mjs";

/**
 * Generic item sheet for armure, feinte, botte, possession, equipement — ApplicationV2.
 */
export default class GenericItemSheet extends LamesItemSheet {

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

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/generic-item-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    if (this.item.system.effets) {
      context.effetsEnriched = await enrich(this.item.system.effets);
    }
    return context;
  }

  static async #onToggleBoolean(event, target) {
    const field = target.dataset.field;
    const current = foundry.utils.getProperty(this.item, field);
    await this.item.update({ [field]: !current });
  }
}
