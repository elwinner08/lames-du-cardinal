/**
 * Met à jour system.categorie sur chaque profil du compendium
 * `lames-du-cardinal.profils` en se basant sur un mapping nom → catégorie.
 *
 * À lancer une fois depuis la console : `CONFIG.LAMES.setProfilCategories()`
 * Le compendium est déverrouillé/reverrouillé automatiquement.
 */
export async function setProfilCategories() {
  const pack = game.packs.get("lames-du-cardinal.profils");
  if (!pack) {
    ui.notifications.error("Pack lames-du-cardinal.profils introuvable.");
    return;
  }

  const mapping = {
    combattant: ["mousquetaire", "fine lame", "fine-lame", "cavalier", "forban", "officier", "soldat"],
    courtisan: ["noble", "conseiller", "courtisan", "diplomate", "espion", "libertin"],
    lettre:    ["artiste", "homme de lettres", "erudit", "medecin", "religieux", "savant"],
    roturier:  ["commercant", "commerçant", "artisan", "aventurier", "saltimbanque", "valet"]
  };

  const normalize = s => s.toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[-_]+/g, " ")
    .trim();

  const lookup = {};
  for (const [cat, names] of Object.entries(mapping)) {
    for (const n of names) lookup[normalize(n)] = cat;
  }

  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  const docs = await pack.getDocuments();
  const updated = [];
  const skipped = [];
  for (const doc of docs) {
    const cat = lookup[normalize(doc.name)];
    if (cat) {
      await doc.update({ "system.categorie": cat });
      updated.push(`${doc.name} → ${cat}`);
    } else {
      skipped.push(doc.name);
    }
  }

  if (wasLocked) await pack.configure({ locked: true });

  console.log("Lames du Cardinal | Profils mis à jour :", updated);
  if (skipped.length) console.warn("Lames du Cardinal | Profils non mappés :", skipped);
  ui.notifications.info(
    `${updated.length} profil(s) mis à jour` +
    (skipped.length ? ` — ${skipped.length} non mappé(s), cf. console.` : ".")
  );
}
