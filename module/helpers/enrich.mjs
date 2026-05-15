/**
 * Wrapper autour de TextEditor.enrichHTML — gère la nullish-coalescence et
 * réduit la verbosité du chemin complet `foundry.applications.ux.TextEditor.implementation.enrichHTML`
 * répété dans toutes les sheets.
 */
export function enrich(value) {
  return foundry.applications.ux.TextEditor.implementation.enrichHTML(value ?? "", { async: true });
}
