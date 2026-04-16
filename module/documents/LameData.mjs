/**
 * Data model for a "Lame" (PC) actor.
 * Represents a member of the Lames du Cardinal.
 */
export default class LameData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    // --- Helper: characteristic schema ---
    const characteristicField = () =>
      new fields.SchemaField({
        valeur: new fields.NumberField({ required: true, initial: 0, min: 0, max: 4, integer: true }),
        consommes: new fields.NumberField({ required: true, initial: 0, min: 0, integer: true }),
        qualificatif: new fields.StringField({ initial: "" })
      });

    // --- Helper: competence schema ---
    const competenceField = (initial = 0) =>
      new fields.SchemaField({
        valeur: new fields.NumberField({ required: true, initial, min: 0, max: 10, integer: true })
      });

    // --- Helper: lien schema ---
    const lienField = () =>
      new fields.SchemaField({
        actorId: new fields.StringField({ initial: "" }),
        nom: new fields.StringField({ initial: "" }),
        valeur: new fields.NumberField({ required: true, initial: 0, min: 0, max: 3, integer: true })
      });

    return {
      // === IDENTITE ===
      profil1: new fields.StringField({ initial: "" }),
      profil1Variation: new fields.StringField({ initial: "" }),
      profil2: new fields.StringField({ initial: "" }),
      profil2Variation: new fields.StringField({ initial: "" }),
      categorieProfil1: new fields.StringField({
        initial: "combattant",
        choices: ["combattant", "courtisan", "lettre", "roturier"]
      }),
      categorieProfil2: new fields.StringField({
        initial: "combattant",
        choices: ["combattant", "courtisan", "lettre", "roturier"]
      }),
      origine: new fields.StringField({ initial: "" }),
      race: new fields.StringField({
        initial: "humain",
        choices: ["humain", "drac", "sangmele"]
      }),
      age: new fields.NumberField({ initial: 25, min: 0, integer: true }),
      sexe: new fields.StringField({ initial: "" }),
      description: new fields.HTMLField({ initial: "" }),
      habillement: new fields.HTMLField({ initial: "" }),
      niveauDeVie: new fields.NumberField({ initial: 2, min: 0, max: 6, integer: true }),

      // === CARACTERISTIQUES ===
      caracteristiques: new fields.SchemaField({
        puissance: characteristicField(),
        vivacite: characteristicField(),
        galanterie: characteristicField(),
        finesse: characteristicField()
      }),

      // === COMPETENCES ===
      competences: new fields.SchemaField({
        // Puissance (Griffe / Noir)
        athletisme: competenceField(),
        autorite: competenceField(),
        bagarre: competenceField(),
        equitation: competenceField(),
        volonte: competenceField(),
        // Vivacité (Souffle / Noir)
        creation: competenceField(),
        debrouille: competenceField(),
        duperie: competenceField(),
        furtivite: competenceField(),
        vigilance: competenceField(),
        // Galanterie (Sang / Rouge)
        intrigue: competenceField(),
        negoce: competenceField(),
        persuasion: competenceField(),
        seduction: competenceField(),
        strategie: competenceField(),
        // Finesse (Écaille / Rouge)
        erudition: competenceField(),
        investigation: competenceField(),
        medecine: competenceField(),
        technique: competenceField(),
        tir: competenceField(),
        // Spéciales
        escrime: competenceField(),
        occultisme: competenceField()
      }),

      // Compétences inhabituelles
      competencesInhabituelles: new fields.ArrayField(
        new fields.SchemaField({
          nom: new fields.StringField({ initial: "" }),
          valeur: new fields.NumberField({ initial: 0, min: 0, max: 10, integer: true }),
          caracteristique: new fields.StringField({ initial: "puissance" })
        })
      ),

      // === VITALITE / TENACITE (Épée - 8 cases) ===
      // Chaque case: "vierge", "cochee" (ténacité), "barree" (vitalité)
      epee: new fields.ArrayField(
        new fields.StringField({
          initial: "vierge",
          choices: ["vierge", "cochee", "barree"]
        }),
        { initial: ["vierge", "vierge", "vierge", "vierge", "vierge", "vierge", "vierge", "vierge"] }
      ),

      // === ARCANES ===
      arcanesBenis: new fields.ArrayField(
        new fields.SchemaField({
          numero: new fields.NumberField({ initial: 0, min: 0, max: 21, integer: true }),
          nom: new fields.StringField({ initial: "" }),
          competenceAssociee: new fields.StringField({ initial: "" }),
          marque: new fields.StringField({ initial: "" }),
          arcaneOppose: new fields.SchemaField({
            numero: new fields.NumberField({ initial: 21, min: 0, max: 21, integer: true }),
            nom: new fields.StringField({ initial: "" })
          })
        })
      ),
      arcaneEphemere: new fields.SchemaField({
        numero: new fields.NumberField({ nullable: true, initial: null, min: 0, max: 21, integer: true }),
        nom: new fields.StringField({ initial: "" }),
        utilise: new fields.BooleanField({ initial: false })
      }),

      // === ESCRIME ===
      escrime: new fields.SchemaField({
        ecole: new fields.StringField({
          initial: "",
          blank: true,
          choices: ["germanique", "drac", "francaise", "pirate", "italienne", "suedoise", "espagnole", "anglaise", "soudard", ""]
        }),
        epee: new fields.StringField({ initial: "" })
      }),

      // === CONTACTS & RESSOURCES ===
      ressources: new fields.NumberField({ initial: 0, min: 0, max: 6, integer: true }),
      contacts: new fields.NumberField({ initial: 0, min: 0, max: 6, integer: true }),

      // === LIENS ===
      liens: new fields.ArrayField(lienField()),

      // === EXPERIENCE ===
      experience: new fields.SchemaField({
        pex: new fields.NumberField({ initial: 0, min: 0, integer: true }),
        pu: new fields.NumberField({ initial: 0, min: 0, integer: true })
      }),

      // === NOTES ===
      notes: new fields.HTMLField({ initial: "" })
    };
  }

  // --- Computed values ---

  /** Points de Ténacité disponibles = cases vierges */
  get tenacite() {
    return this.epee.filter(c => c === "vierge").length;
  }

  /** Points de Vitalité restants = 8 - cases barrées */
  get vitalite() {
    return 8 - this.epee.filter(c => c === "barree").length;
  }

  /** Le personnage est évanoui si aucune case n'est vierge */
  get evanoui() {
    return this.tenacite === 0;
  }

  /** Le personnage est mort si toutes les cases sont barrées */
  get mort() {
    return this.epee.every(c => c === "barree");
  }

  /**
   * Returns the sign and color associated with a competence.
   */
  static getCompetenceInfo(key) {
    const map = {
      // Puissance / Griffe / Noir
      athletisme: { caracteristique: "puissance", signe: "griffe", couleur: "noir" },
      autorite: { caracteristique: "puissance", signe: "griffe", couleur: "noir" },
      bagarre: { caracteristique: "puissance", signe: "griffe", couleur: "noir" },
      equitation: { caracteristique: "puissance", signe: "griffe", couleur: "noir" },
      volonte: { caracteristique: "puissance", signe: "griffe", couleur: "noir" },
      // Vivacité / Souffle / Noir
      creation: { caracteristique: "vivacite", signe: "souffle", couleur: "noir" },
      debrouille: { caracteristique: "vivacite", signe: "souffle", couleur: "noir" },
      duperie: { caracteristique: "vivacite", signe: "souffle", couleur: "noir" },
      furtivite: { caracteristique: "vivacite", signe: "souffle", couleur: "noir" },
      vigilance: { caracteristique: "vivacite", signe: "souffle", couleur: "noir" },
      // Galanterie / Sang / Rouge
      intrigue: { caracteristique: "galanterie", signe: "sang", couleur: "rouge" },
      negoce: { caracteristique: "galanterie", signe: "sang", couleur: "rouge" },
      persuasion: { caracteristique: "galanterie", signe: "sang", couleur: "rouge" },
      seduction: { caracteristique: "galanterie", signe: "sang", couleur: "rouge" },
      strategie: { caracteristique: "galanterie", signe: "sang", couleur: "rouge" },
      // Finesse / Écaille / Rouge
      erudition: { caracteristique: "finesse", signe: "ecaille", couleur: "rouge" },
      investigation: { caracteristique: "finesse", signe: "ecaille", couleur: "rouge" },
      medecine: { caracteristique: "finesse", signe: "ecaille", couleur: "rouge" },
      technique: { caracteristique: "finesse", signe: "ecaille", couleur: "rouge" },
      tir: { caracteristique: "finesse", signe: "ecaille", couleur: "rouge" },
      // Spéciales
      escrime: { caracteristique: null, signe: null, couleur: null }, // Depends on école
      occultisme: { caracteristique: null, signe: null, couleur: null }
    };
    return map[key] ?? { caracteristique: null, signe: null, couleur: null };
  }

  /**
   * Get the automatic success threshold for a competence.
   * succèsAuto = floor(valeur / 2)
   */
  getSuccesAuto(key) {
    const comp = this.competences[key];
    if (!comp) return 0;
    return Math.floor(comp.valeur / 2);
  }

  /** Prepare derived data */
  prepareDerivedData() {
    // Nothing special yet — getters handle computed values
  }
}
