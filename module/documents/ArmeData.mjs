/**
 * Data model for weapon items (swords, ranged weapons, explosives).
 */
export default class ArmeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      categorie: new fields.StringField({
        initial: "melee",
        choices: ["melee", "distance", "explosif"]
      }),
      sousType: new fields.StringField({ initial: "" }), // ex: "Rapière", "Pistolet à rouet"
      description: new fields.HTMLField({ initial: "" }),
      equipe: new fields.BooleanField({ initial: false }),
      degats: new fields.NumberField({ initial: 2, min: 0, integer: true }),
      // Portées (pour armes à distance)
      portees: new fields.SchemaField({
        boutPortant: new fields.StringField({ initial: "" }),
        courte: new fields.StringField({ initial: "" }),
        moyenne: new fields.StringField({ initial: "" }),
        longue: new fields.StringField({ initial: "" })
      }),
      notes: new fields.HTMLField({ initial: "" })
    };
  }
}
