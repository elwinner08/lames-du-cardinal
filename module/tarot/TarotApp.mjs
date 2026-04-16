/**
 * TarotApp — ApplicationV2 window for the Tarot des Ombres.
 *
 * Shows:
 *  - Paquet des Lames: pioche count, defausse count, reshuffle button
 *  - Paquet des Arcanes: pioche count, defausse count, reshuffle button
 *  - Rivière draconique: displayed arcane cards
 *  - Buttons: Piocher (Lame), Piocher (Arcane), Test éclair, Test dramatique
 */

import TarotManager from "./TarotManager.mjs";
import { LAMES } from "../helpers/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class TarotApp extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "tarot-des-ombres",
    classes: ["lames-du-cardinal", "tarot-app"],
    tag: "div",
    window: {
      title: "LAMES.Tarot.titre",
      icon: "fa-solid fa-cards",
      resizable: true
    },
    position: {
      width: 720,
      height: 600
    },
    actions: {
      piocherLame: TarotApp.#onPiocherLame,
      piocherArcane: TarotApp.#onPiocherArcane,
      remelangeLames: TarotApp.#onRemelangeLames,
      rappelerToutesLames: TarotApp.#onRappelerToutesLames,
      remelangeArcanes: TarotApp.#onRemelangeArcanes,
      ajouterRiviere: TarotApp.#onAjouterRiviere,
      retirerRiviere: TarotApp.#onRetirerRiviere,
      resetAll: TarotApp.#onResetAll,
      testEclair: TarotApp.#onTestEclair,
      testDramatique: TarotApp.#onTestDramatique,
      jouerCarte: TarotApp.#onJouerCarte,
      defausserCarte: TarotApp.#onDefausserCarte
    }
  };

  static PARTS = {
    tarot: {
      template: "systems/lames-du-cardinal/templates/tarot/tarot-app.hbs"
    }
  };

  /** @type {TarotApp|null} Singleton */
  static _instance = null;

  static toggle() {
    console.log("Lames du Cardinal | TarotApp.toggle() appelé");
    try {
      if (TarotApp._instance?.rendered) {
        TarotApp._instance.close();
      } else {
        if (!TarotApp._instance) TarotApp._instance = new TarotApp();
        TarotApp._instance.render({ force: true });
      }
    } catch (err) {
      console.error("Lames du Cardinal | Erreur TarotApp.toggle():", err);
    }
  }

  /**
   * Run a test from outside (e.g. from LameSheet compRoll).
   * @param {string} compKey — competence key (standard, not "occultisme:signe")
   * @param {string} type — "eclair" or "dramatique"
   * @param {number} difficulte
   * @param {Actor} actor
   */
  static async runTest(compKey, type, difficulte, actor) {
    const { signeCible, couleurCible, compVal, compLabel, signLabel } =
      TarotApp._resolveCompetence(compKey, actor);

    const riviereWarning = TarotApp._checkRiviereCompetence(compKey);
    const beniBonus = TarotApp._checkArcaneBeni(actor, compKey);
    const ephBonus = await TarotApp._checkArcaneEphemere(actor, compKey);
    const combinedBonus = {
      bonus: beniBonus.bonus + ephBonus.bonus,
      html: beniBonus.html + ephBonus.html
    };

    if (type === "eclair") {
      await TarotApp._executeTestEclair(actor, compKey, signeCible, couleurCible, compVal, compLabel, signLabel, difficulte, riviereWarning, combinedBonus);
    } else {
      await TarotApp._executeTestDramatique(actor, compKey, signeCible, couleurCible, compVal, compLabel, signLabel, difficulte, riviereWarning, combinedBonus);
    }
  }

  /* -------------------------------------------------- */
  /*  Hooks for auto-refresh                            */
  /* -------------------------------------------------- */

  constructor(options = {}) {
    super(options);
    this._onTarotChanged = () => {
      if (this.rendered) this.render();
    };
    Hooks.on("lames.tarotChanged", this._onTarotChanged);
  }

  async close(options) {
    Hooks.off("lames.tarotChanged", this._onTarotChanged);
    return super.close(options);
  }

  /* -------------------------------------------------- */
  /*  Data Preparation                                  */
  /* -------------------------------------------------- */

  async _prepareContext(options) {
    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state) return {};

    // Map rivière card ids to card objects enriched with arcane details
    const riviere = state.riviere.map(id => {
      const card = mgr.getCard(id);
      if (!card) return null;
      const info = LAMES.arcaneParNumero.get(card.valeur);
      return {
        ...card,
        nom: info?.nom ?? "",
        vd: info?.vd ?? "",
        meteo: info?.meteo ?? "",
        comp: info?.comp ? game.i18n.localize(`LAMES.Competences.${info.comp}`) : "",
        compKey: info?.comp ?? "",
        marque: info?.marque ?? ""
      };
    }).filter(Boolean);

    // Current user's hand
    const main = mgr.getMain(game.user.id);

    return {
      isGM: game.user.isGM,
      lames: {
        piocheCount: state.lames.pioche.length,
        defausseCount: state.lames.defausse.length,
        total: state.lames.pioche.length + state.lames.defausse.length
      },
      arcanes: {
        piocheCount: state.arcanes.pioche.length,
        defausseCount: state.arcanes.defausse.length,
        total: state.arcanes.pioche.length + state.arcanes.defausse.length
      },
      riviere,
      main,
      mainCount: main.length,
      dos: LAMES.tarot.dos
    };
  }

  /* -------------------------------------------------- */
  /*  Action Handlers                                   */
  /* -------------------------------------------------- */

  static async #onPiocherLame(event, target) {
    const mgr = TarotManager.getInstance();
    const cards = await mgr.piocherLameEnMain(game.user.id, 1);
    if (!cards.length) return;
    ui.notifications.info(`Carte piochée : ${cards[0].label}`);
  }

  static async #onPiocherArcane(event, target) {
    const mgr = TarotManager.getInstance();
    const cards = await mgr.piocherArcaneEnMain(game.user.id, 1);
    if (!cards.length) return;
    ui.notifications.info(`Arcane piochée : ${cards[0].label}`);
  }

  static async #onRemelangeLames(event, target) {
    if (!game.user.isGM) return;
    const mgr = TarotManager.getInstance();
    await mgr.remelangeLames();
    ui.notifications.info("Défausse des Lames remélangée dans la pioche.");
  }

  static async #onRappelerToutesLames(event, target) {
    if (!game.user.isGM) return;
    const confirm = await Dialog.wait({
      title: game.i18n.localize("LAMES.Tarot.melangerToutes"),
      content: "<p>Rappeler toutes les cartes Lames (mains des joueurs + défausse) et remélanger le paquet complet ?</p>",
      buttons: {
        oui: { label: "Oui", icon: '<i class="fas fa-check"></i>', callback: () => true },
        non: { label: "Non", icon: '<i class="fas fa-times"></i>', callback: () => false }
      },
      default: "oui",
      close: () => false
    });
    if (!confirm) return;
    const mgr = TarotManager.getInstance();
    await mgr.rappelerToutesLames();
    ui.notifications.info("Toutes les Lames ont été rappelées et le paquet remélangé.");
  }

  static async #onRemelangeArcanes(event, target) {
    if (!game.user.isGM) return;
    const mgr = TarotManager.getInstance();
    await mgr.remelangeArcanes();
    ui.notifications.info("Paquet des Arcanes remélangé.");
  }

  static async #onAjouterRiviere(event, target) {
    if (!game.user.isGM) return;
    const mgr = TarotManager.getInstance();
    const cards = await mgr.piocherArcanes(1);
    if (!cards.length) return;
    await mgr.ajouterRiviere(cards[0].id);
  }

  static async #onRetirerRiviere(event, target) {
    if (!game.user.isGM) return;
    const cardId = target.dataset.cardId;
    if (!cardId) return;
    const mgr = TarotManager.getInstance();
    await mgr.retirerRiviere(cardId);
  }

  static async #onResetAll(event, target) {
    if (!game.user.isGM) return;
    const confirm = await Dialog.wait({
      title: "Réinitialiser le Tarot",
      content: "<p>Remélanger l'intégralité du Tarot des Ombres (Lames + Arcanes + Rivière) ?</p>",
      buttons: {
        oui: { label: "Oui", icon: '<i class="fas fa-check"></i>', callback: () => true },
        non: { label: "Non", icon: '<i class="fas fa-times"></i>', callback: () => false }
      },
      default: "oui",
      close: () => false
    });
    if (!confirm) return;
    const mgr = TarotManager.getInstance();
    await mgr.resetAll();
    ui.notifications.info("Tarot des Ombres réinitialisé.");
  }

  /* -------------------------------------------------- */
  /*  Hand Actions                                      */
  /* -------------------------------------------------- */

  static async #onJouerCarte(event, target) {
    const cardId = target.dataset.cardId;
    if (!cardId) return;
    const mgr = TarotManager.getInstance();
    const card = await mgr.jouerCarte(game.user.id, cardId);
    if (!card) return;

    // Post played card to chat
    await TarotApp._postCardToChat(card, game.i18n.localize("LAMES.Tarot.jouer"));
  }

  static async #onDefausserCarte(event, target) {
    const cardId = target.dataset.cardId;
    if (!cardId) return;
    const mgr = TarotManager.getInstance();
    const card = await mgr.defausserDepuisMain(game.user.id, cardId);
    if (!card) return;
    ui.notifications.info(`Carte défaussée : ${card.label}`);
  }

  /* -------------------------------------------------- */
  /*  Tests — Helpers                                   */
  /* -------------------------------------------------- */

  /** Get the actor for the current user (selected token or assigned character). */
  static _getActor() {
    const speaker = ChatMessage.getSpeaker();
    let actor = null;
    if (speaker.token) {
      const scene = game.scenes.get(speaker.scene);
      const tokenDoc = scene?.tokens.get(speaker.token);
      actor = tokenDoc?.actor;
    }
    if (!actor) actor = game.user.character;
    return actor;
  }

  /**
   * Evaluate a single drawn card for a test.
   * @param {object} card — card definition from config
   * @param {string} signeCible — exact sign needed (e.g. "griffe")
   * @param {string} couleurCible — color needed ("noir" or "rouge")
   * @returns {object} { reussites, bonneCouleur, isArcane, isFigureSigne }
   */
  static _evaluerCarte(card, signeCible, couleurCible) {
    // Arcane card
    if (card.type === "arcane") {
      return { reussites: 0, bonneCouleur: false, isArcane: true, isFigureSigne: false };
    }
    // Figure (C/V/D/R, valeur >= 11) of the exact sign = 2 réussites
    if (card.signe === signeCible && card.valeur >= 11) {
      return { reussites: 2, bonneCouleur: true, isArcane: false, isFigureSigne: true };
    }
    // Right color = 1 réussite
    if (card.couleur === couleurCible) {
      return { reussites: 1, bonneCouleur: true, isArcane: false, isFigureSigne: false };
    }
    // Wrong color = 0
    return { reussites: 0, bonneCouleur: false, isArcane: false, isFigureSigne: false };
  }

  /** Build the test dialog form with competence selector and optional difficulty. */
  static _buildTestDialogContent(actor, showDifficulte = false) {
    const competences = [];

    // Standard competences (with known signe)
    for (const [key, v] of Object.entries(LAMES.competenceMap)) {
      if (key === "escrime" || key === "occultisme") continue;
      if (!v.signe) continue;
      const val = actor?.system?.competences?.[key]?.valeur ?? 0;
      const label = game.i18n.localize(v.label);
      competences.push({ key, label, signe: v.signe, valeur: val });
    }

    // Escrime: signe depends on the actor's école
    const ecole = actor?.system?.escrime?.ecole;
    const ecoleInfo = ecole ? LAMES.ecoles[ecole] : null;
    if (ecoleInfo) {
      const val = actor?.system?.competences?.escrime?.valeur ?? 0;
      const label = `${game.i18n.localize("LAMES.Competences.escrime")} (${game.i18n.localize(ecoleInfo.label)})`;
      competences.push({ key: "escrime", label, signe: ecoleInfo.signe, valeur: val });
    }

    // Occultisme: player must choose sign — added as 4 entries
    const occVal = actor?.system?.competences?.occultisme?.valeur ?? 0;
    if (occVal > 0) {
      for (const [signe, info] of Object.entries(LAMES.signes)) {
        const signeLabel = game.i18n.localize(info.label);
        competences.push({
          key: `occultisme:${signe}`,
          label: `Occultisme (${signeLabel})`,
          signe,
          valeur: occVal
        });
      }
    }

    const compOptions = competences.map(c =>
      `<option value="${c.key}">${c.label} (${c.valeur}) — ${c.signe}</option>`
    ).join("");

    let html = `
      <form class="lames-test-dialog">
        <div class="form-group">
          <label>Compétence</label>
          <select name="competence">${compOptions}</select>
        </div>`;

    if (showDifficulte) {
      const diffOptions = Object.entries(LAMES.difficultes)
        .map(([val, label]) => `<option value="${val}">${val} — ${label}</option>`)
        .join("");
      html += `
        <div class="form-group">
          <label>Difficulté</label>
          <select name="difficulte">${diffOptions}</select>
        </div>`;
    }

    html += `</form>`;
    return html;
  }

  /**
   * Resolve a competence key from the dialog (may be "occultisme:griffe" or "escrime")
   * into actual compKey, signe, couleur, valeur, and label.
   */
  static _resolveCompetence(rawKey, actor) {
    let compKey, signeCible, couleurCible, compVal, compLabel;

    if (rawKey.startsWith("occultisme:")) {
      const signe = rawKey.split(":")[1];
      compKey = "occultisme";
      signeCible = signe;
      couleurCible = LAMES.signes[signe].couleur;
      compVal = actor.system.competences.occultisme?.valeur ?? 0;
      const signeLabel = game.i18n.localize(`LAMES.Signes.${signe}`);
      compLabel = `Occultisme (${signeLabel})`;
    } else if (rawKey === "escrime") {
      compKey = "escrime";
      const ecole = actor.system.escrime?.ecole;
      const ecoleInfo = ecole ? LAMES.ecoles[ecole] : null;
      signeCible = ecoleInfo?.signe ?? null;
      couleurCible = signeCible ? LAMES.signes[signeCible].couleur : null;
      compVal = actor.system.competences.escrime?.valeur ?? 0;
      compLabel = game.i18n.localize("LAMES.Competences.escrime");
    } else {
      compKey = rawKey;
      const compInfo = LAMES.competenceMap[rawKey];
      signeCible = compInfo?.signe;
      couleurCible = signeCible ? LAMES.signes[signeCible].couleur : null;
      compVal = actor.system.competences[rawKey]?.valeur ?? 0;
      compLabel = game.i18n.localize(compInfo?.label ?? `LAMES.Competences.${rawKey}`);
    }

    const signLabel = signeCible ? game.i18n.localize(`LAMES.Signes.${signeCible}`) : "?";
    return { compKey, signeCible, couleurCible, compVal, compLabel, signLabel };
  }

  /* -------------------------------------------------- */
  /*  Test éclair                                       */
  /* -------------------------------------------------- */

  static async #onTestEclair(event, target) {
    const actor = TarotApp._getActor();
    if (!actor) {
      ui.notifications.warn("Sélectionnez un token ou assignez un personnage.");
      return;
    }

    const content = TarotApp._buildTestDialogContent(actor, true);

    const params = await Dialog.prompt({
      title: "Test éclair !",
      content,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        return {
          competence: el.querySelector("[name=competence]").value,
          difficulte: parseInt(el.querySelector("[name=difficulte]").value)
        };
      },
      rejectClose: false
    });
    if (!params) return;

    const { compKey, signeCible, couleurCible, compVal, compLabel, signLabel } =
      TarotApp._resolveCompetence(params.competence, actor);
    const riviereWarning = TarotApp._checkRiviereCompetence(compKey);
    const beniBonus = TarotApp._checkArcaneBeni(actor, compKey);
    const ephBonus = await TarotApp._checkArcaneEphemere(actor, compKey);
    const combinedBonus = { bonus: beniBonus.bonus + ephBonus.bonus, html: beniBonus.html + ephBonus.html };

    await TarotApp._executeTestEclair(actor, compKey, signeCible, couleurCible, compVal, compLabel, signLabel, params.difficulte, riviereWarning, combinedBonus);
  }

  /** Core test éclair logic (reusable from LameSheet and TarotApp). */
  static async _executeTestEclair(actor, compKey, signeCible, couleurCible, compVal, compLabel, signLabel, difficulte, riviereWarning, beniBonus) {
    const succesAuto = Math.floor(compVal / 2) + beniBonus.bonus;
    const maxCartes = Math.min(2, compVal);
    const mgr = TarotManager.getInstance();
    const speaker = ChatMessage.getSpeaker({ actor });
    const drawnResults = [];
    let totalReussites = succesAuto;
    let perteTenacite = 0;

    // Post test header
    await ChatMessage.create({
      content: `<div class="lames-roll lames-test-eclair">
        <h3><i class="fa-solid fa-bolt"></i> Test éclair !</h3>
        <p><strong>${actor.name}</strong> — ${compLabel} (${compVal}) — ${signLabel}</p>
        <p>Difficulté ${difficulte} | Succès auto : ${succesAuto}${beniBonus.html}</p>
        ${riviereWarning}
      </div>`,
      speaker
    });

    for (let i = 0; i < maxCartes; i++) {
      const cards = await mgr.piocherLames(1);
      if (!cards.length) break;
      const card = cards[0];
      const eval_ = TarotApp._evaluerCarte(card, signeCible, couleurCible);
      drawnResults.push({ card, ...eval_ });
      totalReussites += eval_.reussites;
      if (eval_.isArcane) perteTenacite += 1;
      await mgr.defausserLames([card.id]);

      // Post this card to chat immediately
      let badge = "";
      if (eval_.isArcane) {
        const info = LAMES.arcaneParNumero.get(card.valeur);
        badge = `<span class="badge arcane">Arcane — -1 Ténacité</span>`;
        if (info) badge += `<div class="arcane-marque"><strong>${info.marque}</strong> — ${info.nom}</div>`;
      } else if (eval_.isFigureSigne) badge = `<span class="badge figure">Figure ${signLabel} — 2R</span>`;
      else if (eval_.bonneCouleur) badge = `<span class="badge success">Bonne couleur — 1R</span>`;
      else badge = `<span class="badge failure">Mauvaise couleur — 0R</span>`;

      await ChatMessage.create({
        content: `<div class="lames-roll">
          <div class="tarot-drawn-card ${eval_.bonneCouleur ? 'reussite' : eval_.isArcane ? 'arcane' : 'oppose'}">
            <img src="${card.img}" alt="${card.label}" class="tarot-card-img-small" />
            <span>${card.label}</span>
            ${badge}
          </div>
          <p>Réussites : ${totalReussites} (dont ${succesAuto} auto)</p>
        </div>`,
        speaker
      });

      if (!eval_.bonneCouleur) break;

      // Ask to draw 2nd card with French buttons
      if (i === 0 && maxCartes >= 2) {
        const continuer = await Dialog.wait({
          title: "Test éclair !",
          content: `<p>Piocher une deuxième carte ?</p>`,
          buttons: {
            oui: { label: "Oui", icon: '<i class="fas fa-check"></i>', callback: () => true },
            non: { label: "Non", icon: '<i class="fas fa-times"></i>', callback: () => false }
          },
          default: "oui",
          close: () => false
        });
        if (!continuer) break;
      }
    }

    // Post final result summary
    const panache = totalReussites > difficulte ? totalReussites - difficulte : 0;
    const success = totalReussites >= difficulte;
    let resultText = success ? "✓ Réussite" : "✗ Échec";
    if (panache > 0) resultText += ` — Panache ${panache} !`;

    const chatContent = `
      <div class="lames-roll lames-test-eclair">
        <p class="test-result ${success ? 'success' : 'failure'}">
          Réussites : ${totalReussites} / ${difficulte} — <strong>${resultText}</strong>
        </p>
        ${perteTenacite > 0 ? `<p class="tenacite-loss">⚠ Perte de ${perteTenacite} point(s) de Ténacité</p>` : ""}
      </div>`;

    await ChatMessage.create({ content: chatContent, speaker });
  }

  /* -------------------------------------------------- */
  /*  Test dramatique                                   */
  /* -------------------------------------------------- */

  static async #onTestDramatique(event, target) {
    const actor = TarotApp._getActor();
    if (!actor) {
      ui.notifications.warn("Sélectionnez un token ou assignez un personnage.");
      return;
    }

    const content = TarotApp._buildTestDialogContent(actor, true);

    const params = await Dialog.prompt({
      title: "Test dramatique !",
      content,
      callback: (html) => {
        const el = html instanceof HTMLElement ? html : html[0];
        return {
          competence: el.querySelector("[name=competence]").value,
          difficulte: parseInt(el.querySelector("[name=difficulte]").value)
        };
      },
      rejectClose: false
    });
    if (!params) return;

    const { compKey, signeCible, couleurCible, compVal, compLabel, signLabel } =
      TarotApp._resolveCompetence(params.competence, actor);
    const riviereWarning = TarotApp._checkRiviereCompetence(compKey);
    const beniBonus = TarotApp._checkArcaneBeni(actor, compKey);
    const ephBonus = await TarotApp._checkArcaneEphemere(actor, compKey);
    const combinedBonus = { bonus: beniBonus.bonus + ephBonus.bonus, html: beniBonus.html + ephBonus.html };

    await TarotApp._executeTestDramatique(actor, compKey, signeCible, couleurCible, compVal, compLabel, signLabel, params.difficulte, riviereWarning, combinedBonus);
  }

  /** Core test dramatique logic (reusable from LameSheet and TarotApp). */
  static async _executeTestDramatique(actor, compKey, signeCible, couleurCible, compVal, compLabel, signLabel, difficulte, riviereWarning, beniBonus) {
    if (compVal === 0) {
      ui.notifications.warn(`${compLabel} est à 0, impossible de piocher.`);
      return;
    }

    const mgr = TarotManager.getInstance();
    const speaker = ChatMessage.getSpeaker({ actor });
    let totalReussites = beniBonus.bonus;
    let perteTenacite = 0;

    // Post test header
    await ChatMessage.create({
      content: `<div class="lames-roll lames-test-dramatique">
        <h3><i class="fa-solid fa-theater-masks"></i> Test dramatique !</h3>
        <p><strong>${actor.name}</strong> — ${compLabel} (${compVal}) — ${signLabel}</p>
        <p>Difficulté ${difficulte} | ${compVal} cartes à piocher${beniBonus.html}</p>
        ${riviereWarning}
      </div>`,
      speaker
    });

    // Draw and post each card one by one
    const cards = await mgr.piocherLames(compVal);
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const eval_ = TarotApp._evaluerCarte(card, signeCible, couleurCible);
      totalReussites += eval_.reussites;
      if (eval_.isArcane) perteTenacite += 1;
      await mgr.defausserLames([card.id]);

      let badge = "";
      if (eval_.isArcane) {
        const info = LAMES.arcaneParNumero.get(card.valeur);
        badge = `<span class="badge arcane">Arcane — -1 Ténacité</span>`;
        if (info) badge += `<div class="arcane-marque"><strong>${info.marque}</strong> — ${info.nom}</div>`;
      } else if (eval_.isFigureSigne) badge = `<span class="badge figure">Figure ${signLabel} — 2R</span>`;
      else if (eval_.bonneCouleur) badge = `<span class="badge success">Bonne couleur — 1R</span>`;
      else badge = `<span class="badge failure">Mauvaise couleur — 0R</span>`;

      await ChatMessage.create({
        content: `<div class="lames-roll">
          <div class="tarot-drawn-card ${eval_.bonneCouleur ? 'reussite' : eval_.isArcane ? 'arcane' : 'oppose'}">
            <img src="${card.img}" alt="${card.label}" class="tarot-card-img-small" />
            <span>${card.label}</span>
            ${badge}
          </div>
          <p>Carte ${i + 1}/${cards.length} — Réussites : ${totalReussites}</p>
        </div>`,
        speaker
      });
    }

    // Post final result summary
    const panache = totalReussites > difficulte ? totalReussites - difficulte : 0;
    const success = totalReussites >= difficulte;
    let resultText = success ? "✓ Réussite" : "✗ Échec";
    if (panache > 0) resultText += ` — Panache ${panache} !`;

    await ChatMessage.create({
      content: `<div class="lames-roll lames-test-dramatique">
        <p class="test-result ${success ? 'success' : 'failure'}">
          Réussites : ${totalReussites} / ${difficulte} — <strong>${resultText}</strong>
        </p>
        ${perteTenacite > 0 ? `<p class="tenacite-loss">⚠ Perte de ${perteTenacite} point(s) de Ténacité</p>` : ""}
      </div>`,
      speaker
    });
  }

  /* -------------------------------------------------- */
  /*  Helpers                                           */
  /* -------------------------------------------------- */

  /**
   * Build HTML for drawn cards in test results, with arcane detail enrichment.
   */
  static _buildCardsHtml(drawnResults, signLabel) {
    return drawnResults.map(d => {
      let badge = "";
      let extra = "";
      if (d.isArcane) {
        const info = LAMES.arcaneParNumero.get(d.card.valeur);
        badge = `<span class="badge arcane">Arcane — -1 Ténacité</span>`;
        if (info) {
          extra = `<div class="arcane-marque">
            <strong>${info.marque}</strong> — ${info.nom}
            <em>${info.md.substring(0, 120)}…</em>
          </div>`;
        }
      } else if (d.isFigureSigne) {
        badge = `<span class="badge figure">Figure ${signLabel} — 2R</span>`;
      } else if (d.bonneCouleur) {
        badge = `<span class="badge success">Bonne couleur — 1R</span>`;
      } else {
        badge = `<span class="badge failure">Mauvaise couleur — 0R</span>`;
      }
      return `
        <div class="tarot-drawn-card ${d.bonneCouleur ? 'reussite' : d.isArcane ? 'arcane' : 'oppose'}">
          <img src="${d.card.img}" alt="${d.card.label}" class="tarot-card-img-small" />
          <span>${d.card.label}</span>
          ${badge}
          ${extra}
        </div>`;
    }).join("");
  }

  /**
   * Check if any arcane in the rivière is associated with the tested competence.
   * Returns an HTML warning string or empty string.
   */
  static _checkRiviereCompetence(compKey) {
    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state?.riviere?.length) return "";

    const matches = [];
    for (const cardId of state.riviere) {
      const card = mgr.getCard(cardId);
      if (!card) continue;
      const info = LAMES.arcaneParNumero.get(card.valeur);
      if (info?.comp === compKey) {
        matches.push(info);
      }
    }
    if (!matches.length) return "";

    const names = matches.map(m => `<strong>${m.nom}</strong> (${m.vd})`).join(", ");
    return `<p class="riviere-warning"><i class="fa-solid fa-water"></i> Rivière active sur cette compétence : ${names}</p>`;
  }

  /**
   * Check if the actor has an unused arcane éphémère matching the tested competence.
   * If so, ask the player whether to use it. Returns bonus (0 or 1).
   */
  static async _checkArcaneEphemere(actor, compKey) {
    const eph = actor?.system?.arcaneEphemere;
    if (!eph || eph.numero === null || eph.utilise) return { bonus: 0, html: "" };

    const info = LAMES.arcaneParNumero.get(eph.numero);
    if (!info || info.comp !== compKey) return { bonus: 0, html: "" };

    const use = await Dialog.wait({
      title: "Arcane éphémère",
      content: `<p>Votre arcane éphémère <strong>${eph.nom}</strong> correspond à cette compétence.</p>
        <p>L'utiliser pour +1 réussite ? (usage unique)</p>`,
      buttons: {
        oui: { label: "Oui", icon: '<i class="fas fa-star"></i>', callback: () => true },
        non: { label: "Non", icon: '<i class="fas fa-times"></i>', callback: () => false }
      },
      default: "oui",
      close: () => false
    });

    if (!use) return { bonus: 0, html: "" };

    // Mark as used
    await actor.update({ "system.arcaneEphemere.utilise": true });

    return {
      bonus: 1,
      html: ` | <span class="ephemere-bonus"><i class="fa-solid fa-sparkles"></i> Arcane éphémère (+1) : ${eph.nom}</span>`
    };
  }

  /**
   * Check if the actor has an arcane béni matching the tested competence.
   * Returns { bonus: number, html: string } where bonus is +1 per matching béni.
   */
  static _checkArcaneBeni(actor, compKey) {
    const benis = actor?.system?.arcanesBenis ?? [];
    const matches = benis.filter(b => b.competenceAssociee === compKey);
    if (!matches.length) return { bonus: 0, html: "" };

    const names = matches.map(m => m.nom).join(", ");
    return {
      bonus: matches.length,
      html: ` | <span class="beni-bonus"><i class="fa-solid fa-star"></i> Arcane béni (+${matches.length}) : ${names}</span>`
    };
  }

  static async _postCardToChat(card, title) {
    const signeLabel = card.signe ? game.i18n.localize(`LAMES.Signes.${card.signe}`) : "Arcane";
    const chatContent = `
      <div class="lames-roll lames-tarot-draw">
        <h3><i class="fa-solid fa-cards"></i> ${title}</h3>
        <div class="tarot-card-display">
          <img src="${card.img}" alt="${card.label}" class="tarot-card-img" />
          <div class="tarot-card-info">
            <span class="card-label">${card.label}</span>
            <span class="card-signe">${signeLabel}</span>
          </div>
        </div>
      </div>`;

    await ChatMessage.create({
      content: chatContent,
      speaker: ChatMessage.getSpeaker()
    });
  }
}
