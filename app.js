const STORAGE_KEY = "mediaBioOS:v3";
const SESSION_OWNER_KEY = "mediaBioOS:owner";
const SESSION_VIEW_KEY = "mediaBioOS:viewed";
const SESSION_PIN_KEY = "mediaBioOS:pin";

const typeNames = {
  all: "Все",
  game: "Игры",
  movie: "Фильмы",
  series: "Сериалы",
  animation: "Мультфильмы",
  anime: "Аниме",
  book: "Книги",
  music: "Музыка",
  manga: "Манга",
  other: "Другое",
};

const fontOptions = [
  ["Inter, ui-sans-serif, system-ui, sans-serif", "Modern"],
  ["'Segoe UI', Tahoma, sans-serif", "Clean UI"],
  ["Georgia, 'Times New Roman', serif", "Editorial"],
  ["'Courier New', monospace", "Terminal"],
  ["Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif", "Poster"],
  ["Verdana, Geneva, sans-serif", "Wide"],
];

const starterState = {
  views: 0,
  profile: {
    siteTitle: "Ezkari Bio",
    name: "Ezkari",
    handle: "@ezkar.media",
    kicker: "personal media archive",
    bio: "**Личный каталог всего, что зацепило.**\nИгры, кино, сериалы, аниме и музыка, которые хочется сохранить не просто названием, а карточкой с настроением, оценкой и личным отзывом.",
    avatar: "https://media.giphy.com/media/xTiTnxpQ3ghPiB2Hp6/giphy.gif",
    cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1600&q=80",
    tags: "games, cinema, cyberpunk, anime",
    links: "Telegram:https://t.me/, Steam:https://store.steampowered.com/, Discord:https://discord.com/, Letterboxd:https://letterboxd.com/",
    musicLabel: "night drive autoplay",
    musicUrl: "",
    musicAutoplay: "true",
    brandIcon: "",
    ownerPin: "1991",
  },
  theme: {
    accent: "#9effd0",
    accent2: "#ff75c8",
    text: "#f7fbff",
    pageBg: "#05070d",
    cardTint: "#0d121c",
    lineTint: "#ffffff",
    background: "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1800&q=80",
    videoBg: "",
    font: "Inter, ui-sans-serif, system-ui, sans-serif",
    customFontName: "",
    cursor: "auto",
    cursorUrl: "",
    avatarShape: "10px",
    cardStyle: "poster",
    profileWidth: "380",
    cardMin: "260",
    glassOpacity: "58",
    blur: "28",
    radius: "10",
    backgroundDim: "58",
    saturation: "150",
    nameSize: "56",
  },
  items: [
    card("game", "Cyberpunk 2077", 2020, 9.4, "https://images.igdb.com/igdb/image/upload/t_cover_big/co7497.jpg", "rpg, neon, night city", "Грязный блеск, личные драмы и город, который ощущается живым.", "Metacritic 86", "RAWG 4.2", "https://www.metacritic.com/game/cyberpunk-2077/", "https://rawg.io/games/cyberpunk-2077"),
    card("movie", "Blade Runner 2049", 2017, 9.7, "https://image.tmdb.org/t/p/w780/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg", "sci-fi, noir, loneliness", "Медленное, холодное и невероятно красивое кино про память и одиночество.", "IMDb 8.0", "КП 7.8", "https://www.imdb.com/title/tt1856101/", "https://www.kinopoisk.ru/film/589290/"),
    card("series", "Arcane", 2021, 9.6, "https://image.tmdb.org/t/p/w780/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg", "animation, tragedy, sisters", "Каждая сцена выглядит как постер, а конфликт персонажей ощущается тяжелее любой битвы.", "IMDb 9.0", "КП 8.8", "https://www.imdb.com/title/tt11126994/", "https://www.kinopoisk.ru/series/4445150/"),
  ],
};

let state = normalizeState(loadStateLocal());
let ownerMode = sessionStorage.getItem(SESSION_OWNER_KEY) === "1";
let currentOwnerPin = sessionStorage.getItem(SESSION_PIN_KEY) || "";
let activeFilter = "all";
let activeSearch = "";
let catalogResults = [];
let serverAvailable = true;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function card(type, title, year, rating, poster, tags, comment, imdb, kp, imdbUrl, kpUrl) {
  return { id: randomId(), type, title, year, rating, poster, tags, status: "Любимое", comment, imdb, kp, imdbUrl, kpUrl, extraUrl: "", icon: "" };
}

function loadStateLocal() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || cloneState(starterState);
  } catch {
    return cloneState(starterState);
  }
}

async function loadStateFromServer() {
  try {
    const response = await fetch("/api/state");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && Object.keys(data).length > 0) return data;
    return null;
  } catch {
    serverAvailable = false;
    return null;
  }
}

function normalizeState(value) {
  return {
    ...cloneState(starterState),
    ...value,
    profile: { ...starterState.profile, ...(value.profile || {}) },
    theme: { ...starterState.theme, ...(value.theme || {}) },
    items: Array.isArray(value.items) ? value.items : cloneState(starterState.items),
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function publishState() {
  saveState();
  if (!serverAvailable || !currentOwnerPin) return;
  fetch("/api/state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Owner-Pin": currentOwnerPin,
    },
    body: JSON.stringify(state),
  }).catch(() => {
    serverAvailable = false;
  });
}

function randomId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function cloneState(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

async function countView() {
  if (!sessionStorage.getItem(SESSION_VIEW_KEY)) {
    sessionStorage.setItem(SESSION_VIEW_KEY, "1");
    try {
      const response = await fetch("/api/views", { method: "POST" });
      const data = await response.json();
      state.views = data.total;
      saveState();
      renderProfile();
      return;
    } catch {
      state.views = Number(state.views || 0) + 1;
      saveState();
    }
  } else {
    try {
      const response = await fetch("/api/views");
      const data = await response.json();
      state.views = data.total;
    } catch {
      /* static fallback */
    }
  }
}

function applyTheme() {
  const { theme, profile } = state;
  const opacity = Number(theme.glassOpacity || 58) / 100;
  const dim = Number(theme.backgroundDim || 58) / 100;
  document.title = profile.siteTitle || "Media Bio OS";
  document.body.classList.toggle("owner-mode", ownerMode);
  document.body.classList.toggle("card-compact", theme.cardStyle === "compact");
  document.body.classList.toggle("card-cinema", theme.cardStyle === "cinema");
  document.body.classList.toggle("card-minimal", theme.cardStyle === "minimal");
  setVar("--accent", theme.accent);
  setVar("--accent-2", theme.accent2);
  setVar("--text", theme.text);
  setVar("--page-bg", theme.pageBg);
  setVar("--card-tint", theme.cardTint);
  setVar("--line-tint", theme.lineTint);
  setVar("--profile-bg", theme.background ? `url("${theme.background}")` : "none");
  setVar("--cover", `url("${profile.cover}")`);
  setVar("--glass", `rgba(13, 18, 28, ${opacity})`);
  setVar("--blur", `${theme.blur}px`);
  setVar("--radius", `${theme.radius}px`);
  setVar("--avatar-radius", theme.avatarShape);
  setVar("--background-dim", String(dim));
  setVar("--saturation", `${theme.saturation}%`);
  setVar("--profile-width", `${theme.profileWidth}px`);
  setVar("--card-min", `${theme.cardMin}px`);
  setVar("--name-size", `${theme.nameSize}px`);
  setVar("--font", theme.customFontName ? `"${theme.customFontName}", ${theme.font}` : theme.font);
  setVar("--cursor", theme.cursor === "custom" && theme.cursorUrl ? `url("${theme.cursorUrl}") 16 16, crosshair` : theme.cursor);

  const video = $("#videoBackground");
  if (theme.videoBg) {
    if (video.src !== theme.videoBg) video.src = theme.videoBg;
    video.style.display = "block";
    video.play().catch(() => {});
  } else {
    video.removeAttribute("src");
    video.style.display = "none";
  }
}

function setVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function renderProfile() {
  const { profile } = state;
  $("#siteTitle").textContent = profile.siteTitle;
  $("#displayName").textContent = profile.name;
  $("#displayHandle").textContent = profile.handle;
  $("#profileKicker").textContent = profile.kicker;
  $("#displayBio").innerHTML = renderMarkdown(profile.bio);
  $("#avatarImage").src = profile.avatar;
  $("#viewCounter").textContent = `${state.views} просмотров`;
  $("#statViews").textContent = state.views;
  $("#modeBadge").textContent = ownerMode ? "Владелец" : "Посетитель";
  $("#ownerLoginBtn").textContent = ownerMode ? "Выйти из редактора" : "Войти как владелец";
  $("#brandIcon").innerHTML = profile.brandIcon ? `<img src="${escapeAttr(profile.brandIcon)}" alt="" />` : `<svg><use href="#i-bolt"></use></svg>`;
  $("#profileTags").innerHTML = splitList(profile.tags).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("");
  $("#socialRow").innerHTML = parseLinks(profile.links).map((link) => `<a href="${escapeAttr(link.href)}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a>`).join("");

  const musicBlock = $("#musicBlock");
  const audio = $("#bgAudio");
  if (profile.musicUrl) {
    musicBlock.style.display = "block";
    $("#musicLabel").textContent = profile.musicLabel || "Музыка профиля";
    if (audio.src !== profile.musicUrl) audio.src = profile.musicUrl;
    if (profile.musicAutoplay === "true") tryPlayAudio();
  } else {
    musicBlock.style.display = "none";
    audio.removeAttribute("src");
  }

  const ratings = state.items.map((item) => Number(item.rating)).filter(Number.isFinite);
  const avg = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  $("#statItems").textContent = state.items.length;
  $("#statRating").textContent = avg.toFixed(1);
}

function tryPlayAudio() {
  const audio = $("#bgAudio");
  audio.volume = 0.45;
  audio.play().catch(() => {
    const unlock = () => {
      audio.play().catch(() => {});
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
  });
}

function renderFilters() {
  $("#filterBar").innerHTML = Object.entries(typeNames)
    .map(([type, label]) => `<button class="filter ${activeFilter === type ? "active" : ""}" data-filter="${type}" type="button">${escapeHtml(label)}</button>`)
    .join("");
  $("#itemTypeSelect").innerHTML = Object.entries(typeNames)
    .filter(([type]) => type !== "all")
    .map(([type, label]) => `<option value="${type}">${escapeHtml(label)}</option>`)
    .join("");
}

function renderFontOptions() {
  const custom = state.theme.customFontName ? [[`"${state.theme.customFontName}", ${state.theme.font}`, `Загруженный: ${state.theme.customFontName}`]] : [];
  $("#fontSelect").innerHTML = [...custom, ...fontOptions]
    .map(([value, label]) => `<option value="${escapeAttr(value)}">${escapeHtml(label)}</option>`)
    .join("");
}

function filteredItems() {
  const query = activeSearch.trim().toLowerCase();
  return state.items.filter((item) => {
    const typeMatch = activeFilter === "all" || item.type === activeFilter;
    const text = `${item.title} ${item.year} ${item.tags} ${item.comment} ${item.status} ${typeNames[item.type]}`.toLowerCase();
    return typeMatch && (!query || text.includes(query));
  });
}

function renderSpotlight() {
  const sorted = [...state.items].sort((a, b) => Number(b.rating) - Number(a.rating));
  const lead = sorted[0];
  if (!lead) {
    $("#spotlightTitle").textContent = "Импортируй первую карточку";
    $("#spotlightText").textContent = "Открой каталог владельца, найди медиа и добавь карточку одной кнопкой.";
    $("#spotlightMeta").innerHTML = "";
    $("#heroStack").innerHTML = "";
    return;
  }
  $("#spotlightTitle").textContent = `${lead.title} — главный фаворит`;
  $("#spotlightText").textContent = lead.comment;
  $("#spotlightMeta").innerHTML = [`${typeNames[lead.type] || "Медиа"} · ${lead.year}`, `Оценка ${lead.rating}/10`, lead.status, ...splitList(lead.tags).slice(0, 3)]
    .map((meta) => `<span class="meta-chip">${escapeHtml(meta)}</span>`)
    .join("");
  $("#heroStack").innerHTML = sorted.slice(0, 3).map((item) => `<div class="stack-poster"><img src="${escapeAttr(item.poster)}" alt="" loading="lazy" /></div>`).join("");
}

function renderShelf() {
  const items = filteredItems();
  renderSpotlight();
  if (!items.length) {
    $("#shelf").innerHTML = `<div class="empty-state"><div><h3>Ничего не найдено</h3><p>Владелец может импортировать карточки из каталога, посетители только смотрят и ищут.</p></div></div>`;
    return;
  }
  $("#shelf").innerHTML = items.map(renderCard).join("");
}

function renderCard(item) {
  const reviews = [
    { label: item.imdb, url: item.imdbUrl },
    { label: item.kp, url: item.kpUrl },
    { label: "Источник", url: item.extraUrl },
  ].filter((review) => review.label || review.url);
  const icon = item.icon ? `<img src="${escapeAttr(item.icon)}" alt="" />` : `<svg><use href="#${typeIcon(item.type)}"></use></svg>`;
  return `
    <article class="media-card" style="--poster: url('${escapeAttr(item.poster)}')">
      <div class="card-inner">
        <div class="card-top">
          <span class="type-badge">${icon}${escapeHtml(typeNames[item.type] || "Медиа")} · ${escapeHtml(item.year || "")}</span>
          <span class="rating-badge">${escapeHtml(item.rating || "—")}</span>
        </div>
        <div class="card-copy">
          <div><p class="eyebrow">${escapeHtml(item.status || "В каталоге")}</p><h3>${escapeHtml(item.title)}</h3></div>
          <p>${escapeHtml(item.comment || "Пока без личного отзыва.")}</p>
          <div class="tag-row">${splitList(item.tags).slice(0, 5).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
          <div class="review-row">${reviews.map((review) => review.url ? `<a class="review-link" href="${escapeAttr(review.url)}" target="_blank" rel="noreferrer">${escapeHtml(review.label || "Открыть")}</a>` : `<span class="review-link">${escapeHtml(review.label)}</span>`).join("")}</div>
          <div class="card-actions owner-only"><button class="pill-button" data-edit="${escapeAttr(item.id)}" type="button">Редактировать</button></div>
        </div>
      </div>
    </article>
  `;
}

function typeIcon(type) {
  if (type === "music") return "i-music";
  if (type === "book") return "i-import";
  if (type === "game") return "i-bolt";
  return "i-import";
}

async function searchCatalog(query, type, targetSelector) {
  const output = $(targetSelector);
  if (!query.trim()) return;
  output.classList.add("has-results");
  output.innerHTML = `<div class="empty-state"><p>Ищу в публичных каталогах...</p></div>`;
  try {
    const groups = type === "multi" ? ["movie", "series", "anime", "book", "music", "game"] : [type];
    const results = (await Promise.all(groups.map((group) => searchSource(query, group)))).flat().slice(0, 36);
    catalogResults = results;
    output.innerHTML = renderCatalogResults(results);
  } catch (error) {
    output.innerHTML = `<div class="empty-state"><p>Не получилось получить каталог. Проверь интернет или попробуй другой запрос.</p></div>`;
  }
}

async function searchSource(query, type) {
  const encoded = encodeURIComponent(query);
  if (type === "series") {
    const data = await fetchJson(`https://api.tvmaze.com/search/shows?q=${encoded}`);
    return data.map((entry) => fromTvMaze(entry.show));
  }
  if (type === "anime") {
    const data = await fetchJson(`https://api.jikan.moe/v4/anime?q=${encoded}&limit=12`);
    return data.data.map(fromJikan);
  }
  if (type === "book") {
    const data = await fetchJson(`https://openlibrary.org/search.json?q=${encoded}&limit=12`);
    return data.docs.map(fromOpenLibrary);
  }
  if (type === "music") {
    const data = await fetchJson(`https://itunes.apple.com/search?term=${encoded}&media=music&limit=12`);
    return data.results.map((entry) => fromItunes(entry, "music"));
  }
  if (type === "movie") {
    const data = await fetchJson(`https://itunes.apple.com/search?term=${encoded}&media=movie&limit=12`);
    return data.results.map((entry) => fromItunes(entry, "movie"));
  }
  if (type === "game") {
    const cheap = await fetchJson(`https://www.cheapshark.com/api/1.0/games?title=${encoded}&limit=12`);
    return cheap.map(fromCheapShark);
  }
  return [];
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function fromTvMaze(show) {
  return importedCard("series", show.name, year(show.premiered), 8, show.image?.original || show.image?.medium || "", tags(show.genres), stripHtml(show.summary), `TVMaze ${show.rating?.average || "—"}`, "", show.url, "");
}

function fromJikan(entry) {
  return importedCard("anime", entry.title, entry.year || year(entry.aired?.from), entry.score || 8, entry.images?.jpg?.large_image_url || "", tags(entry.genres?.map((g) => g.name)), entry.synopsis || "", `MAL ${entry.score || "—"}`, "", entry.url, "");
}

function fromOpenLibrary(entry) {
  const cover = entry.cover_i ? `https://covers.openlibrary.org/b/id/${entry.cover_i}-L.jpg` : "";
  return importedCard("book", entry.title, entry.first_publish_year || "", 8, cover, tags([...(entry.subject || []).slice(0, 4), ...(entry.author_name || []).slice(0, 1)]), entry.first_sentence?.[0] || "Книга из OpenLibrary.", "OpenLibrary", "", `https://openlibrary.org${entry.key}`, "");
}

function fromItunes(entry, type) {
  const poster = (entry.artworkUrl100 || "").replace("100x100bb", "600x600bb");
  const name = entry.trackName || entry.collectionName || entry.artistName;
  return importedCard(type, name, year(entry.releaseDate), 8, poster, tags([entry.primaryGenreName, entry.artistName]), entry.longDescription || entry.shortDescription || entry.collectionName || "Импортировано из iTunes Search.", type === "movie" ? "iTunes Movie" : "iTunes Music", "", entry.trackViewUrl || entry.collectionViewUrl, "");
}

function fromCheapShark(entry) {
  return importedCard("game", entry.external, "", 8, entry.thumb || "", "game, store", `Найдена цена от $${entry.cheapest || "—"}.`, "CheapShark", "", `https://www.cheapshark.com/redirect?dealID=${entry.cheapestDealID || ""}`, "");
}

function importedCard(type, title, yearValue, rating, poster, tagList, comment, imdb, kp, imdbUrl, kpUrl) {
  return { id: randomId(), type, title, year: yearValue || "", rating, poster, tags: tagList, status: "В планах", comment: comment || "Добавлено из каталога. Напиши свой отзыв.", imdb, kp, imdbUrl, kpUrl, extraUrl: "", icon: "" };
}

function renderCatalogResults(results) {
  if (!results.length) return `<div class="empty-state"><p>Ничего не найдено.</p></div>`;
  return `<div class="external-results">${results
    .map((item, index) => `
      <article class="import-card">
        <img src="${escapeAttr(item.poster || "")}" alt="" loading="lazy" />
        <div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(typeNames[item.type] || item.type)} · ${escapeHtml(item.year || "год неизвестен")}</p></div>
        <p>${escapeHtml((item.comment || "").slice(0, 120))}</p>
        <button class="pill-button primary" data-import="${index}" type="button">Добавить карточку</button>
      </article>
    `)
    .join("")}</div>`;
}

function importCatalogItem(index) {
  const item = catalogResults[Number(index)];
  if (!item) return;
  state.items.unshift({ ...item, id: randomId() });
  updateAll();
  publishState();
}

function year(value) {
  return value ? String(value).slice(0, 4) : "";
}

function tags(value) {
  if (Array.isArray(value)) return value.filter(Boolean).slice(0, 6).join(", ");
  return value || "";
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]+>/g, "").trim();
}

function renderMarkdown(value) {
  const escaped = escapeHtml(value || "");
  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => {
      const html = paragraph
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.+?)\*/g, "<em>$1</em>")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
        .replace(/\n/g, "<br />");
      return `<p>${html}</p>`;
    })
    .join("");
}

function splitList(value) {
  return String(value || "").split(",").map((entry) => entry.trim()).filter(Boolean);
}

function parseLinks(value) {
  return splitList(value).map((entry) => {
    const divider = entry.indexOf(":");
    if (divider < 0) return { label: entry, href: "#" };
    return { label: entry.slice(0, divider).trim() || "Link", href: entry.slice(divider + 1).trim() || "#" };
  });
}

function fillForm(formId, values) {
  const form = $(`#${formId}`);
  Object.entries(values).forEach(([key, value]) => {
    if (form.elements[key]) form.elements[key].value = value ?? "";
  });
}

function fillItemForm(item = null) {
  const defaults = { id: "", type: "movie", title: "", year: new Date().getFullYear(), rating: 8, poster: "", tags: "", status: "Любимое", comment: "", imdb: "", kp: "", imdbUrl: "", kpUrl: "", extraUrl: "", icon: "" };
  $("#itemForm").reset();
  $("#deleteItem").style.visibility = item ? "visible" : "hidden";
  $("#itemModalTitle").textContent = item ? "Редактировать карточку" : "Новая карточка";
  fillForm("itemForm", item || defaults);
}

function updateAll() {
  applyTheme();
  renderFontOptions();
  renderFilters();
  renderProfile();
  renderShelf();
  saveState();
}

function openModal(id) {
  $(`#${id}`).classList.add("open");
  $(`#${id}`).setAttribute("aria-hidden", "false");
}

function closeModal(id) {
  $(`#${id}`).classList.remove("open");
  $(`#${id}`).setAttribute("aria-hidden", "true");
}

function requireOwner(action) {
  if (ownerMode) action();
  else openModal("loginModal");
}

function randomizeTheme() {
  const presets = [
    ["#9effd0", "#ff75c8", "#05070d", "https://images.unsplash.com/photo-1535223289827-42f1e9919769?auto=format&fit=crop&w=1800&q=80"],
    ["#ffd166", "#67e8f9", "#08050d", "https://images.unsplash.com/photo-1518709268805-4e9042af2176?auto=format&fit=crop&w=1800&q=80"],
    ["#fca5a5", "#a7f3d0", "#07080f", "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"],
  ];
  const [accent, accent2, pageBg, background] = presets[Math.floor(Math.random() * presets.length)];
  state.theme = { ...state.theme, accent, accent2, pageBg, background };
  updateAll();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setPath(path, value) {
  const [scope, key] = path.split(".");
  state[scope][key] = value;
  const forms = [$("#profileForm"), $("#themeForm"), $("#itemForm")];
  forms.forEach((form) => {
    if (form?.elements[key]) form.elements[key].value = value;
  });
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

$("#ownerLoginBtn").addEventListener("click", () => {
  if (ownerMode) {
    ownerMode = false;
    currentOwnerPin = "";
    sessionStorage.removeItem(SESSION_OWNER_KEY);
    sessionStorage.removeItem(SESSION_PIN_KEY);
    updateAll();
    return;
  }
  openModal("loginModal");
});

$("#loginForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = new FormData(event.currentTarget).get("pin");
  if (pin === state.profile.ownerPin) {
    ownerMode = true;
    currentOwnerPin = pin;
    sessionStorage.setItem(SESSION_OWNER_KEY, "1");
    sessionStorage.setItem(SESSION_PIN_KEY, pin);
    closeModal("loginModal");
    updateAll();
  } else {
    event.currentTarget.elements.pin.value = "";
    event.currentTarget.elements.pin.placeholder = "Неверный PIN";
  }
});

$("#openProfileEditor").addEventListener("click", () => requireOwner(() => { fillForm("profileForm", state.profile); openModal("profileModal"); }));
$("#openThemeEditor").addEventListener("click", () => requireOwner(() => { fillForm("themeForm", state.theme); openModal("themeModal"); }));
$("#openItemEditor").addEventListener("click", () => requireOwner(() => { fillItemForm(); openModal("itemModal"); }));
$("#openCatalogModal").addEventListener("click", () => requireOwner(() => openModal("catalogModal")));
$("#randomThemeBtn").addEventListener("click", () => requireOwner(randomizeTheme));
$("#applyPreset").addEventListener("click", randomizeTheme);

$("#resetDemo").addEventListener("click", () => {
  state = cloneState(starterState);
  ownerMode = true;
  currentOwnerPin = state.profile.ownerPin;
  sessionStorage.setItem(SESSION_OWNER_KEY, "1");
  sessionStorage.setItem(SESSION_PIN_KEY, currentOwnerPin);
  updateAll();
  publishState();
  fillForm("profileForm", state.profile);
});

$("#profileForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.profile = Object.fromEntries(new FormData(event.currentTarget).entries());
  updateAll();
  publishState();
  closeModal("profileModal");
});

$("#themeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  state.theme = { ...state.theme, ...Object.fromEntries(new FormData(event.currentTarget).entries()) };
  updateAll();
  publishState();
  closeModal("themeModal");
});

$("#itemForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget).entries());
  const item = { ...data, id: data.id || randomId(), year: data.year, rating: Number(data.rating) };
  const index = state.items.findIndex((entry) => entry.id === item.id);
  if (index >= 0) state.items[index] = item;
  else state.items.unshift(item);
  updateAll();
  publishState();
  closeModal("itemModal");
});

$("#deleteItem").addEventListener("click", () => {
  const id = $("#itemForm").elements.id.value;
  state.items = state.items.filter((item) => item.id !== id);
  updateAll();
  publishState();
  closeModal("itemModal");
});

$("#searchInput").addEventListener("input", (event) => {
  activeSearch = event.target.value;
  renderShelf();
});

$("#quickImportBtn").addEventListener("click", () => searchCatalog($("#quickImportInput").value, $("#quickImportType").value, "#catalogResults"));
$("#quickImportInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchCatalog($("#quickImportInput").value, $("#quickImportType").value, "#catalogResults");
});
$("#catalogSearchBtn").addEventListener("click", () => searchCatalog($("#catalogQuery").value, $("#catalogType").value, "#modalCatalogResults"));
$("#catalogQuery").addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchCatalog($("#catalogQuery").value, $("#catalogType").value, "#modalCatalogResults");
});

$("#musicToggle").addEventListener("click", () => {
  const audio = $("#bgAudio");
  if (audio.paused) tryPlayAudio();
  else audio.pause();
});

document.addEventListener("change", async (event) => {
  const fileInput = event.target.closest("input[type='file']");
  if (!fileInput?.files?.[0]) return;
  const file = fileInput.files[0];
  if (fileInput.id === "fontUpload") {
    const dataUrl = await readFileAsDataUrl(file);
    const name = `CustomFont${Date.now()}`;
    const style = document.createElement("style");
    style.textContent = `@font-face{font-family:"${name}";src:url("${dataUrl}")}`;
    document.head.appendChild(style);
    state.theme.customFontName = name;
    state.theme.font = `"${name}", ${state.theme.font}`;
    updateAll();
    publishState();
    fillForm("themeForm", state.theme);
    return;
  }
  if (fileInput.id === "cursorUpload") {
    state.theme.cursorUrl = await readFileAsDataUrl(file);
    state.theme.cursor = "custom";
    updateAll();
    publishState();
    fillForm("themeForm", state.theme);
    return;
  }
  const target = fileInput.dataset.uploadTarget;
  if (target) {
    setPath(target, await readFileAsDataUrl(file));
    updateAll();
    publishState();
  }
});

document.addEventListener("click", (event) => {
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    activeFilter = filter.dataset.filter;
    renderFilters();
    renderShelf();
  }
  const editButton = event.target.closest("[data-edit]");
  if (editButton) {
    requireOwner(() => {
      const item = state.items.find((entry) => entry.id === editButton.dataset.edit);
      fillItemForm(item);
      openModal("itemModal");
    });
  }
  const importButton = event.target.closest("[data-import]");
  if (importButton) importCatalogItem(importButton.dataset.import);
  const closeButton = event.target.closest("[data-close]");
  if (closeButton) closeModal(closeButton.dataset.close);
  if (event.target.classList.contains("modal-backdrop")) closeModal(event.target.id);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") ["loginModal", "profileModal", "themeModal", "catalogModal", "itemModal"].forEach(closeModal);
});

(async function init() {
  const serverState = await loadStateFromServer();
  if (serverState) {
    state = normalizeState(serverState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  updateAll();
  countView().then(updateAll);
})();
