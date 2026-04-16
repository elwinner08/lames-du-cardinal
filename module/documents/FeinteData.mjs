/**
 * Data model for Feinte items (fencing techniques from schools or swords).
 */
export default class FeinteData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      source: new fields.StringField({
        initial: "ecole",
        choices: ["ecole", "epee"]
      }),
      ecole: new fields.StringField({ initial: "" }),
      epee: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      cout: new fields.NumberField({ initial: 1, min: 1, max: 1, integer: true })
    };
  }
}
