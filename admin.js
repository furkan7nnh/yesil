const ADMIN_PASSWORD = "yeşil75";

const menuButton = document.getElementById("menuButton");
const menuDropdown = document.getElementById("menuDropdown");
const logoutAdminButton = document.getElementById("logoutAdmin");

const adminPanel = document.getElementById("adminPanel");
const adminQuickForm = document.getElementById("adminQuickForm");
const adminImageUrlInput = document.getElementById("adminImageUrl");
const adminImageFileInput = document.getElementById("adminImageFile");
const adminTitleInput = document.getElementById("adminTitle");
const adminDescriptionInput = document.getElementById("adminDescription");
const adminCategoryInput = document.getElementById("adminCategory");
const adminMessage = document.getElementById("adminMessage");
const adminDeleteMediaButton = document.getElementById("adminDeleteMediaButton");
const adminPostsList = document.getElementById("adminPostsList");
const adminRefreshPostsButton = document.getElementById("adminRefreshPostsButton");

const adminLoginModal = document.getElementById("adminLoginModal");
const adminLoginForm = document.getElementById("adminLoginForm");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminLoginError = document.getElementById("adminLoginError");

const fallbackImage =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80";

const allowedCategories = new Set([
  "AT HIRSIZI MIRAC",
  "PARCALA YILMAZ",
  "MASKE UFUK",
  "NESINE TURGUT",
]);
const defaultCategory = "AT HIRSIZI MIRAC";

let cards = [];

adminPanel.hidden = true;
adminLoginModal.hidden = false;
setTimeout(() => {
  adminPasswordInput.focus();
}, 0);

menuButton.addEventListener("click", () => {
  if (menuDropdown.hidden) {
    menuDropdown.hidden = false;
    menuButton.setAttribute("aria-expanded", "true");
    return;
  }

  closeMenu();
});

document.addEventListener("click", (event) => {
  if (!menuDropdown.hidden) {
    const clickedInsideMenu =
      menuDropdown.contains(event.target) || menuButton.contains(event.target);

    if (!clickedInsideMenu) {
      closeMenu();
    }
  }
});

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = normalizePassword(adminPasswordInput.value);

  if (password !== normalizePassword(ADMIN_PASSWORD)) {
    adminLoginError.textContent = "YANLIŞ GİRDİN MAL";
    return;
  }

  adminLoginError.textContent = "";
  adminLoginModal.hidden = true;
  adminPanel.hidden = false;
  adminMessage.textContent = "Admin paneli acildi.";
  refreshAdminPosts();
});

logoutAdminButton.addEventListener("click", () => {
  adminQuickForm.reset();
  adminCategoryInput.value = defaultCategory;
  adminMessage.textContent = "Admin panelinden cikis yapildi.";
  window.location.href = "/";
});

adminQuickForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminMessage.textContent = "";

  const title = adminTitleInput.value.trim();
  const description = adminDescriptionInput.value.trim();
  const category = normalizeCategory(adminCategoryInput.value);

  if (!title || !description) {
    adminMessage.textContent = "Baslik ve bilgi zorunlu.";
    return;
  }

  const selectedFile = adminImageFileInput.files[0] || null;
  const mediaFromFile = selectedFile ? await fileToDataUrl(selectedFile) : "";
  const mediaFromUrl = adminImageUrlInput.value.trim();
  const media = mediaFromFile || mediaFromUrl || fallbackImage;
  const mediaType = detectMediaType({
    source: media,
    mimeType: selectedFile ? selectedFile.type : "",
  });

  await loadCards();
  cards.unshift({
    id: crypto.randomUUID(),
    image: media,
    mediaType,
    title,
    description,
    category,
    createdAt: Date.now(),
  });

  await saveCards();
  renderAdminCards();
  adminQuickForm.reset();
  adminCategoryInput.value = defaultCategory;
  adminMessage.textContent = "Hizli kart eklendi.";
  renderAdminPosts();
});

adminDeleteMediaButton?.addEventListener("click", async () => {
  const confirmed = window.confirm(
    "Tum fotograf ve videolari silmek istiyor musun? Bu islem geri alinmaz."
  );

  if (!confirmed) {
    return;
  }

  adminMessage.textContent = "Medyalar siliniyor...";

  await loadCards();
  const originalCount = cards.length;
  cards = cards.filter((card) => !hasRemovableMedia(card));

  if (cards.length === originalCount) {
    adminMessage.textContent = "Silinecek fotograf veya video bulunamadi.";
    return;
  }

  const response = await saveCards();
  if (!response.ok) {
    adminMessage.textContent = "Silme islemi basarisiz oldu. Tekrar dene.";
    return;
  }

  const removedCount = originalCount - cards.length;
  adminMessage.textContent = `${removedCount} medya kaydi silindi.`;
  renderAdminPosts();
});

adminRefreshPostsButton?.addEventListener("click", async () => {
  await refreshAdminPosts();
  adminMessage.textContent = "Gonderi listesi yenilendi.";
});

adminDescriptionInput.addEventListener("keydown", (event) => {
  if (event.ctrlKey && event.key === "Enter") {
    adminQuickForm.requestSubmit();
  }
});

function closeMenu() {
  menuDropdown.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
}

async function loadCards() {
  try {
    const response = await fetch("/api/cards");
    cards = response.ok ? await response.json() : [];
  } catch {
    cards = [];
  }
  renderAdminCards();
}

function renderAdminCards() {
  const list = document.getElementById("adminCardList");
  if (!list) return;
  list.innerHTML = "";

  if (!cards.length) {
    list.innerHTML = "<p class='no-cards-msg'>Henuz kart yok.</p>";
    return;
  }

  for (const card of cards) {
    const item = document.createElement("div");
    item.className = "admin-card-item";

    const thumb = document.createElement("div");
    thumb.className = "admin-card-thumb";
    const mediaType = detectMediaType({ source: card.image, mimeType: card.mediaType || "" });
    if (mediaType === "video") {
      const vid = document.createElement("video");
      vid.src = card.image;
      vid.className = "admin-thumb-media";
      vid.muted = true;
      vid.preload = "metadata";
      thumb.appendChild(vid);
    } else {
      const img = document.createElement("img");
      img.src = card.image;
      img.alt = card.title;
      img.className = "admin-thumb-media";
      img.addEventListener("error", () => { img.src = fallbackImage; });
      thumb.appendChild(img);
    }

    const info = document.createElement("div");
    info.className = "admin-card-info";
    info.innerHTML = `<span class="admin-card-cat">${card.category}</span><span class="admin-card-title">${card.title}</span>`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "delete-btn";
    delBtn.textContent = "Sil";
    delBtn.setAttribute("aria-label", `${card.title} kartini sil`);
    delBtn.addEventListener("click", async () => {
      if (!confirm(`"${card.title}" kartini silmek istediginize emin misiniz?`)) return;
      cards = cards.filter((c) => c.id !== card.id);
      await saveCards();
      renderAdminCards();
      adminMessage.textContent = `"${card.title}" silindi.`;
    });

    item.appendChild(thumb);
    item.appendChild(info);
    item.appendChild(delBtn);
    list.appendChild(item);
  }
}

function saveCards() {
  return fetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cards),
  });
}

function normalizeCategory(category) {
  return allowedCategories.has(category) ? category : defaultCategory;
}

function normalizePassword(value) {
  return String(value)
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function detectMediaType({ source, mimeType }) {
  const loweredMime = String(mimeType).toLowerCase();
  if (loweredMime.startsWith("video/")) {
    return "video";
  }

  const loweredSource = String(source).toLowerCase();
  if (loweredSource.startsWith("data:video/")) {
    return "video";
  }

  if (/(\.mp4|\.webm|\.ogg|\.mov|\.m4v)(\?|#|$)/.test(loweredSource)) {
    return "video";
  }

  return "image";
}

function hasRemovableMedia(card) {
  const mediaType = String(card?.mediaType || "").toLowerCase();
  if (mediaType === "image" || mediaType === "video") {
    return true;
  }

  const source = String(card?.image || card?.media || "").trim();
  if (!source) {
    return false;
  }

  return detectMediaType({ source, mimeType: "" }) === "image" || detectMediaType({ source, mimeType: "" }) === "video";
}

async function refreshAdminPosts() {
  await loadCards();
  renderAdminPosts();
}

function renderAdminPosts() {
  if (!adminPostsList) {
    return;
  }

  adminPostsList.innerHTML = "";

  if (!cards.length) {
    const empty = document.createElement("p");
    empty.className = "admin-posts-empty";
    empty.textContent = "Henuz paylasilan gonderi yok.";
    adminPostsList.appendChild(empty);
    return;
  }

  for (const card of cards) {
    const row = document.createElement("article");
    row.className = "admin-post-row";

    const info = document.createElement("div");
    info.className = "admin-post-info";

    const title = document.createElement("h4");
    title.className = "admin-post-title";
    title.textContent = card.title || "Basliksiz";

    const meta = document.createElement("p");
    meta.className = "admin-post-meta";
    const mediaLabel = detectMediaType({
      source: card.image || "",
      mimeType: card.mediaType || "",
    }) === "video" ? "Video" : "Fotograf";
    meta.textContent = `${card.category || "Kategori yok"} - ${mediaLabel}`;

    info.appendChild(title);
    info.appendChild(meta);

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "danger-button admin-post-delete-button";
    removeButton.textContent = "Gonderiyi Sil";
    removeButton.addEventListener("click", async () => {
      await removeAdminPost(card);
    });

    row.appendChild(info);
    row.appendChild(removeButton);
    adminPostsList.appendChild(row);
  }
}

async function removeAdminPost(targetCard) {
  const confirmed = window.confirm(
    `"${targetCard?.title || "Bu"}" gonderisini silmek istiyor musun?`
  );
  if (!confirmed) {
    return;
  }

  await loadCards();
  const index = cards.findIndex((card) => card.id && targetCard.id && card.id === targetCard.id);
  const fallbackIndex = index >= 0 ? index : cards.indexOf(targetCard);

  if (fallbackIndex < 0) {
    adminMessage.textContent = "Gonderi bulunamadi. Listeyi yenileyip tekrar dene.";
    return;
  }

  cards.splice(fallbackIndex, 1);
  const response = await saveCards();
  if (!response.ok) {
    adminMessage.textContent = "Gonderi silinemedi. Tekrar dene.";
    return;
  }

  adminMessage.textContent = "Gonderi silindi.";
  renderAdminPosts();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadi"));
    reader.readAsDataURL(file);
  });
}
