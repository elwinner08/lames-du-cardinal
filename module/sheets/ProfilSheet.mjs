import { LamesItemSheet } from "./base.mjs";

/**
 * Item sheet for profiles — ApplicationV2.
 */
export default class ProfilSheet extends LamesItemSheet {

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

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/profil-sheet.hbs" }
  };
}
