import { openAvatarPicker } from "../helpers/avatar-picker.mjs";
import { enrich } from "../helpers/enrich.mjs";

const { ActorSheetV2, ItemSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * Base actor sheet — factorise le titre et le listener avatar.
 */
export class LamesActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  get title() {
    return this.document.name;
  }

  /** @override */
  async _onRender(context, options) {
    await super._onRender(context, options);

    const avatar = this.element.querySelector(".profile-img");
    if (avatar) {
      avatar.addEventListener("click", (event) => {
        event.preventDefault();
        openAvatarPicker(this.actor);
      });
    }
  }
}

/**
 * Base item sheet — factorise le titre et le squelette de _prepareContext
 * commun à toutes les fiches d'item (item, system, isFromCompendium, descriptionEnriched).
 */
export class LamesItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {

  get title() {
    return this.document.name;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.isFromCompendium = !!(this.item.pack || this.item._stats?.compendiumSource);
    context.descriptionEnriched = await enrich(this.item.system.description);
    return context;
  }
}
