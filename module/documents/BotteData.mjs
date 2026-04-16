/**
 * Data model for Botte items (special fencing strikes requiring figures).
 */
export default class BotteData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      ecole: new fields.StringField({ initial: "" }),
      figuresRequises: new fields.NumberField({ initial: 2, min: 2, max: 4, integer: true }),
      description: new fields.HTMLField({ initial: "" }),
      cout: new fields.NumberField({ initial: 1, min: 1, max: 1, integer: true })
    };
  }
}
