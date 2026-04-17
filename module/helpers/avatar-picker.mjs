/**
 * Avatar picker dialog: drag-drop or native file browse to change actor portrait.
 * Uploads to `worlds/<worldId>/avatars/` and updates `actor.img`.
 */

const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
const { DialogV2 } = foundry.applications.api;

function avatarDir() {
  return `worlds/${game.world.id}/avatars`;
}

async function ensureDir(path) {
  try {
    await FilePickerImpl.browse("data", path);
  } catch {
    try {
      await FilePickerImpl.createDirectory("data", path);
    } catch (_e) {
      // Silent — upload will surface a clearer error if perms are missing.
    }
  }
}

async function uploadAndApply(actor, file, dialog) {
  if (!file || !file.type?.startsWith("image/")) {
    ui.notifications.warn(game.i18n.localize("LAMES.Avatar.fichierInvalide"));
    return;
  }
  if (!game.user.hasPermission("FILES_UPLOAD")) {
    ui.notifications.error(game.i18n.localize("LAMES.Avatar.pasDePermission"));
    return;
  }

  const dir = avatarDir();
  await ensureDir(dir);

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "png";
  const safeName = `${actor.id}-${Date.now()}.${ext}`;
  const renamed = new File([file], safeName, { type: file.type });

  const result = await FilePickerImpl.upload("data", dir, renamed, {}, { notify: false });
  if (!result?.path) {
    ui.notifications.error(game.i18n.localize("LAMES.Avatar.erreurUpload"));
    return;
  }

  await actor.update({ img: result.path });
  ui.notifications.info(game.i18n.localize("LAMES.Avatar.miseAJour"));
  dialog?.close();
}

export async function openAvatarPicker(actor) {
  if (!actor.isOwner) return;

  const loc = (k) => game.i18n.localize(k);

  const content = `
    <div class="lames-avatar-picker">
      <div class="avatar-current">
        <img src="${actor.img}" alt="${actor.name}" />
      </div>
      <div class="avatar-dropzone" data-role="dropzone">
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <p class="dz-main">${loc("LAMES.Avatar.deposez")}</p>
        <p class="dz-sub">${loc("LAMES.Avatar.ou")}</p>
        <button type="button" class="avatar-browse" data-role="browse">
          <i class="fa-solid fa-folder-open"></i> ${loc("LAMES.Avatar.parcourir")}
        </button>
        <input type="file" accept="image/*" data-role="file-input" style="display:none" />
      </div>
    </div>`;

  const dlg = new DialogV2({
    window: { title: loc("LAMES.Avatar.titre"), icon: "fa-solid fa-image-portrait" },
    content,
    buttons: [{
      action: "cancel",
      label: loc("LAMES.Divers.annuler"),
      default: true
    }],
    rejectClose: false
  });

  await dlg.render({ force: true });

  const root = dlg.element;
  const dropzone = root.querySelector("[data-role=dropzone]");
  const input = root.querySelector("[data-role=file-input]");
  const browse = root.querySelector("[data-role=browse]");

  browse.addEventListener("click", (e) => {
    e.preventDefault();
    input.click();
  });

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (file) await uploadAndApply(actor, file, dlg);
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("drag-over");
  });
  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("drag-over");
  });
  dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("drag-over");
    const file = e.dataTransfer?.files?.[0];
    if (file) await uploadAndApply(actor, file, dlg);
  });
}
