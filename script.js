const menuButton = document.getElementById("menuButton");
const menuDropdown = document.getElementById("menuDropdown");
const goHomeButton = document.getElementById("goHome");

const searchInput = document.getElementById("searchInput");
const filterCategoryInput = document.getElementById("filterCategory");
const gallery = document.getElementById("gallery");
const cardTemplate = document.getElementById("cardTemplate");

const fallbackImage =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80";

const filters = {
  query: "",
  category: "all",
};

let cards = [];

init();
closeMenu();

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

goHomeButton.addEventListener("click", () => {
  closeMenu();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

searchInput.addEventListener("input", () => {
  filters.query = searchInput.value.trim().toLowerCase();
  renderCards();
});

filterCategoryInput.addEventListener("change", () => {
  filters.category = filterCategoryInput.value;
  renderCards();
});

async function init() {
  cards = await loadCards();
  renderCards();
}

function closeMenu() {
  menuDropdown.hidden = true;
  menuButton.setAttribute("aria-expanded", "false");
}

async function loadCards() {
  try {
    const response = await fetch("/api/cards");
    return response.ok ? await response.json() : [];
  } catch {
    return [];
  }
}

function renderCards() {
  gallery.innerHTML = "";
  const visibleCards = getFilteredCards();

  if (!cards.length) {
    const empty = document.createElement("p");
    empty.textContent = "Henuz kart yok.";
    gallery.appendChild(empty);
    return;
  }

  if (!visibleCards.length) {
    const empty = document.createElement("p");
    empty.textContent = "Filtreye uygun kart bulunamadi.";
    gallery.appendChild(empty);
    return;
  }

  for (const card of visibleCards) {
    const node = cardTemplate.content.firstElementChild.cloneNode(true);
    const image = node.querySelector(".card-image");
    const category = node.querySelector(".card-category");
    const title = node.querySelector(".card-title");
    const description = node.querySelector(".card-description");
    const mediaType = detectMediaType({
      source: card.image,
      mimeType: card.mediaType || "",
    });

    if (mediaType === "video") {
      const video = document.createElement("video");
      video.className = "card-image";
      video.src = card.image;
      video.controls = true;
      video.preload = "metadata";
      video.playsInline = true;
      image.replaceWith(video);
    } else {
      image.src = card.image;
      image.alt = card.title;
      image.addEventListener("error", () => {
        image.src = fallbackImage;
      });
    }

    category.textContent = card.category;
    title.textContent = card.title;
    description.textContent = card.description;

    gallery.appendChild(node);
  }
}

function getFilteredCards() {
  return cards.filter((card) => {
    const matchesCategory =
      filters.category === "all" || card.category === filters.category;
    const haystack = `${card.title} ${card.description} ${card.category}`.toLowerCase();
    const matchesQuery = !filters.query || haystack.includes(filters.query);
    return matchesCategory && matchesQuery;
  });
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

