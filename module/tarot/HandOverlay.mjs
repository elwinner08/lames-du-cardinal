/**
 * HandOverlay — Persistent HUD showing:
 *  1. The current player's Lame hand cards (private, fan/arc layout)
 *  2. All players' ephemeral arcanes (public, face visible, beside the hand)
 *
 * - Left-click hand card = play.
 * - Right-click hand card = context menu: discard or send to another player.
 * - Left-click ephemeral = play (costs 1 ténacité, card → lames pioche).
 * - Right-click ephemeral = discard (card → lames pioche, no ténacité cost).
 */

import TarotManager from "./TarotManager.mjs";
import { LAMES } from "../helpers/config.mjs";

export default class HandOverlay {

  static _container = null;
  static _ephContainer = null;

  static init() {
    // Hand fan container (bottom center)
    const el = document.createElement("div");
    el.id = "hand-overlay";
    el.classList.add("hand-overlay");
    document.body.appendChild(el);
    this._container = el;

    // Ephemeral arcanes container (bottom left, separate DOM element)
    const ephEl = document.createElement("div");
    ephEl.id = "eph-overlay";
    ephEl.classList.add("eph-container");
    document.body.appendChild(ephEl);
    this._ephContainer = ephEl;

    // Left-click delegation — hand
    el.addEventListener("click", (ev) => {
      const handCard = ev.target.closest("[data-hand-card]");
      if (handCard) return this._onPlayCard(handCard.dataset.handCard);
    });

    // Right-click delegation — hand
    el.addEventListener("contextmenu", (ev) => {
      const handCard = ev.target.closest("[data-hand-card]");
      if (handCard) {
        ev.preventDefault();
        return this._onContextMenu(handCard.dataset.handCard);
      }
    });

    // Left-click delegation — ephemeral
    ephEl.addEventListener("click", (ev) => {
      const ephCard = ev.target.closest("[data-eph-card]");
      if (ephCard && ephCard.dataset.ephOwner === game.user.id) {
        return this._onPlayEphemeral(ephCard.dataset.ephCard);
      }
    });

    // Right-click delegation — ephemeral
    ephEl.addEventListener("contextmenu", (ev) => {
      const ephCard = ev.target.closest("[data-eph-card]");
      if (ephCard && ephCard.dataset.ephOwner === game.user.id) {
        ev.preventDefault();
        return this._onDiscardEphemeral(ephCard.dataset.ephCard);
      }
    });

    this.refresh();
    Hooks.on("lames.tarotChanged", () => this.refresh());
  }

  static refresh() {
    const container = this._container;
    if (!container) return;

    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state) { container.innerHTML = ""; return; }

    // --- Current user's hand (Lames only, private) ---
    const allCards = mgr.getMain(game.user.id);
    const lames = allCards.filter(c => c && c.type === "lame");

    let handHtml = "";
    if (lames.length) {
      const total = lames.length;
      const maxSpread = 30;
      const spread = Math.min(maxSpread, total * 3);
      const stepAngle = total > 1 ? spread / (total - 1) : 0;
      const startAngle = -spread / 2;
      const arcRadius = 900;

      const cardsHtml = lames.map((card, i) => {
        const angle = total > 1 ? startAngle + stepAngle * i : 0;
        const angleRad = (angle * Math.PI) / 180;
        const tx = Math.sin(angleRad) * arcRadius;
        const ty = (1 - Math.cos(angleRad)) * arcRadius;
        return `
          <div class="hand-card" data-hand-card="${card.id}"
               style="--fan-angle: ${angle}deg; --fan-tx: ${tx.toFixed(1)}px; --fan-ty: ${ty.toFixed(1)}px;"
               title="${card.label}">
            <img src="${card.img}" alt="${card.label}" class="hand-card-img" draggable="false" />
          </div>
        `;
      }).join("");

      handHtml = `<div class="hand-fan">${cardsHtml}</div>`;
    }

    // --- Ephemeral arcanes (ALL players, public, face visible) ---
    const ephSections = [];
    for (const user of game.users) {
      const ephCards = mgr.getArcanesEphemeres(user.id);
      if (!ephCards.length) continue;

      const isOwner = user.id === game.user.id;
      const cardsHtml = ephCards.map(card => {
        if (!card) return "";
        const arcInfo = LAMES.arcaneParNumero.get(card.valeur);
        const tooltip = arcInfo ? `${arcInfo.numero} — ${arcInfo.nom}` : card.label;
        return `
          <div class="eph-card ${isOwner ? "eph-owner" : ""}"
               data-eph-card="${card.id}" data-eph-owner="${user.id}"
               title="${tooltip}">
            <img src="${card.img}" alt="${card.label}" class="eph-card-img" draggable="false" />
          </div>
        `;
      }).join("");

      ephSections.push(`
        <div class="eph-player-group">
          <div class="eph-player-name">${user.name}</div>
          <div class="eph-cards">${cardsHtml}</div>
        </div>
      `);
    }

    container.classList.toggle("has-cards", !!lames.length);
    container.innerHTML = handHtml;

    // Render ephemeral arcanes in separate container
    const ephContainer = this._ephContainer;
    if (ephContainer) {
      ephContainer.innerHTML = ephSections.join("");
    }
  }

  /* ---- Left-click on hand card: Play ---- */

  static async _onPlayCard(cardId) {
    const mgr = TarotManager.getInstance();
    const card = mgr.getCard(cardId);
    if (!card) return;
    const loc = (key) => game.i18n.localize(key);

    const confirmed = await Dialog.wait({
      title: loc("LAMES.Tarot.jouer"),
      content: `<p>${loc("LAMES.Tarot.jouerConfirm")} <strong>${card.label}</strong> ?</p>`,
      buttons: {
        ok: { label: loc("LAMES.Divers.oui"), callback: () => true },
        cancel: { label: loc("LAMES.Divers.non"), callback: () => false }
      },
      default: "ok"
    });
    if (!confirmed) return;

    await mgr.jouerCarte(game.user.id, cardId);

    // Post to chat (same format as TarotApp._postCardToChat)
    const signeLabel = card.signe ? game.i18n.localize(`LAMES.Signes.${card.signe}`) : "Arcane";
    const actor = game.user.character;
    const speakerName = actor?.name ?? game.user.name;
    await ChatMessage.create({
      content: `
        <div class="lames-roll lames-tarot-draw">
          <h3><i class="fa-solid fa-cards"></i> ${speakerName} ${loc("LAMES.Tarot.joueUneCarte")}</h3>
          <div class="tarot-card-display">
            <img src="${card.img}" alt="${card.label}" class="tarot-card-img" />
            <div class="tarot-card-info">
              <span class="card-label">${card.label}</span>
              <span class="card-signe">${signeLabel}</span>
            </div>
          </div>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });

    ui.notifications.info(`${card.label} ${loc("LAMES.Tarot.jouee")}`);
  }

  /* ---- Right-click on hand card: Context menu ---- */

  static async _onContextMenu(cardId) {
    const mgr = TarotManager.getInstance();
    const card = mgr.getCard(cardId);
    if (!card) return;
    const loc = (key) => game.i18n.localize(key);

    const otherPlayers = game.users.filter(u =>
      u.id !== game.user.id && u.active && u.character
    );

    const buttons = {
      discard: {
        icon: '<i class="fas fa-trash"></i>',
        label: loc("LAMES.Tarot.defausserConfirm"),
        callback: () => ({ action: "discard" })
      }
    };

    for (const u of otherPlayers) {
      buttons[`send-${u.id}`] = {
        icon: '<i class="fas fa-share"></i>',
        label: `${loc("LAMES.Tarot.envoyerA")} ${u.name}`,
        callback: () => ({ action: "send", userId: u.id })
      };
    }

    buttons.cancel = {
      icon: '<i class="fas fa-times"></i>',
      label: loc("LAMES.Divers.annuler"),
      callback: () => null
    };

    const result = await Dialog.wait({
      title: card.label,
      content: `<p><strong>${card.label}</strong></p>`,
      buttons,
      default: "cancel"
    });

    if (!result) return;

    if (result.action === "discard") {
      await mgr.defausserDepuisMain(game.user.id, cardId);
      ui.notifications.info(`${card.label} ${loc("LAMES.Tarot.defaussee")}`);
    } else if (result.action === "send") {
      const targetUser = game.users.get(result.userId);
      await mgr.transfererCarte(game.user.id, result.userId, cardId);
      ui.notifications.info(`${card.label} ${loc("LAMES.Tarot.envoyee")} ${targetUser?.name}`);
    }
  }

  /* ---- Ephemeral arcane: Play (left-click) — costs 1 ténacité ---- */

  static async _onPlayEphemeral(cardId) {
    const mgr = TarotManager.getInstance();
    const card = mgr.getCard(cardId);
    if (!card) return;
    const loc = (key) => game.i18n.localize(key);

    // Check the player has a character with ténacité available
    const actor = game.user.character
      ?? game.actors.find(a => a.type === "lame" && a.isOwner);
    if (!actor) {
      ui.notifications.warn(loc("LAMES.Tarot.pasDePersonnage"));
      return;
    }
    const system = actor.system;
    if (system.tenacite <= 0) {
      ui.notifications.warn(loc("LAMES.Tarot.plusDeTenacite"));
      return;
    }

    const arcInfo = LAMES.arcaneParNumero.get(card.valeur);
    const arcName = arcInfo ? `${arcInfo.numero} — ${arcInfo.nom}` : card.label;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: loc("LAMES.Tarot.jouer") },
      content: `<p>${loc("LAMES.Tarot.jouerConfirm")} <strong>${arcName}</strong> ?</p>
                <p class="tenacite-cost" style="color:#8b0000;font-weight:bold;">
                  ⚠ ${loc("LAMES.Tarot.coutTenacite")}
                </p>`,
      yes: { label: loc("LAMES.Divers.oui") },
      no: { label: loc("LAMES.Divers.non") },
      rejectClose: false
    });
    if (!confirmed) return;

    // Spend 1 ténacité: mark first "vierge" case as "cochee"
    const epee = foundry.utils.deepClone(system.epee);
    const idx = epee.indexOf("vierge");
    if (idx >= 0) {
      epee[idx] = "cochee";
      await actor.update({ "system.epee": epee });
    }

    // Remove ephemeral arcane → goes to lames pioche (reshuffled)
    await mgr.retirerArcaneEphemere(game.user.id, cardId);

    // Post to chat
    await ChatMessage.create({
      content: `
        <div class="lames-roll lames-feinte">
          <h3><i class="fa-solid fa-star"></i> ${loc("LAMES.Tarot.arcaneEphemere")}</h3>
          <p><strong>${actor.name}</strong> ${loc("LAMES.Tarot.joueArcaneEph")} <strong>${arcName}</strong></p>
          <div class="tarot-drawn-cards">
            <img src="${card.img}" alt="${card.label}" class="tarot-card-img-small" />
          </div>
          <p class="tenacite-cost">-1 ${loc("LAMES.Epee.tenacite")} (${loc("LAMES.Tarot.reste")} : ${system.tenacite - 1})</p>
        </div>`,
      speaker: ChatMessage.getSpeaker({ actor })
    });

    ui.notifications.info(`${arcName} ${loc("LAMES.Tarot.jouee")}`);
  }

  /* ---- Ephemeral arcane: Discard (right-click) — no ténacité cost ---- */

  static async _onDiscardEphemeral(cardId) {
    const mgr = TarotManager.getInstance();
    const card = mgr.getCard(cardId);
    if (!card) return;
    const loc = (key) => game.i18n.localize(key);

    const confirmed = await Dialog.wait({
      title: loc("LAMES.Tarot.defausser"),
      content: `<p>${loc("LAMES.Tarot.defausserConfirm")} <strong>${card.label}</strong> ?</p>`,
      buttons: {
        ok: { label: loc("LAMES.Divers.oui"), callback: () => true },
        cancel: { label: loc("LAMES.Divers.non"), callback: () => false }
      },
      default: "ok"
    });
    if (!confirmed) return;

    await mgr.retirerArcaneEphemere(game.user.id, cardId);
    ui.notifications.info(`${card.label} ${loc("LAMES.Tarot.defaussee")}`);
  }
}
