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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadi"));
    reader.readAsDataURL(file);
  });
}
