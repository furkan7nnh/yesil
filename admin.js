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
