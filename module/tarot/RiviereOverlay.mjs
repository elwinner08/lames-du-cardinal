/**
 * RiviereOverlay — Persistent HUD showing the Rivière Draconique
 * at the top of the game screen. Updates live via the lames.tarotChanged hook.
 */

import TarotManager from "./TarotManager.mjs";
import { LAMES } from "../helpers/config.mjs";

export default class RiviereOverlay {

  static _container = null;

  /**
   * Inject the overlay into the DOM and start listening for tarot changes.
   * Call once from the "ready" hook.
   */
  static init() {
    const el = document.createElement("div");
    el.id = "riviere-overlay";
    el.classList.add("riviere-overlay");
    document.body.appendChild(el);
    this._container = el;

    // Bind events (delegated)
    el.addEventListener("click", (ev) => {
      const resetBtn = ev.target.closest(".riviere-hud-reset");
      if (resetBtn) this._onResetRiviere();
    });

    // Initial render + listen for changes
    this.refresh();
    Hooks.on("lames.tarotChanged", () => this.refresh());
  }

  /**
   * GM action: clear the rivière (all arcanes go back to defausse).
   */
  static async _onResetRiviere() {
    if (!game.user.isGM) return;
    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state?.riviere.length) return;

    const confirm = await Dialog.wait({
      title: game.i18n.localize("LAMES.Tarot.riviere"),
      content: `<p>${game.i18n.localize("LAMES.Tarot.reinitialiserRiviere")}</p>`,
      buttons: {
        oui: { label: game.i18n.localize("LAMES.Divers.oui"), callback: () => true },
        non: { label: game.i18n.localize("LAMES.Divers.non"), callback: () => false }
      },
      default: "non"
    });
    if (!confirm) return;

    // Remove each card from rivière (sends to defausse)
    const ids = [...state.riviere];
    for (const id of ids) {
      await mgr.retirerRiviere(id);
    }
  }

  /**
   * Rebuild the overlay HTML from current tarot state.
   */
  static refresh() {
    const container = this._container;
    if (!container) return;

    const mgr = TarotManager.getInstance();
    const state = mgr.state;
    if (!state || !state.riviere.length) {
      container.innerHTML = "";
      container.classList.remove("visible");
      return;
    }

    // Enrich rivière cards with arcane details
    const cards = state.riviere.map(id => {
      const card = mgr.getCard(id);
      if (!card) return null;
      const info = LAMES.arcaneParNumero.get(card.valeur);
      if (!info) return { ...card, nom: "?", vd: "", meteo: "", comp: "" };
      return {
        ...card,
        nom: info.nom ?? "",
        vd: info.vd ?? "",
        meteo: info.meteo ?? "",
        comp: info.comp ? game.i18n.localize(`LAMES.Competences.${info.comp}`) : ""
      };
    }).filter(Boolean);

    if (!cards.length) {
      container.innerHTML = "";
      container.classList.remove("visible");
      return;
    }

    const cardsHtml = cards.map(c => `
      <div class="riviere-hud-card">
        <img src="${c.img}" alt="${c.nom}" class="riviere-hud-img" />
        <div class="riviere-hud-tooltip">
          <div class="riviere-hud-name">${c.nom}</div>
          <div class="riviere-hud-row"><i class="fa-solid fa-dragon"></i> <strong>${game.i18n.localize("LAMES.Arcanes.valeurDraconique")}</strong> : ${c.vd}</div>
          <div class="riviere-hud-row"><i class="fa-solid fa-cloud-bolt"></i> <strong>${game.i18n.localize("LAMES.Arcanes.meteorologie")}</strong> : ${c.meteo}</div>
          <div class="riviere-hud-row"><i class="fa-solid fa-book"></i> <strong>${game.i18n.localize("LAMES.Arcanes.competenceAssociee")}</strong> : ${c.comp}</div>
        </div>
      </div>
    `).join("");

    // GM reset button
    const resetBtn = game.user.isGM ? `
      <button type="button" class="riviere-hud-reset" title="${game.i18n.localize("LAMES.Tarot.reinitialiserRiviere")}">
        <i class="fa-solid fa-cards fa-spin"></i>
      </button>
    ` : "";

    container.innerHTML = `
      <div class="riviere-hud-label">
        <i class="fa-solid fa-water"></i> ${game.i18n.localize("LAMES.Tarot.riviere")}
      </div>
      <div class="riviere-hud-cards">${cardsHtml}</div>
      ${resetBtn}
    `;
    container.classList.add("visible");
  }
}
