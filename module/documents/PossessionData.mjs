/**
 * Data model for special possessions (magical artifacts, special animals, etc.).
 */
export default class PossessionData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cout: new fields.NumberField({ initial: 1, min: 1, max: 5, integer: true }),
      description: new fields.HTMLField({ initial: "" }),
      effets: new fields.HTMLField({ initial: "" })
    };
  }
}
