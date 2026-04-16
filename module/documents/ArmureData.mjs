/**
 * Data model for armor items.
 */
export default class ArmureData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      protection: new fields.NumberField({ initial: 1, min: 0, max: 10, integer: true }),
      complete: new fields.BooleanField({ initial: false }),
      equipe: new fields.BooleanField({ initial: false }),
      description: new fields.HTMLField({ initial: "" })
    };
  }
}
