/**
 * TarotCatalogue — GM-only ApplicationV2 window listing all 78 cards.
 * Clicking a card opens a dialog to give it to a player (if available).
 */

import TarotManager from "./TarotManager.mjs";
import { LAMES } from "../helpers/config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export default class TarotCatalogue extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id: "tarot-catalogue",
    classes: ["lames-du-cardinal", "tarot-catalogue"],
    tag: "div",
    window: {
      title: "LAMES.Tarot.catalogue",
      icon: "fa-solid fa-book-open",
      resizable: true
    },
    position: {
      width: 480,
      height: 700
    },
    actions: {
      selectCard: TarotCatalogue.#onSelectCard
    }
  };

  static PARTS = {
    body: { template: "systems/lames-du-cardinal/templates/tarot/tarot-catalogue.hbs" }
  };

  /* ---- Singleton ---- */
  static _instance = null;

  static toggle() {
    if (!game.user.isGM) return;
    if (TarotCatalogue._instance?.rendered) {
      TarotCatalogue._instance.close();
    } else {
      if (!TarotCatalogue._instance) TarotCatalogue._instance = new TarotCatalogue();
      TarotCatalogue._instance.render({ force: true });
    }
  }

  constructor(options = {}) {
    super(options);
    this._hookId = Hooks.on("lames.tarotChanged", () => {
      if (this.rendered) this.render();
    });
  }

  close(options) {
    Hooks.off("lames.tarotChanged", this._hookId);
    return super.close(options);
  }

  /* ---- Data ---- */

  async _prepareContext(options) {
    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state) return { lames: [], arcanes: [] };

    // Collect all card IDs that are unavailable (in hands or rivière)
    const unavailable = new Set();
    for (const hand of Object.values(state.mains)) {
      for (const id of hand) unavailable.add(id);
    }
    for (const id of state.riviere) unavailable.add(id);

    // Build full card list with availability
    const deck = LAMES.tarot.buildDeck();

    const lameCards = deck.filter(c => c.type === "lame").map(c => ({
      ...c,
      available: !unavailable.has(c.id)
    }));

    const arcaneCards = deck.filter(c => c.type === "arcane").map(c => ({
      ...c,
      available: !unavailable.has(c.id)
    }));

    return { lames: lameCards, arcanes: arcaneCards };
  }

  /* ---- Actions ---- */

  static async #onSelectCard(event, target) {
    const cardId = target.dataset.cardId;
    const mgr = TarotManager.getInstance();
    const state = mgr.state;

    // Check availability: card must be in pioche or defausse, not in a hand or rivière
    const inHand = Object.values(state.mains).some(hand => hand.includes(cardId));
    const inRiviere = state.riviere.includes(cardId);
    if (inHand || inRiviere) {
      ui.notifications.warn(game.i18n.localize("LAMES.Tarot.carteIndisponible"));
      return;
    }

    // Get card info for display
    const card = mgr.getCard(cardId);
    if (!card) return;

    // Build player list
    const players = game.users.filter(u => !u.isGM && u.active);
    if (!players.length) {
      ui.notifications.warn("Aucun joueur connecté.");
      return;
    }

    const playerOptions = players.map(p =>
      `<option value="${p.id}">${p.name}</option>`
    ).join("");

    const content = `
      <p><strong>${card.label}</strong></p>
      <div class="form-group">
        <label>${game.i18n.localize("LAMES.Tarot.donnerA")}</label>
        <select id="catalogue-player-select">${playerOptions}</select>
      </div>
    `;

    const userId = await Dialog.wait({
      title: game.i18n.localize("LAMES.Tarot.donnerCarte"),
      content,
      buttons: {
        ok: {
          label: game.i18n.localize("LAMES.Divers.oui"),
          callback: (html) => (html[0] ?? html).querySelector("#catalogue-player-select").value
        },
        cancel: {
          label: game.i18n.localize("LAMES.Divers.non"),
          callback: () => null
        }
      },
      default: "ok"
    });

    if (!userId) return;

    // Move card: remove from wherever it is (pioche or defausse), add to player hand
    await mgr.donnerCarte(cardId, userId);

    const player = game.users.get(userId);
    ui.notifications.info(`${game.i18n.localize("LAMES.Tarot.carteDonnee")} : ${card.label} → ${player.name}`);
  }
}
