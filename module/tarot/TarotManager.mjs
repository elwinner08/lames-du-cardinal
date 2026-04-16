/**
 * TarotManager — manages the Tarot des Ombres deck state.
 *
 * State is stored in a world setting (JSON) so it persists across sessions
 * and is synchronized across all clients via sockets.
 *
 * The Tarot has two logical decks:
 *   - Paquet des Lames (56 suit cards) — used for tests
 *   - Paquet des Arcanes (22 arcanes) — used for the rivière draconique
 *
 * State shape:
 *   { lames: { pioche: [...ids], defausse: [...ids] },
 *     arcanes: { pioche: [...ids], defausse: [...ids] },
 *     riviere: [...ids],
 *     mains: { [userId]: [...ids] } }
 */

import { LAMES } from "../helpers/config.mjs";

export default class TarotManager {

  /** @type {TarotManager|null} */
  static instance = null;

  /** Get or create the singleton. */
  static getInstance() {
    if (!TarotManager.instance) TarotManager.instance = new TarotManager();
    return TarotManager.instance;
  }

  constructor() {
    /** Full deck definition (built once from config). */
    this._deck = LAMES.tarot.buildDeck();
    /** Card lookup by id. */
    this._cardsById = new Map(this._deck.map(c => [c.id, c]));
  }

  /* -------------------------------------------------- */
  /*  Settings Registration                             */
  /* -------------------------------------------------- */

  static registerSettings() {
    game.settings.register("lames-du-cardinal", "tarotState", {
      name: "État du Tarot des Ombres",
      scope: "world",
      config: false,
      type: Object,
      default: null
    });
  }

  /* -------------------------------------------------- */
  /*  State Persistence                                 */
  /* -------------------------------------------------- */

  /** Load state from settings, initializing if needed. */
  async load() {
    let state = game.settings.get("lames-du-cardinal", "tarotState");
    if (!state || !state.lames) {
      state = this._buildFreshState();
      if (game.user.isGM) await this._save(state);
    }
    // Migrate old state
    if (!state.mains) state.mains = {};
    if (!state.arcanesEphemeres) state.arcanesEphemeres = {};
    this._state = state;
    return this;
  }

  /** Save current state (GM only). */
  async _save(state) {
    state = state ?? this._state;
    await game.settings.set("lames-du-cardinal", "tarotState", state);
  }

  /** Broadcast a refresh to all clients. */
  async _broadcast() {
    if (game.user.isGM) {
      // GM saves directly
      await this._save();
      game.socket.emit("system.lames-du-cardinal", { type: "tarot-refresh" });
      Hooks.callAll("lames.tarotChanged", this._state);
    } else {
      // Player sends the updated state to GM for saving
      game.socket.emit("system.lames-du-cardinal", {
        type: "tarot-player-update",
        state: this._state
      });
      // Optimistically update local hooks
      Hooks.callAll("lames.tarotChanged", this._state);
    }
  }

  /** Build a fresh shuffled state. */
  _buildFreshState() {
    const lameIds = this._deck.filter(c => c.type === "lame").map(c => c.id);
    const arcaneIds = this._deck.filter(c => c.type === "arcane").map(c => c.id);
    return {
      lames: { pioche: this._shuffle([...lameIds]), defausse: [] },
      arcanes: { pioche: this._shuffle([...arcaneIds]), defausse: [] },
      riviere: [],
      mains: {},
      arcanesEphemeres: {}
    };
  }

  /** Ensure mains object exists (migration from old state). */
  _ensureMains() {
    if (!this._state.mains) this._state.mains = {};
    if (!this._state.arcanesEphemeres) this._state.arcanesEphemeres = {};
  }

  /* -------------------------------------------------- */
  /*  Card Lookup                                       */
  /* -------------------------------------------------- */

  /** Get card definition by id. */
  getCard(id) {
    return this._cardsById.get(id) ?? null;
  }

  /** Get current state (read-only snapshot). */
  get state() {
    return this._state;
  }

  /* -------------------------------------------------- */
  /*  Paquet des Lames — Pioche / Défausse              */
  /* -------------------------------------------------- */

  /** Draw n cards from the Lames deck. Reshuffles if needed. */
  async piocherLames(n = 1) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this._state.lames.pioche.length === 0) {
        this._reshuffleLames();
      }
      if (this._state.lames.pioche.length === 0) break; // safety
      drawn.push(this._state.lames.pioche.shift());
    }
    await this._broadcast();
    return drawn.map(id => this.getCard(id));
  }

  /** Discard specific Lame card ids. */
  async defausserLames(cardIds) {
    for (const id of cardIds) {
      if (!this._state.lames.defausse.includes(id)) {
        this._state.lames.defausse.push(id);
      }
    }
    await this._broadcast();
  }

  /** Reshuffle defausse back into pioche (Lames). */
  _reshuffleLames() {
    const all = [...this._state.lames.pioche, ...this._state.lames.defausse];
    this._state.lames.pioche = this._shuffle(all);
    this._state.lames.defausse = [];
  }

  /** Reshuffle defausse into pioche (GM action). */
  async remelangeLames() {
    this._reshuffleLames();
    await this._broadcast();
  }

  /** Recall ALL Lame cards (from hands, defausse) back into pioche and shuffle. */
  async rappelerToutesLames() {
    this._ensureMains();
    const allLameIds = this._deck.filter(c => c.type === "lame").map(c => c.id);
    // Remove lame cards from all hands
    for (const userId of Object.keys(this._state.mains)) {
      this._state.mains[userId] = this._state.mains[userId].filter(id => {
        const card = this.getCard(id);
        return card?.type !== "lame";
      });
    }
    // Rebuild pioche with all 56 lame cards, empty defausse
    this._state.lames.pioche = this._shuffle([...allLameIds]);
    this._state.lames.defausse = [];
    await this._broadcast();
  }

  /* -------------------------------------------------- */
  /*  Paquet des Arcanes — Pioche / Défausse / Rivière  */
  /* -------------------------------------------------- */

  /** Draw n cards from the Arcanes deck. */
  async piocherArcanes(n = 1) {
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this._state.arcanes.pioche.length === 0) {
        this._reshuffleArcanes();
      }
      if (this._state.arcanes.pioche.length === 0) break;
      drawn.push(this._state.arcanes.pioche.shift());
    }
    await this._broadcast();
    return drawn.map(id => this.getCard(id));
  }

  /** Discard specific Arcane card ids. */
  async defausserArcanes(cardIds) {
    for (const id of cardIds) {
      // Remove from rivière if present
      const rivIdx = this._state.riviere.indexOf(id);
      if (rivIdx >= 0) this._state.riviere.splice(rivIdx, 1);
      if (!this._state.arcanes.defausse.includes(id)) {
        this._state.arcanes.defausse.push(id);
      }
    }
    await this._broadcast();
  }

  /** Reshuffle Arcanes defausse back into pioche. */
  _reshuffleArcanes() {
    const all = [...this._state.arcanes.pioche, ...this._state.arcanes.defausse];
    this._state.arcanes.pioche = this._shuffle(all);
    this._state.arcanes.defausse = [];
  }

  /** Full reshuffle of Arcanes deck (GM action). */
  async remelangeArcanes() {
    this._reshuffleArcanes();
    this._state.riviere = [];
    await this._broadcast();
  }

  /* -------------------------------------------------- */
  /*  Rivière draconique                                */
  /* -------------------------------------------------- */

  /** Place an arcane card into the rivière. */
  async ajouterRiviere(cardId) {
    if (!this._state.riviere.includes(cardId)) {
      this._state.riviere.push(cardId);
    }
    await this._broadcast();
  }

  /** Remove an arcane from the rivière (to defausse). */
  async retirerRiviere(cardId) {
    await this.defausserArcanes([cardId]);
  }

  /* -------------------------------------------------- */
  /*  Mains (hands) per user                            */
  /* -------------------------------------------------- */

  /** Get hand card ids for a user. */
  getMain(userId) {
    this._ensureMains();
    return (this._state.mains[userId] ?? []).map(id => this.getCard(id));
  }

  /** Draw n Lames from pioche into a user's hand. */
  async piocherLameEnMain(userId, n = 1) {
    this._ensureMains();
    if (!this._state.mains[userId]) this._state.mains[userId] = [];
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this._state.lames.pioche.length === 0) this._reshuffleLames();
      if (this._state.lames.pioche.length === 0) break;
      const id = this._state.lames.pioche.shift();
      this._state.mains[userId].push(id);
      drawn.push(id);
    }
    await this._broadcast();
    return drawn.map(id => this.getCard(id));
  }

  /** Draw n Arcanes from pioche into a user's hand. */
  async piocherArcaneEnMain(userId, n = 1) {
    this._ensureMains();
    if (!this._state.mains[userId]) this._state.mains[userId] = [];
    const drawn = [];
    for (let i = 0; i < n; i++) {
      if (this._state.arcanes.pioche.length === 0) this._reshuffleArcanes();
      if (this._state.arcanes.pioche.length === 0) break;
      const id = this._state.arcanes.pioche.shift();
      this._state.mains[userId].push(id);
      drawn.push(id);
    }
    await this._broadcast();
    return drawn.map(id => this.getCard(id));
  }

  /** Play a card from hand (remove from hand, send to defausse, post to chat). */
  async jouerCarte(userId, cardId) {
    this._ensureMains();
    const hand = this._state.mains[userId] ?? [];
    const idx = hand.indexOf(cardId);
    if (idx < 0) return null;
    hand.splice(idx, 1);
    // Send to appropriate defausse
    const card = this.getCard(cardId);
    if (card.type === "arcane") {
      this._state.arcanes.defausse.push(cardId);
    } else {
      this._state.lames.defausse.push(cardId);
    }
    await this._broadcast();
    return card;
  }

  /** Discard a card from hand back to the appropriate defausse. */
  async defausserDepuisMain(userId, cardId) {
    this._ensureMains();
    const hand = this._state.mains[userId] ?? [];
    const idx = hand.indexOf(cardId);
    if (idx < 0) return null;
    hand.splice(idx, 1);
    const card = this.getCard(cardId);
    if (card.type === "arcane") {
      this._state.arcanes.defausse.push(cardId);
    } else {
      this._state.lames.defausse.push(cardId);
    }
    await this._broadcast();
    return card;
  }

  /* -------------------------------------------------- */
  /*  GM: Give any card to a player                     */
  /* -------------------------------------------------- */

  /**
   * Move a card from wherever it is (pioche or defausse) into a player's hand.
   * Does nothing if the card is already in a hand or in the rivière.
   */
  async donnerCarte(cardId, userId) {
    this._ensureMains();
    const card = this.getCard(cardId);
    if (!card) return null;

    // Remove from lames pioche/defausse or arcanes pioche/defausse
    const pools = card.type === "arcane"
      ? [this._state.arcanes.pioche, this._state.arcanes.defausse]
      : [this._state.lames.pioche, this._state.lames.defausse];

    let found = false;
    for (const pool of pools) {
      const idx = pool.indexOf(cardId);
      if (idx >= 0) {
        pool.splice(idx, 1);
        found = true;
        break;
      }
    }
    if (!found) return null; // card is in hand or rivière, can't give

    // Add to player's hand
    if (!this._state.mains[userId]) this._state.mains[userId] = [];
    this._state.mains[userId].push(cardId);
    await this._broadcast();
    return card;
  }

  /** Remove an arcane from hand and shuffle it back into lames pioche. */
  async retirerArcaneDeMain(userId, cardId) {
    this._ensureMains();
    const hand = this._state.mains[userId] ?? [];
    const idx = hand.indexOf(cardId);
    if (idx < 0) return null;
    hand.splice(idx, 1);
    this._state.lames.pioche.push(cardId);
    this._state.lames.pioche = this._shuffle(this._state.lames.pioche);
    await this._broadcast();
    return this.getCard(cardId);
  }

  /** Transfer a card from one player's hand to another player's hand. */
  async transfererCarte(fromUserId, toUserId, cardId) {
    this._ensureMains();
    const hand = this._state.mains[fromUserId] ?? [];
    const idx = hand.indexOf(cardId);
    if (idx < 0) return null;
    hand.splice(idx, 1);
    if (!this._state.mains[toUserId]) this._state.mains[toUserId] = [];
    this._state.mains[toUserId].push(cardId);
    await this._broadcast();
    return this.getCard(cardId);
  }

  /* -------------------------------------------------- */
  /*  Arcanes Éphémères (0-2 per player, public)        */
  /* -------------------------------------------------- */

  /** Get ephemeral arcane card objects for a user. */
  getArcanesEphemeres(userId) {
    this._ensureMains();
    return (this._state.arcanesEphemeres[userId] ?? []).map(id => this.getCard(id));
  }

  /** Add an arcane card as ephemeral to a player (max 2). Pulls from arcanes pioche. */
  async ajouterArcaneEphemere(userId) {
    this._ensureMains();
    if (!this._state.arcanesEphemeres[userId]) this._state.arcanesEphemeres[userId] = [];
    if (this._state.arcanesEphemeres[userId].length >= 2) return null;
    if (this._state.arcanes.pioche.length === 0) this._reshuffleArcanes();
    if (this._state.arcanes.pioche.length === 0) return null;
    const id = this._state.arcanes.pioche.shift();
    this._state.arcanesEphemeres[userId].push(id);
    await this._broadcast();
    return this.getCard(id);
  }

  /** Give a specific arcane card as ephemeral to a player (GM action, from pioche/defausse). */
  async donnerArcaneEphemere(cardId, userId) {
    this._ensureMains();
    if (!this._state.arcanesEphemeres[userId]) this._state.arcanesEphemeres[userId] = [];
    if (this._state.arcanesEphemeres[userId].length >= 2) return null;
    // Remove from arcanes pioche or defausse
    const pools = [this._state.arcanes.pioche, this._state.arcanes.defausse];
    let found = false;
    for (const pool of pools) {
      const idx = pool.indexOf(cardId);
      if (idx >= 0) { pool.splice(idx, 1); found = true; break; }
    }
    if (!found) return null;
    this._state.arcanesEphemeres[userId].push(cardId);
    await this._broadcast();
    return this.getCard(cardId);
  }

  /** Play or discard an ephemeral arcane → shuffled back into LAMES pioche. */
  async retirerArcaneEphemere(userId, cardId) {
    this._ensureMains();
    const eph = this._state.arcanesEphemeres[userId] ?? [];
    const idx = eph.indexOf(cardId);
    if (idx < 0) return null;
    eph.splice(idx, 1);
    // Goes into LAMES pioche (not arcanes), then reshuffle
    this._state.lames.pioche.push(cardId);
    this._state.lames.pioche = this._shuffle(this._state.lames.pioche);
    await this._broadcast();
    return this.getCard(cardId);
  }

  /* -------------------------------------------------- */
  /*  Full Reset                                        */
  /* -------------------------------------------------- */

  /** Reset everything — new shuffled decks, empty rivière, empty hands, empty ephemeral. */
  async resetAll() {
    this._state = this._buildFreshState();
    await this._broadcast();
  }



  /* -------------------------------------------------- */
  /*  Utilities                                         */
  /* -------------------------------------------------- */

  /** Fisher-Yates shuffle. */
  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
