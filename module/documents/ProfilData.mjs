/**
 * Data model for Profil items (the 22 character profiles).
 */
export default class ProfilData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const compField = () => new fields.NumberField({ initial: 0, min: 0, max: 6, integer: true });

    return {
      variations: new fields.ArrayField(new fields.StringField({ initial: "" })),
      categorie: new fields.StringField({
        initial: "combattant",
        choices: ["combattant", "courtisan", "lettre", "roturier"]
      }),
      description: new fields.HTMLField({ initial: "" }),
      niveauDeVieMin: new fields.NumberField({ initial: 0, min: 0, max: 6, integer: true }),
      niveauDeVieMax: new fields.NumberField({ initial: 4, min: 0, max: 6, integer: true }),
      competences: new fields.SchemaField({
        athletisme: compField(),
        autorite: compField(),
        bagarre: compField(),
        equitation: compField(),
        volonte: compField(),
        creation: compField(),
        debrouille: compField(),
        duperie: compField(),
        furtivite: compField(),
        vigilance: compField(),
        intrigue: compField(),
        negoce: compField(),
        persuasion: compField(),
        seduction: compField(),
        strategie: compField(),
        erudition: compField(),
        investigation: compField(),
        medecine: compField(),
        technique: compField(),
        tir: compField(),
        escrime: compField(),
        occultisme: compField()
      })
    };
  }
}
