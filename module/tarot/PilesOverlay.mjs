/**
 * PilesOverlay — Persistent HUD showing draw/discard piles on the game canvas.
 *
 * Visible to all:
 *   - Lames pioche (face-down, click to draw into hand)
 *   - Lames défausse (last discarded card face-up, click to view / GM reshuffle)
 *
 * GM only:
 *   - Arcanes pioche (face-down, click to draw → assign to player or rivière)
 *   - Arcanes défausse (last discarded card face-up, click to view / GM reshuffle)
 */

import TarotManager from "./TarotManager.mjs";
import { LAMES } from "../helpers/config.mjs";

export default class PilesOverlay {

  static _container = null;

  static init() {
    const el = document.createElement("div");
    el.id = "piles-overlay";
    el.classList.add("piles-overlay");
    document.body.appendChild(el);
    this._container = el;

    // Delegated click handling
    el.addEventListener("click", (ev) => {
      const pile = ev.target.closest("[data-pile-action]");
      if (!pile) return;
      const action = pile.dataset.pileAction;
      if (action === "pioche-lames") this._onPiocheLames();
      else if (action === "defausse-lames") this._onDefausseLames();
      else if (action === "pioche-arcanes") this._onPiocheArcanes();
      else if (action === "defausse-arcanes") this._onDefausseArcanes();
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

    const dos = LAMES.tarot.dos;
    const loc = (key) => game.i18n.localize(key);

    // Lames discard — last card
    const lamesDefLast = state.lames.defausse.length
      ? mgr.getCard(state.lames.defausse[state.lames.defausse.length - 1])
      : null;

    // Arcanes discard — last card
    const arcanesDefLast = state.arcanes.defausse.length
      ? mgr.getCard(state.arcanes.defausse[state.arcanes.defausse.length - 1])
      : null;

    // --- Lames piles (visible to all) ---
    const lamesHtml = `
      <div class="pile-group pile-group-lames">
        <div class="pile-stack" data-pile-action="pioche-lames" title="${loc("LAMES.Tarot.piocher")}">
          <img src="${dos}" alt="${loc("LAMES.Tarot.pioche")}" class="pile-card-img" />
          <span class="pile-count">${state.lames.pioche.length}</span>
          <span class="pile-label">${loc("LAMES.Tarot.pioche")}</span>
        </div>
        <div class="pile-stack pile-defausse ${lamesDefLast ? "" : "pile-empty"}" data-pile-action="defausse-lames" title="${loc("LAMES.Tarot.defausse")}">
          ${lamesDefLast
            ? `<img src="${lamesDefLast.img}" alt="${lamesDefLast.label}" class="pile-card-img" />`
            : `<div class="pile-placeholder"><i class="fa-solid fa-layer-group"></i></div>`
          }
          <span class="pile-count">${state.lames.defausse.length}</span>
          <span class="pile-label">${loc("LAMES.Tarot.defausse")}</span>
        </div>
      </div>
    `;

    // --- Arcanes piles (GM only) ---
    let arcanesHtml = "";
    if (game.user.isGM) {
      arcanesHtml = `
        <div class="pile-group pile-group-arcanes">
          <div class="pile-stack pile-small" data-pile-action="pioche-arcanes" title="${loc("LAMES.Tarot.piocher")}">
            <img src="${dos}" alt="${loc("LAMES.Tarot.pioche")}" class="pile-card-img" />
            <span class="pile-count">${state.arcanes.pioche.length}</span>
            <span class="pile-label">${loc("LAMES.Tarot.paquetArcanes")}</span>
          </div>
          <div class="pile-stack pile-small pile-defausse ${arcanesDefLast ? "" : "pile-empty"}" data-pile-action="defausse-arcanes" title="${loc("LAMES.Tarot.defausse")}">
            ${arcanesDefLast
              ? `<img src="${arcanesDefLast.img}" alt="${arcanesDefLast.label}" class="pile-card-img" />`
              : `<div class="pile-placeholder"><i class="fa-solid fa-star"></i></div>`
            }
            <span class="pile-count">${state.arcanes.defausse.length}</span>
            <span class="pile-label">${loc("LAMES.Tarot.defausse")}</span>
          </div>
        </div>
      `;
    }

    container.innerHTML = lamesHtml + arcanesHtml;
  }

  /* -------------------------------------------------- */
  /*  Pioche Lames — any user draws 1 card              */
  /* -------------------------------------------------- */

  static async _onPiocheLames() {
    const mgr = TarotManager.getInstance();
    const loc = (key) => game.i18n.localize(key);
    const cards = await mgr.piocherLameEnMain(game.user.id, 1);
    if (!cards.length) {
      ui.notifications.warn(loc("LAMES.Tarot.piocheVide"));
      return;
    }

    const card = cards[0];

    // If an arcane was drawn from the Lames deck → automatic play + alert + lose 1 ténacité
    if (card.type === "arcane") {
      // Play the card (sends arcane to arcanes defausse)
      await mgr.jouerCarte(game.user.id, card.id);

      const arcInfo = LAMES.arcaneParNumero.get(card.valeur);
      const arcName = arcInfo ? `${arcInfo.numero} — ${arcInfo.nom}` : card.label;
      const actor = game.user.character;
      const speakerName = actor?.name ?? game.user.name;

      // Spend 1 ténacité
      let tenaciteMsg = "";
      if (actor) {
        const system = actor.system;
        if (system.tenacite > 0) {
          const epee = foundry.utils.deepClone(system.epee);
          const idx = epee.indexOf("vierge");
          if (idx >= 0) {
            epee[idx] = "cochee";
            await actor.update({ "system.epee": epee });
          }
          tenaciteMsg = `<p class="tenacite-cost">-1 ${loc("LAMES.Epee.tenacite")} (${loc("LAMES.Tarot.reste")} : ${system.tenacite - 1})</p>`;
        }
      }

      await ChatMessage.create({
        content: `
          <div class="lames-roll lames-arcane-alert">
            <h3><i class="fa-solid fa-bolt"></i> ${loc("LAMES.Tarot.arcanePiochee")}</h3>
            <div class="tarot-card-display">
              <img src="${card.img}" alt="${card.label}" class="tarot-card-img" />
              <div class="tarot-card-info">
                <span class="card-label">${arcName}</span>
                <span class="card-signe arcane-warning">${loc("LAMES.Tarot.arcaneGrave")}</span>
              </div>
            </div>
            <p><strong>${speakerName}</strong> ${loc("LAMES.Tarot.arcanePiocheeDesc")}</p>
            ${tenaciteMsg}
          </div>`,
        speaker: ChatMessage.getSpeaker({ actor })
      });

      ui.notifications.warn(`${loc("LAMES.Tarot.arcanePiochee")} : ${arcName}`);
      return;
    }

    ui.notifications.info(`${loc("LAMES.Tarot.cartePiochee")} : ${card.label}`);
  }

  /* -------------------------------------------------- */
  /*  Défausse Lames — view or GM reshuffle             */
  /* -------------------------------------------------- */

  static async _onDefausseLames() {
    const mgr = TarotManager.getInstance();
    const state = mgr.state;

    if (game.user.isGM) {
      // GM gets reshuffle options
      const choice = await Dialog.wait({
        title: game.i18n.localize("LAMES.Tarot.defausse"),
        content: this._buildDefausseViewHtml(state.lames.defausse, mgr),
        buttons: {
          melangerDefausse: {
            label: `<i class="fa-solid fa-shuffle"></i> ${game.i18n.localize("LAMES.Tarot.melangerDefausse")}`,
            callback: () => "melangerDefausse"
          },
          melangerToutes: {
            label: `<i class="fa-solid fa-arrows-rotate"></i> ${game.i18n.localize("LAMES.Tarot.melangerToutes")}`,
            callback: () => "melangerToutes"
          },
          fermer: {
            label: game.i18n.localize("LAMES.Divers.non"),
            callback: () => null
          }
        },
        default: "fermer"
      });

      if (choice === "melangerDefausse") {
        await mgr.remelangeLames();
        ui.notifications.info("Défausse des Lames mélangée dans la pioche.");
      } else if (choice === "melangerToutes") {
        await mgr.rappelerToutesLames();
        ui.notifications.info("Toutes les Lames rappelées et mélangées.");
      }
    } else {
      // Player just views the discard
      if (!state.lames.defausse.length) {
        ui.notifications.info("La défausse des Lames est vide.");
        return;
      }
      Dialog.prompt({
        title: game.i18n.localize("LAMES.Tarot.defausse"),
        content: this._buildDefausseViewHtml(state.lames.defausse, mgr),
        label: "OK"
      });
    }
  }

  /* -------------------------------------------------- */
  /*  Pioche Arcanes — GM draws and assigns             */
  /* -------------------------------------------------- */

  static async _onPiocheArcanes() {
    if (!game.user.isGM) return;

    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state.arcanes.pioche.length) {
      ui.notifications.warn("La pioche des Arcanes est vide !");
      return;
    }

    // Build player options + rivière option
    const players = game.users.filter(u => !u.isGM && u.active);
    const playerOptions = players.map(p =>
      `<option value="player:${p.id}">${p.name}</option>`
    ).join("");

    const content = `
      <div class="form-group">
        <label>${game.i18n.localize("LAMES.Tarot.donnerA")}</label>
        <select id="arcane-dest-select">
          <option value="riviere"><i class="fa-solid fa-water"></i> ${game.i18n.localize("LAMES.Tarot.riviere")}</option>
          ${playerOptions}
        </select>
      </div>
    `;

    const dest = await Dialog.wait({
      title: game.i18n.localize("LAMES.Tarot.paquetArcanes"),
      content,
      buttons: {
        ok: {
          label: game.i18n.localize("LAMES.Tarot.piocher"),
          callback: (html) => (html[0] ?? html).querySelector("#arcane-dest-select").value
        },
        cancel: {
          label: game.i18n.localize("LAMES.Divers.non"),
          callback: () => null
        }
      },
      default: "ok"
    });

    if (!dest) return;

    if (dest === "riviere") {
      // Draw and add to rivière
      const cards = await mgr.piocherArcanes(1);
      if (!cards.length) return;
      await mgr.ajouterRiviere(cards[0].id);
      ui.notifications.info(`Arcane ajouté à la rivière : ${cards[0].label}`);
    } else if (dest.startsWith("player:")) {
      const userId = dest.replace("player:", "");
      const card = await mgr.ajouterArcaneEphemere(userId);
      if (!card) {
        ui.notifications.warn(game.i18n.localize("LAMES.Tarot.ephMaxAtteint"));
        return;
      }
      const player = game.users.get(userId);
      ui.notifications.info(`${game.i18n.localize("LAMES.Tarot.arcaneEphemere")} → ${player.name} : ${card.label}`);
    }
  }

  /* -------------------------------------------------- */
  /*  Défausse Arcanes — GM view / reshuffle            */
  /* -------------------------------------------------- */

  static async _onDefausseArcanes() {
    if (!game.user.isGM) return;

    const mgr = TarotManager.getInstance();
    const state = mgr.state;

    const choice = await Dialog.wait({
      title: `${game.i18n.localize("LAMES.Tarot.defausse")} — ${game.i18n.localize("LAMES.Tarot.paquetArcanes")}`,
      content: this._buildDefausseViewHtml(state.arcanes.defausse, mgr),
      buttons: {
        remelanger: {
          label: `<i class="fa-solid fa-shuffle"></i> ${game.i18n.localize("LAMES.Tarot.remelanger")}`,
          callback: () => "remelanger"
        },
        fermer: {
          label: game.i18n.localize("LAMES.Divers.non"),
          callback: () => null
        }
      },
      default: "fermer"
    });

    if (choice === "remelanger") {
      await mgr.remelangeArcanes();
      ui.notifications.info("Arcanes remélangés (rivière vidée).");
    }
  }

  /* -------------------------------------------------- */
  /*  Helpers                                           */
  /* -------------------------------------------------- */

  /**
   * Build HTML showing all cards in a discard pile.
   */
  static _buildDefausseViewHtml(defausseIds, mgr) {
    if (!defausseIds.length) {
      return `<p><em>${game.i18n.localize("LAMES.Tarot.defausse")} : vide</em></p>`;
    }
    const items = defausseIds.map(id => {
      const c = mgr.getCard(id);
      return c ? `<li>${c.label}</li>` : "";
    }).join("");
    return `<ul class="piles-defausse-list">${items}</ul>`;
  }
}
