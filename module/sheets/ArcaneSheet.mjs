import { LAMES } from "../helpers/config.mjs";
import { LamesItemSheet } from "./base.mjs";
import { enrich } from "../helpers/enrich.mjs";

/**
 * Item sheet for arcanes — ApplicationV2.
 */
export default class ArcaneSheet extends LamesItemSheet {

  static DEFAULT_OPTIONS = {
    tag: "form",
    classes: ["lames-du-cardinal", "sheet", "item", "arcane"],
    position: { width: 520, height: 560 },
    window: {
      resizable: true,
      icon: "fa-solid fa-star"
    },
    form: {
      submitOnChange: true,
      closeOnSubmit: false
    }
  };

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/item/arcane-sheet.hbs" }
  };

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.arcanesChoices = LAMES.arcanes;

    // Arcane opposé calculé
    const oppNum = 21 - (this.item.system.numero ?? 0);
    const opp = LAMES.arcanes.find(a => a.numero === oppNum);
    context.arcaneOpposeNumero = oppNum;
    context.arcaneOpposeNom = opp?.nom ?? "?";

    context.descriptionMarqueEnriched = await enrich(this.item.system.descriptionMarque);
    return context;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const select = this.element.querySelector(".arcane-numero-select");
    if (select) {
      select.addEventListener("change", async (event) => {
        event.preventDefault();
        event.stopPropagation();
        const numero = Number(select.value);
        const arc = LAMES.arcanes.find(a => a.numero === numero) ?? LAMES.arcanes[0];

        await this.item.update({
          "name": arc.nom,
          "system.numero": arc.numero,
          "system.valeurDraconique": arc.vd,
          "system.competenceAssociee": arc.comp,
          "system.marque": arc.marque,
          "system.arcaneOppose": 21 - arc.numero
        });
      });
    }
  }
}
