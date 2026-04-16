/**
 * Data model for a "Figurant" (NPC) actor.
 * Covers all non-player characters: humans, dracs, dragons, creatures.
 */
export default class FigurantData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      // === IDENTITE ===
      profil: new fields.StringField({ initial: "" }),
      modificateur: new fields.StringField({
        initial: "normal",
        choices: ["normal", "competent", "elite"]
      }),
      typeFigurant: new fields.StringField({
        initial: "humain",
        choices: ["humain", "drac", "sangmele", "dragon", "creature"]
      }),
      description: new fields.HTMLField({ initial: "" }),

      // === COMBAT ===
      difficulte: new fields.NumberField({ initial: 1, min: 0, max: 6, integer: true }),
      potentielAttaque: new fields.NumberField({ initial: 1, min: 0, max: 20, integer: true }),
      potentielDefense: new fields.NumberField({ initial: 0, min: 0, max: 20, integer: true }),
      resistance: new fields.NumberField({ initial: 1, min: 0, max: 12, integer: true }),
      resistanceActuelle: new fields.NumberField({ initial: 1, min: 0, max: 12, integer: true }),
      arme: new fields.BooleanField({ initial: true }),
      armure: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
      armureComplete: new fields.BooleanField({ initial: false }),
      taille: new fields.NumberField({ initial: 1, min: 1, max: 6, integer: true }),
      reserve: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),

      // === MAGIE ===
      puissanceMagique: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),

      // === INTERACTIONS ===
      volonte: new fields.NumberField({ initial: 0, min: 0, max: 8, integer: true }),

      // === COMPETENCES (optionnel, pour figurants importants) ===
      competences: new fields.SchemaField({
        athletisme: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        autorite: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        bagarre: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        equitation: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        volonte: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        creation: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        debrouille: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        duperie: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        furtivite: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        vigilance: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        intrigue: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        negoce: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        persuasion: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        seduction: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        strategie: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        erudition: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        investigation: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        medecine: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        technique: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        tir: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        escrime: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
        occultisme: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true })
      }),

      // === ESCRIME FIGURANT ===
      ecole: new fields.StringField({ initial: "" }),

      // === NOTES ===
      notes: new fields.HTMLField({ initial: "" }),

      // === COMBAT TRACKER (utilisé pendant les combats) ===
      combatTracker: new fields.SchemaField({
        attaquesUtilisees: new fields.NumberField({ initial: 0, min: 0, integer: true }),
        defensesUtilisees: new fields.NumberField({ initial: 0, min: 0, integer: true })
      })
    };
  }

  /** Potentiel total */
  get potentielTotal() {
    return this.potentielAttaque + this.potentielDefense;
  }

  /** Résumé de combat: A/D R */
  get resumeCombat() {
    return `A${this.potentielAttaque} D${this.potentielDefense} R${this.resistance}`;
  }

  /** Le figurant est hors combat */
  get horsComba() {
    return this.resistanceActuelle <= 0;
  }

  prepareDerivedData() {
    // Sync resistanceActuelle if it exceeds max
    if (this.resistanceActuelle > this.resistance) {
      this.resistanceActuelle = this.resistance;
    }
  }
}
