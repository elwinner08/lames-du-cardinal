/**
 * Data model for generic equipment items.
 */
export default class EquipementData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.HTMLField({ initial: "" }),
      quantite: new fields.NumberField({ initial: 1, min: 0, integer: true }),
      prix: new fields.StringField({ initial: "" })
    };
  }
}
