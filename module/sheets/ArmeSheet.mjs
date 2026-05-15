import { LamesItemSheet } from "./base.mjs";
import { enrich } from "../helpers/enrich.mjs";

/**
 * Item sheet for weapons (arme) — ApplicationV2.
 */
export default class ArmeSheet extends LamesItemSheet {

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

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/arme-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.notesEnriched = await enrich(this.item.system.notes);
    return context;
  }

  static async #onToggleEquipe(event, target) {
    await this.item.update({ "system.equipe": !this.item.system.equipe });
  }
}
