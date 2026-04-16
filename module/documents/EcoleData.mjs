/**
 * Data model for École d'escrime items.
 */
export default class EcoleData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      cle: new fields.StringField({ initial: "" }),
      caracteristique: new fields.StringField({
        initial: "puissance",
        choices: ["puissance", "vivacite", "galanterie", "finesse"]
      }),
      signe: new fields.StringField({
        initial: "griffe",
        choices: ["griffe", "souffle", "sang", "ecaille"]
      }),
      competence: new fields.StringField({ initial: "escrime" }),
      description: new fields.HTMLField({ initial: "" }),
      feintes: new fields.ArrayField(new fields.SchemaField({
        nom: new fields.StringField({ initial: "" }),
        description: new fields.HTMLField({ initial: "" }),
        signature: new fields.BooleanField({ initial: false })
      })),
      bottes: new fields.ArrayField(new fields.SchemaField({
        nom: new fields.StringField({ initial: "" }),
        figuresRequises: new fields.NumberField({ initial: 2, min: 2, max: 4, integer: true }),
        description: new fields.HTMLField({ initial: "" })
      }))
    };
  }
}
