/**
 * System configuration constants for Les Lames du Cardinal.
 */
export const LAMES = {};

LAMES.id = "lames-du-cardinal";

/**
 * The four characteristics and their associated signs/colors.
 */
LAMES.caracteristiques = {
  puissance: { signe: "griffe", couleur: "noir", label: "LAMES.Caracteristiques.puissance" },
  vivacite: { signe: "souffle", couleur: "noir", label: "LAMES.Caracteristiques.vivacite" },
  galanterie: { signe: "sang", couleur: "rouge", label: "LAMES.Caracteristiques.galanterie" },
  finesse: { signe: "ecaille", couleur: "rouge", label: "LAMES.Caracteristiques.finesse" }
};

/**
 * Competences grouped by characteristic.
 */
LAMES.competences = {
  puissance: ["athletisme", "autorite", "bagarre", "equitation", "volonte"],
  vivacite: ["creation", "debrouille", "duperie", "furtivite", "vigilance"],
  galanterie: ["intrigue", "negoce", "persuasion", "seduction", "strategie"],
  finesse: ["erudition", "investigation", "medecine", "technique", "tir"]
};

/**
 * All competences flat with their characteristic mapping.
 */
LAMES.competenceMap = {};
for (const [carac, comps] of Object.entries(LAMES.competences)) {
  for (const comp of comps) {
    LAMES.competenceMap[comp] = {
      caracteristique: carac,
      signe: LAMES.caracteristiques[carac].signe,
      couleur: LAMES.caracteristiques[carac].couleur,
      label: `LAMES.Competences.${comp}`
    };
  }
}
// Special competences
LAMES.competenceMap.escrime = { caracteristique: null, signe: null, couleur: null, label: "LAMES.Competences.escrime" };
LAMES.competenceMap.occultisme = { caracteristique: null, signe: null, couleur: null, label: "LAMES.Competences.occultisme" };

/**
 * Fencing schools and their associated characteristic/sign.
 */
LAMES.ecoles = {
  germanique: { caracteristique: "puissance", signe: "griffe", label: "LAMES.Escrime.germanique" },
  drac: { caracteristique: "puissance", signe: "griffe", label: "LAMES.Escrime.drac" },
  francaise: { caracteristique: "vivacite", signe: "souffle", label: "LAMES.Escrime.francaise" },
  pirate: { caracteristique: "vivacite", signe: "souffle", label: "LAMES.Escrime.pirate" },
  italienne: { caracteristique: "galanterie", signe: "sang", label: "LAMES.Escrime.italienne" },
  suedoise: { caracteristique: "galanterie", signe: "sang", label: "LAMES.Escrime.suedoise" },
  espagnole: { caracteristique: "finesse", signe: "ecaille", label: "LAMES.Escrime.espagnole" },
  anglaise: { caracteristique: "finesse", signe: "ecaille", label: "LAMES.Escrime.anglaise" },
  soudard: { caracteristique: "puissance", signe: "griffe", label: "LAMES.Escrime.soudard", competence: "bagarre" }
};

/**
 * The four signs of the Tarot.
 */
LAMES.signes = {
  griffe: { couleur: "noir", label: "LAMES.Signes.griffe", icon: "systems/lames-du-cardinal/assets/signes/griffe.svg" },
  souffle: { couleur: "noir", label: "LAMES.Signes.souffle", icon: "systems/lames-du-cardinal/assets/signes/souffle.svg" },
  sang: { couleur: "rouge", label: "LAMES.Signes.sang", icon: "systems/lames-du-cardinal/assets/signes/sang.svg" },
  ecaille: { couleur: "rouge", label: "LAMES.Signes.ecaille", icon: "systems/lames-du-cardinal/assets/signes/ecaille.svg" }
};

/**
 * Difficulty scale.
 */
LAMES.difficultes = {
  1: "Moyenne",
  2: "Difficile",
  3: "Très difficile",
  4: "Extrêmement difficile",
  5: "Insensée",
  6: "Chimérique"
};

/**
 * Opposition scale for figurants.
 */
LAMES.oppositions = {
  1: "Piètre antagoniste",
  2: "Opposant qualifié",
  3: "Adversaire de premier ordre",
  4: "Maître en son art",
  5: "Ennemi emblématique",
  6: "Grand maître / Monstre de légende"
};

/**
 * Resistance scale.
 */
LAMES.resistances = {
  1: "Vilain / Fragile",
  3: "Déterminé / Solide",
  5: "Coriace / Résistant",
  7: "Inflexible / Minéral",
  9: "Dragon réveillé",
  12: "Archéen mécontent"
};

/**
 * Distances in combat.
 */
LAMES.distances = ["contact", "proche", "moyenne", "eloignee", "tresEloignee"];

/**
 * The 22 arcanes, with key information.
 */
LAMES.arcanes = [
  { numero: 0, nom: "L'Astrologue en Prière", vd: "Fatalité", meteo: "Recrudescence des peurs superstitieuses", comp: "occultisme", marque: "Mystique",
    md: "Croyant, le personnage est persuadé que des forces supérieures gouvernent la destinée. Il se montre volontiers Mystique, superstitieux, et peut se trouver en difficulté lorsqu'il est confronté au surnaturel. Il cherche en permanence les signes qui le renseignent sur le futur." },
  { numero: 1, nom: "La Tisserande oubliée", vd: "Sacrifice", meteo: "Mouches et vermine", comp: "medecine", marque: "Dévoué",
    md: "Le personnage est Dévoué et consacre une grande part de son temps à s'occuper des autres, quitte à sacrifier son propre bien-être. Au sein du groupe, il est celui qui fait face au danger pour ses compagnons, sans rien attendre en retour." },
  { numero: 2, nom: "Le Voleur sans Mémoire", vd: "Avidité", meteo: "Ambiance de pénurie, de crise, de famine", comp: "negoce", marque: "Avide",
    md: "Le personnage est constamment Insatiable. Il est obsédé par les accomplissements futurs, et peine à se souvenir de ses exploits passés. Il ressasse parfois ses échecs, qui restent vivaces dans son esprit." },
  { numero: 3, nom: "Le Jongleur indécis", vd: "Audace", meteo: "Ambiance d'anarchie, mépris des règles", comp: "strategie", marque: "Imprévisible",
    md: "Le personnage est Imprévisible, ivre de liberté. Quand il se conforme aux règles et aux usages, on s'attend à ce qu'il les transgresse. Dans une société très hiérarchisée, son comportement de trublion lui cause bien des soucis." },
  { numero: 4, nom: "La Danseuse à l'Épée", vd: "Honneur", meteo: "Températures extrêmes", comp: "athletisme", marque: "Honorable",
    md: "Le personnage est Honorable et suit un strict code de conduite. Il peine à recourir à ce qu'il considère comme des vilénies. Son respect des règles, sa rigidité sont parfois un frein aux initiatives hardies." },
  { numero: 5, nom: "La Sentinelle silencieuse", vd: "Protection", meteo: "Vent sifflant, atmosphère bruyante", comp: "vigilance", marque: "Anxieux",
    md: "Le personnage est Anxieux. Il se sent constamment épié, en danger, et ne relâche que rarement son attention. Il ne fait que peu confiance à autrui et peine à interagir, ayant la sensation que chaque mot qu'il prononce peut se retourner contre lui." },
  { numero: 6, nom: "L'Enlumineur aveugle", vd: "Impulsivité", meteo: "Agressivité générale, comportements belliqueux", comp: "bagarre", marque: "Impulsif",
    md: "Le personnage est Impulsif, et tend à manquer de subtilité et de discernement. Il agit sans prendre en compte tous les paramètres, avec une spontanéité que d'aucuns qualifient d'animale. Il se laisse souvent aller à des instincts primaires." },
  { numero: 7, nom: "Le Maître d'armes aux Flambeaux", vd: "Maîtrise", meteo: "Luminosité défavorable, reflets aveuglants, ombres mesquines", comp: "escrime", marque: "Remarquable",
    md: "Le personnage est Remarquable. Il peine à passer inaperçu, par sa réputation ou son comportement social démonstratif, même quand il cherche à rester dans l'ombre." },
  { numero: 8, nom: "La Vestale de Pierre", vd: "Foi", meteo: "Morosité généralisée", comp: "volonte", marque: "Froid",
    md: "Le personnage est Froid et distant. Si rien ne semble l'atteindre, il peine à s'impliquer dans des relations intimes et dans des relations de groupes." },
  { numero: 9, nom: "Le Pèlerin immobile", vd: "Fermeté", meteo: "Vents tourbillonnants", comp: "tir", marque: "Terre à terre",
    md: "Le personnage est Terre à terre et attaché à ses routines. Son humour peut être limité. Il peine à accepter des fonctionnements différents du sien et reste souvent campé sur ses positions, surtout quand il est confronté à des idées faisant la part belle à l'imagination." },
  { numero: 10, nom: "L'Hérésiarque couronné", vd: "Autorité", meteo: "Émeutes, indiscipline", comp: "autorite", marque: "Sollicité",
    md: "Le personnage dégage une aura ou possède une solide réputation, une charge ou simplement une nature de bon samaritain. De fait, il est régulièrement Sollicité, et tend à être considéré comme une ressource par beaucoup trop de monde, y compris des inconnus." },
  { numero: 11, nom: "Le Gentilhomme au Corbeau", vd: "Modification", meteo: "Secousses sismiques", comp: "technique", marque: "Triste sire",
    md: "Le personnage est considéré comme un Triste sire, ce que l'on goûte peu en société, même si lui-même peut souhaiter être ainsi appelé. Il traîne souvent une réputation peu flatteuse, qui n'est pas forcément méritée. Il peine à prendre la tête d'un groupe." },
  { numero: 12, nom: "L'Architecte des Mondes", vd: "Innovation", meteo: "Vague de désespoir, dépression", comp: "creation", marque: "Rêveur",
    md: "Le personnage est Rêveur, et peine parfois à se confronter à la réalité du monde. Créatif en diable, il peut facilement sembler farfelu. La recherche du beau reste pour lui plus importante que celle de l'efficace. Il peut aller jusqu'à vivre dans un monde fantasmé, et tendre à se couper régulièrement de la réalité." },
  { numero: 13, nom: "La Courtisane amoureuse", vd: "Sensualité", meteo: "Climat de discorde, mésententes entre les sexes", comp: "seduction", marque: "Sensible",
    md: "Le personnage est une âme Sensible, qui ressent avec une intensité excessive les sentiments et les souffrances. Cela le rend vulnérable face au charme et à la cruauté, et génère parfois de sombres pensées." },
  { numero: 14, nom: "L'Assassin sans Visage", vd: "Subtilité", meteo: "Clarté stellaire, pleine lune ou soleil éclatant", comp: "furtivite", marque: "Anonyme",
    md: "Le personnage est obsédé par sa fonction, et peine à exister en tant qu'être humain. Sa personnalité est bien souvent plate. Il se limite à ce qu'il fait, plutôt qu'à ce qu'il est. Il est un Anonyme appliqué à sa tâche." },
  { numero: 15, nom: "L'Horloger des Chimères", vd: "Diplomatie", meteo: "Climat d'intolérance ou d'ivrognerie", comp: "intrigue", marque: "Compliqué",
    md: "Le personnage est Compliqué, voire incompréhensible dans ses raisonnements. Il peine à faire les choses avec simplicité et échafaude des plans complexes pour résoudre des épreuves qui ne nécessiteraient que des réponses élémentaires." },
  { numero: 16, nom: "La Gardienne derrière le Miroir", vd: "Confrontation", meteo: "Climat d'opposition, disputes", comp: "persuasion", marque: "Présomptueux",
    md: "Le personnage est Présomptueux, souvent inutilement opiniâtre, voire simpliste, persuadé de détenir la vérité envers et contre tous. Il tâche de convaincre tout le monde tout en restant la plupart du temps sourd aux arguments contraires." },
  { numero: 17, nom: "La Magicienne sous le Voile", vd: "Ruse", meteo: "Méfiance générale", comp: "duperie", marque: "Trompeur",
    md: "Le personnage est un Trompeur et un tricheur-né, qui peine à se montrer franc, y compris avec ses proches. Il passe pour quelqu'un de peu fiable, dont la loyauté est fluctuante." },
  { numero: 18, nom: "La Demoiselle en la Tour", vd: "Ambition", meteo: "Désordre", comp: "investigation", marque: "Discipliné",
    md: "Le personnage est Discipliné, respectueux des codes et des traditions. Il peine à transgresser les lois et les interdits. Il a un sens aigu de la hiérarchie et de la justice et évite d'aller à leur encontre. Toutes ses actions sont réfléchies, méthodiques à l'envi." },
  { numero: 19, nom: "L'Alchimiste des Ombres", vd: "Connaissance", meteo: "Doutes, difficultés de concentration", comp: "erudition", marque: "Hanté",
    md: "Le personnage est Hanté par son passé et ne parvient pas à oublier ses erreurs. Cela peut engendrer un état dépressif, voire amener une forme de démence qui voit des victimes de ses fautes revenir le tourmenter en prenant des formes fantasmatiques." },
  { numero: 20, nom: "Le Guerrier immortel", vd: "Héroïsme", meteo: "Climat de méfiance et d'hostilité", comp: "debrouille", marque: "Téméraire",
    md: "Le personnage est profondément Téméraire. Il a tendance à tirer la couverture à lui et à prendre des risques inconsidérés pour asseoir sa propre légende. Il veut, plus que tout, marquer le monde de son passage." },
  { numero: 21, nom: "Le Chevalier au Dragon", vd: "Domination", meteo: "Orages violents", comp: "equitation", marque: "Intolérant",
    md: "Le personnage est Intolérant, en particulier envers tout ce qui touche au mysticisme. Son opposition aux dragons est absolue, proche de l'obsession, et il ne manque pas une occasion de les dominer ou les humilier. Mais son rapport aux religions et croyances humaines est également très compliqué." }
];

/**
 * Tarot des Ombres — 78 cards.
 * 56 "Lames" (4 suits × 14 cards) + 22 Arcanes.
 * Suits: griffe (noir), souffle (noir), sang (rouge), ecaille (rouge).
 * Values: 1-10, cavalier (C=11), vyverne (V=12), dame (D=13), roi (R=14).
 */
LAMES.tarot = {};

LAMES.tarot.figures = {
  1: { label: "1", valeur: 1 },
  2: { label: "2", valeur: 2 },
  3: { label: "3", valeur: 3 },
  4: { label: "4", valeur: 4 },
  5: { label: "5", valeur: 5 },
  6: { label: "6", valeur: 6 },
  7: { label: "7", valeur: 7 },
  8: { label: "8", valeur: 8 },
  9: { label: "9", valeur: 9 },
  10: { label: "10", valeur: 10 },
  11: { label: "C", valeur: 11, nom: "Cavalier" },
  12: { label: "V", valeur: 12, nom: "Vyverne" },
  13: { label: "D", valeur: 13, nom: "Dame" },
  14: { label: "R", valeur: 14, nom: "Roi" }
};

LAMES.tarot.figureFileMap = {
  1: "01", 2: "02", 3: "03", 4: "04", 5: "05", 6: "06", 7: "07",
  8: "08", 9: "09", 10: "10", 11: "cavalier", 12: "vyverne", 13: "dame", 14: "roi"
};

LAMES.tarot.suits = ["griffe", "souffle", "sang", "ecaille"];

/** Build the full 78-card deck definition. */
LAMES.tarot.buildDeck = function () {
  const cards = [];
  const basePath = "systems/lames-du-cardinal/assets/tarot";
  // 56 Lames (suit cards)
  for (const signe of LAMES.tarot.suits) {
    for (let v = 1; v <= 14; v++) {
      const fig = LAMES.tarot.figures[v];
      const fileVal = LAMES.tarot.figureFileMap[v];
      cards.push({
        id: `${signe}-${fileVal}`,
        type: "lame",
        signe,
        couleur: LAMES.signes[signe].couleur,
        valeur: v,
        label: fig.nom ? `${fig.nom} de ${signe}` : `${v} de ${signe}`,
        img: `${basePath}/${signe}-${fileVal}.webp`
      });
    }
  }
  // 22 Arcanes
  for (const arc of LAMES.arcanes) {
    const num = String(arc.numero).padStart(2, "0");
    cards.push({
      id: `arcane-${num}`,
      type: "arcane",
      signe: null,
      couleur: null,
      valeur: arc.numero,
      label: `${arc.numero} — ${arc.nom}`,
      img: `${basePath}/arcane-${num}.webp`
    });
  }
  return cards;
};

LAMES.tarot.dos = "systems/lames-du-cardinal/assets/tarot/dos.webp";

/** Lookup arcane info by number (0-21). */
LAMES.arcaneParNumero = new Map(LAMES.arcanes.map(a => [a.numero, a]));

/**
 * Wealth scale.
 */
LAMES.niveauxDeVie = {
  0: "Miséreux",
  1: "Très pauvre",
  2: "Modeste",
  3: "Correct",
  4: "Aisé",
  5: "Riche",
  6: "Très riche"
};
