/**
 * Data model for Arcane items (the 22 arcanes of the Tarot des Ombres).
 */
export default class ArcaneData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      numero: new fields.NumberField({ required: true, initial: 0, min: 0, max: 21, integer: true }),
      valeurDraconique: new fields.StringField({ initial: "" }),
      meteorologie: new fields.StringField({ initial: "" }),
      competenceAssociee: new fields.StringField({ initial: "" }),
      marque: new fields.StringField({ initial: "" }),
      descriptionMarque: new fields.HTMLField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      arcaneOppose: new fields.NumberField({ initial: 21, min: 0, max: 21, integer: true })
    };
  }

  /** Get the opposed arcane number (sum = 21) */
  get arcaneOpposeCalcule() {
    return 21 - this.numero;
  }
}
