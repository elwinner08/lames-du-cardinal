/**
 * Data model for Épée items.
 * Chaque épée a une description et exactement 2 capacités (nom + description).
 */
export default class EpeeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cle: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      capacites: new fields.ArrayField(new fields.SchemaField({
        nom: new fields.StringField({ initial: "" }),
        description: new fields.HTMLField({ initial: "" })
      }))
    };
  }
}
