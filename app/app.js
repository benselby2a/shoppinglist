const APP_CONFIG = {
  supabaseUrl: "https://cnkznpkvwoqxaiywwmhr.supabase.co",
  supabaseAnonKey: "sb_publishable_xlNQ_QudJNUlMLjWpr0iJA_YgO87tox",
  householdId: "shared-household",
  passcode: ""
};

const SECTIONS = [
  "Fruit and Veg",
  "Meat",
  "Fish",
  "Deli",
  "Dairy",
  "Canned Good and Spices",
  "Snacks",
  "Drinks",
  "Coffee and Tea",
  "Cereal",
  "Bakery",
  "Frozen",
  "Household and Cleaning",
  "Toiletries"
];

const SECTION_KEYWORDS = {
  "Fruit and Veg": ["apple", "banana", "berries", "broccoli", "carrot", "lettuce", "onion", "potato", "tomato"],
  Meat: ["beef", "chicken", "lamb", "mince", "pork", "steak", "sausages", "bacon", "turkey"],
  Fish: ["cod", "haddock", "prawn", "salmon", "tuna", "fish"],
  Deli: ["ham", "salami", "prosciutto", "olives", "deli"],
  Dairy: ["milk", "cheese", "butter", "yoghurt", "cream", "eggs"],
  "Canned Good and Spices": ["beans", "chickpeas", "tomatoes", "canned", "pepper", "paprika", "cumin", "spice"],
  Snacks: ["crisps", "chips", "nuts", "cracker", "snack", "chocolate", "biscuits"],
  Drinks: ["juice", "water", "soda", "cola", "drink", "lemonade", "squash"],
  Cereal: ["cereal", "granola", "oats", "muesli", "cornflakes"],
  "Coffee and Tea": ["coffee", "tea", "espresso", "decaf"],
  Bakery: ["bread", "bagel", "roll", "croissant", "cake", "muffin"],
  Frozen: ["frozen", "ice cream", "peas"],
  "Household and Cleaning": ["detergent", "bleach", "cleaner", "washing up", "bin bags", "sponges"],
  Toiletries: ["toothpaste", "shampoo", "soap", "deodorant", "toilet paper", "razor"]
};

const ADD_CARD_COLLAPSED_KEY = "shopping_list_add_card_collapsed";

const state = {
  items: [],
  suggestions: [],
  suggestionIndex: [],
  pending: [],
  conflictQueue: [],
  syncing: false,
  online: navigator.onLine,
  supabaseReachable: false,
  lastSyncError: "",
  lastSyncAt: null,
  lastAction: null
};

const el = {
  syncBar: document.getElementById("sync-bar"),
  syncText: document.getElementById("sync-text"),
  syncMeta: document.getElementById("sync-meta"),
  sectionsContainer: document.getElementById("sections-container"),
  sectionSelect: document.getElementById("item-section"),

  addCard: document.querySelector(".add-card"),
  addForm: document.getElementById("add-form"),
  addFabBtn: document.getElementById("add-fab-btn"),
  itemName: document.getElementById("item-entry"),
  itemQty: document.getElementById("item-qty"),
  itemOptions: document.getElementById("item-options"),

  topUndoBtn: document.getElementById("top-undo-btn"),
  addFavouritesBtn: document.getElementById("add-favourites-btn"),

  checkedModal: document.getElementById("checked-modal"),
  checkedList: document.getElementById("checked-list"),
  showCheckedBtn: document.getElementById("show-checked-btn"),
  closeCheckedBtn: document.getElementById("close-checked-btn"),
  dbFeedback: document.getElementById("db-feedback"),

  checkToast: document.getElementById("check-toast"),
  checkToastText: document.getElementById("check-toast-text"),

  conflictModal: document.getElementById("conflict-modal"),
  conflictMessage: document.getElementById("conflict-message"),
  closeConflictBtn: document.getElementById("close-conflict-btn"),
  resolveConflictBtn: document.getElementById("resolve-conflict-btn"),

  releaseBanner: document.getElementById("release-banner"),
  releaseRefreshBtn: document.getElementById("release-refresh-btn"),

  appShell: document.querySelector(".app-shell")
};

const dbPromise = openDB();
let supabase = null;
let suggestionTimer = null;
let lastSuggestionQuery = "";
let checkToastTimer = null;
let dbFeedbackTimer = null;

init();

async function init() {
  guardPasscode();
  el.sectionSelect.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
  bindEvents();
  await loadLocal();
  setAddCardCollapsed(localStorage.getItem(ADD_CARD_COLLAPSED_KEY) === "true");
  await seedSuggestionsFromItems();
  render();
  renderSuggestions();

  initSupabase();
  syncNow();
  setInterval(syncNow, 15000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncNow();
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
}

function bindEvents() {
  window.addEventListener("online", () => {
    state.online = true;
    renderSyncBar();
    syncNow();
  });

  window.addEventListener("offline", () => {
    state.online = false;
    renderSyncBar();
  });

  el.addFabBtn.addEventListener("click", () => {
    setAddCardCollapsed(!el.addCard.classList.contains("is-collapsed"));
  });

  el.addForm.addEventListener("submit", onAddItemSubmit);
  el.itemName.addEventListener("input", scheduleSuggestionsRender);
  el.itemName.addEventListener("focus", renderSuggestions);

  el.topUndoBtn.addEventListener("click", async () => {
    if (!state.lastAction) return;
    await undoLastAction();
  });

  el.addFavouritesBtn.addEventListener("click", addFavouritesToList);

  el.showCheckedBtn.addEventListener("click", () => {
    const open = el.checkedModal.classList.contains("is-open");
    if (open) {
      closeCheckedModal();
      return;
    }
    el.checkedModal.classList.add("is-open");
    el.appShell.classList.add("modal-focus");
    el.showCheckedBtn.textContent = "Hide Item Database";
    renderCheckedModal();
  });

  el.closeCheckedBtn.addEventListener("click", closeCheckedModal);

  el.checkToast.addEventListener("click", async () => {
    if (!state.lastAction) return;
    await undoLastAction();
    hideCheckToast();
  });

  el.closeConflictBtn.addEventListener("click", acknowledgeConflict);
  el.resolveConflictBtn.addEventListener("click", acknowledgeConflict);

  el.releaseRefreshBtn.addEventListener("click", () => {
    el.releaseBanner.hidden = true;
    location.reload();
  });
}

function guardPasscode() {
  if (!APP_CONFIG.passcode) return;
  const saved = localStorage.getItem("shopping_list_passcode_ok");
  if (saved === APP_CONFIG.passcode) return;

  const code = prompt("Enter household passcode");
  if (code !== APP_CONFIG.passcode) {
    alert("Incorrect passcode");
    location.reload();
    return;
  }
  localStorage.setItem("shopping_list_passcode_ok", APP_CONFIG.passcode);
}

async function onAddItemSubmit(e) {
  e.preventDefault();
  const rawName = normalizeItemName(el.itemName.value);
  const name = autoCorrectItemName(rawName);
  if (!name) return;

  const item = {
    id: crypto.randomUUID(),
    household_id: APP_CONFIG.householdId,
    name,
    section: el.sectionSelect.value,
    quantity_text: el.itemQty.value.trim(),
    checked: false,
    deleted_at: null,
    updated_at: new Date().toISOString()
  };

  state.items.push(item);
  captureUndo("add", { id: item.id });
  render();
  enqueue("upsert", item).catch(() => {});
  upsertSuggestion(name, item.section).catch(() => {});

  el.addForm.reset();
  renderSuggestions();
  syncNow();
}

function render() {
  const grouped = new Map(SECTIONS.map((s) => [s, []]));
  for (const item of state.items) {
    if (item.checked || item.deleted_at) continue;
    grouped.get(getEffectiveSection(item))?.push(item);
  }

  el.sectionsContainer.innerHTML = "";
  for (const section of SECTIONS) {
    const items = grouped.get(section);
    if (!items?.length) continue;

    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `<h3 class="section-title">${section}</h3>`;
    for (const item of items) card.appendChild(itemRow(item));
    el.sectionsContainer.appendChild(card);
  }

  renderSyncBar();
}

function itemRow(item) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <button class="item-main-btn" type="button" aria-label="Check ${escapeHtml(item.name)}">
      <span class="item-check-icon">✓</span>
      <span class="item-name"></span>
      <span class="item-qty"></span>
    </button>
    <button class="delete-btn" type="button" aria-label="Remove ${escapeHtml(item.name)}">✕</button>
  `;

  row.querySelector(".item-name").textContent = item.name;
  row.querySelector(".item-qty").textContent = item.quantity_text || "";

  row.querySelector(".item-main-btn").addEventListener("click", () => {
    const prev = { ...item };
    item.checked = true;
    item.updated_at = new Date().toISOString();
    captureUndo("check", prev);
    render();
    enqueue("upsert", item).catch(() => {});
    syncNow();
  });

  row.querySelector(".delete-btn").addEventListener("click", () => {
    const prev = { ...item };
    item.deleted_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    captureUndo("delete", prev);
    render();
    enqueue("upsert", item).catch(() => {});
    syncNow();
  });

  return row;
}

function renderCheckedModal() {
  const checkedItems = state.items.filter((i) => i.checked && !i.deleted_at);
  const byKey = new Map();

  for (const s of state.suggestions) {
    const key = canonicalNameKey(s.name);
    if (!key) continue;
    if (!byKey.has(key)) {
      byKey.set(key, {
        name: s.name,
        section: s.section || "",
        favourite: Boolean(s.favourite),
        checkedItem: null
      });
    } else if (s.favourite) {
      byKey.get(key).favourite = true;
    }
  }

  for (const item of checkedItems) {
    const key = canonicalNameKey(item.name);
    if (!key) continue;
    if (!byKey.has(key)) {
      byKey.set(key, {
        name: item.name,
        section: item.section || "",
        favourite: false,
        checkedItem: item
      });
    } else {
      byKey.get(key).checkedItem = item;
    }
  }

  const entries = [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
  el.checkedList.innerHTML = "";

  for (const entry of entries) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <div>
        <span class="item-name"></span>
        <div class="db-section-row">
          <label>Section</label>
          <select class="db-section-select"></select>
        </div>
      </div>
      <div class="db-actions"></div>
    `;

    li.querySelector(".item-name").textContent = entry.name;
    const sectionSelect = li.querySelector(".db-section-select");
    sectionSelect.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
    sectionSelect.value = normalizeSection(entry.section) || SECTIONS[0];

    sectionSelect.addEventListener("change", async () => {
      await updateEntrySection(entry.name, sectionSelect.value);
      showDbFeedback(`Section set to ${sectionSelect.value}`);
      renderCheckedModal();
      render();
      syncNow();
    });

    const actions = li.querySelector(".db-actions");

    const favBtn = document.createElement("button");
    favBtn.type = "button";
    favBtn.className = "db-icon-btn db-fav-btn";
    favBtn.textContent = entry.favourite ? "★" : "☆";
    favBtn.title = entry.favourite ? "Unfavourite item" : "Favourite item";
    favBtn.setAttribute("aria-label", favBtn.title);
    favBtn.addEventListener("click", async () => {
      await setFavourite(entry.name, !entry.favourite, entry.section);
      showDbFeedback(entry.favourite ? "Removed from favourites" : "Added to favourites");
      renderCheckedModal();
    });
    actions.appendChild(favBtn);

    if (entry.checkedItem) {
      const uncheckBtn = document.createElement("button");
      uncheckBtn.type = "button";
      uncheckBtn.className = "db-icon-btn db-uncheck-btn";
      uncheckBtn.textContent = "↺";
      uncheckBtn.title = "Uncheck item";
      uncheckBtn.setAttribute("aria-label", "Uncheck item");
      uncheckBtn.addEventListener("click", async () => {
        const prev = { ...entry.checkedItem };
        entry.checkedItem.checked = false;
        entry.checkedItem.updated_at = new Date().toISOString();
        captureUndo("uncheck", prev);
        await enqueue("upsert", entry.checkedItem);
        showDbFeedback("Item unchecked");
        renderCheckedModal();
        render();
        syncNow();
      });
      actions.appendChild(uncheckBtn);
    }

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "db-icon-btn db-delete-btn";
    delBtn.textContent = "🗑";
    delBtn.title = "Delete item";
    delBtn.setAttribute("aria-label", "Delete item");
    delBtn.addEventListener("click", async () => {
      const confirmed = window.confirm(`Delete "${entry.name}" from Item Database? This removes it from autocomplete.`);
      if (!confirmed) return;
      await deleteDatabaseEntry(entry.name);
      showDbFeedback("Item deleted");
      renderCheckedModal();
      render();
      syncNow();
    });
    actions.appendChild(delBtn);

    el.checkedList.appendChild(li);
  }
}

function closeCheckedModal() {
  el.checkedModal.classList.remove("is-open");
  el.appShell.classList.remove("modal-focus");
  el.showCheckedBtn.textContent = "Show Item Database";
}

function renderSuggestions() {
  const q = el.itemName.value.trim().toLowerCase();
  applySectionGuess(q);

  if (q.length < 3) {
    lastSuggestionQuery = q;
    el.itemOptions.innerHTML = "";
    return;
  }

  if (q === lastSuggestionQuery && el.itemOptions.children.length > 0) return;
  lastSuggestionQuery = q;

  const matches = state.suggestionIndex
    .filter((s) => s.nameLower.includes(q))
    .sort((a, b) => {
      const aStarts = a.nameLower.startsWith(q) ? 0 : 1;
      const bStarts = b.nameLower.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      return b.use_count - a.use_count;
    })
    .slice(0, 20);

  el.itemOptions.innerHTML = matches
    .map((s) => `<option value="${escapeHtml(s.name)}"></option>`)
    .join("");
}

function scheduleSuggestionsRender() {
  if (suggestionTimer) clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => {
    renderSuggestions();
    suggestionTimer = null;
  }, 80);
}

function renderSyncBar() {
  const pendingCount = state.pending.length;
  const hasError = Boolean(state.lastSyncError);
  const effectivelyOnline = state.online && (supabase ? state.supabaseReachable : true);
  const warning = hasError || !effectivelyOnline;

  el.syncBar.className = `sync-bar ${warning ? "sync-conflict" : "sync-online"}`;
  el.syncText.textContent = warning ? "Sync warning" : state.syncing ? "Checking..." : "Online";

  if (warning || pendingCount > 0) {
    el.syncMeta.textContent = `${pendingCount} items will sync once you have connectivity`;
  } else if (state.lastSyncAt) {
    const t = new Date(state.lastSyncAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    el.syncMeta.textContent = `Last update: ${t}`;
  } else {
    el.syncMeta.textContent = "Last update: --";
  }
}

function setAddCardCollapsed(collapsed) {
  el.addCard.classList.toggle("is-collapsed", collapsed);
  document.body.classList.toggle("add-panel-collapsed", collapsed);
  el.addFabBtn.textContent = collapsed ? "＋" : "－";
  el.addFabBtn.setAttribute("aria-label", collapsed ? "Show add new item panel" : "Hide add new item panel");
  el.addFabBtn.hidden = false;
  localStorage.setItem(ADD_CARD_COLLAPSED_KEY, String(collapsed));
}

function captureUndo(type, payload) {
  state.lastAction = { type, payload, ts: Date.now() };
  el.topUndoBtn.disabled = false;
  el.topUndoBtn.textContent = `Undo ${actionLabel(type)}`;
  if (type === "check") showCheckToast(payload?.name);
}

async function undoLastAction() {
  const { type, payload } = state.lastAction || {};
  if (!type) return;

  if (type === "add") {
    const item = state.items.find((i) => i.id === payload.id);
    if (item) {
      item.deleted_at = new Date().toISOString();
      await enqueue("upsert", item);
    }
  } else {
    const idx = state.items.findIndex((i) => i.id === payload.id);
    if (idx >= 0) {
      state.items[idx] = payload;
      state.items[idx].updated_at = new Date().toISOString();
      await enqueue("upsert", state.items[idx]);
    }
  }

  state.lastAction = null;
  el.topUndoBtn.disabled = true;
  el.topUndoBtn.textContent = "Undo";
  render();
  syncNow();
}

function queueConflict(message) {
  if (!state.conflictQueue.includes(message)) state.conflictQueue.push(message);
  showConflictSummary();
}

function showConflictSummary() {
  if (!state.conflictQueue.length) return;
  const summary = state.conflictQueue.map((m, i) => `${i + 1}. ${m}`).join("\n");
  el.conflictMessage.textContent = summary;
  el.conflictModal.classList.add("is-open");
}

function acknowledgeConflict() {
  state.conflictQueue = [];
  el.conflictModal.classList.remove("is-open");
}

function showCheckToast(itemName) {
  if (checkToastTimer) clearTimeout(checkToastTimer);
  el.checkToastText.textContent = itemName ? `Checked: ${itemName}` : "Checked Item";
  el.checkToast.hidden = false;
  checkToastTimer = setTimeout(hideCheckToast, 3000);
}

function hideCheckToast() {
  if (checkToastTimer) clearTimeout(checkToastTimer);
  checkToastTimer = null;
  el.checkToast.hidden = true;
}

function showDbFeedback(message) {
  if (dbFeedbackTimer) clearTimeout(dbFeedbackTimer);
  el.dbFeedback.textContent = message;
  el.dbFeedback.hidden = false;
  dbFeedbackTimer = setTimeout(() => {
    el.dbFeedback.hidden = true;
    dbFeedbackTimer = null;
  }, 1800);
}

function showReleaseBanner() {
  el.releaseBanner.hidden = true;
}

function actionLabel(type) {
  if (type === "add") return "add item";
  if (type === "check") return "check item";
  if (type === "uncheck") return "uncheck item";
  if (type === "delete") return "remove item";
  return "action";
}

function getEffectiveSection(item) {
  const key = canonicalNameKey(item.name);
  if (!key) return normalizeSection(item.section) || SECTIONS[0];
  const suggestion = state.suggestions.find((s) => canonicalNameKey(s.name) === key);
  return normalizeSection(suggestion?.section || item.section) || SECTIONS[0];
}

function applySectionGuess(queryLower) {
  if (!queryLower) return;
  const guessed = guessSection(queryLower);
  if (guessed) el.sectionSelect.value = guessed;
}

function guessSection(queryLower) {
  const q = queryLower.trim();
  if (!q) return "";

  const exact = state.suggestions.find((s) => s.section && s.name && s.name.trim().toLowerCase() === q);
  if (exact?.section) return exact.section;

  const contains = state.suggestions.find((s) => s.section && s.name && s.name.trim().toLowerCase().includes(q));
  if (contains?.section) return contains.section;

  for (const [section, words] of Object.entries(SECTION_KEYWORDS)) {
    if (words.some((w) => q.includes(w))) return section;
  }
  return "";
}

function autoCorrectItemName(inputName) {
  const normalized = normalizeItemName(inputName);
  if (!normalized || !state.suggestionIndex.length) return normalized;

  const inputKey = canonicalNameKey(normalized);
  const exact = state.suggestionIndex.find((s) => canonicalNameKey(s.name) === inputKey);
  if (exact) return exact.name;

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const s of state.suggestionIndex) {
    const candidateKey = canonicalNameKey(s.name);
    if (!candidateKey) continue;
    const maxLen = Math.max(inputKey.length, candidateKey.length);
    if (maxLen <= 2) continue;

    const distance = levenshtein(inputKey, candidateKey);
    const ratio = distance / maxLen;
    if (ratio <= 0.22 && distance < bestDistance) {
      best = s.name;
      bestDistance = distance;
    }
  }
  return best || normalized;
}

async function initSupabase() {
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) return;
  supabase = { url: APP_CONFIG.supabaseUrl, anonKey: APP_CONFIG.supabaseAnonKey };
}

async function syncNow() {
  if (!supabase || state.syncing) return;
  state.syncing = true;
  renderSyncBar();

  while (state.pending.length) {
    const op = state.pending[0];
    const { error } = await apiUpsert("shopping_items", op.payload);
    if (error) {
      state.lastSyncError = `sync failed: ${error.message}`;
      break;
    }
    state.pending.shift();
    await persistLocal();
  }

  const { data, error } = await apiSelect("shopping_items", {
    columns: "*",
    eq: { household_id: APP_CONFIG.householdId },
    is: { deleted_at: "null" }
  });

  state.supabaseReachable = !error;
  state.online = !error;
  state.lastSyncError = error ? `connect failed: ${error.message}` : "";
  if (!error) state.lastSyncAt = new Date().toISOString();

  if (data) {
    const merged = mergeById(state.items, data);
    detectConflicts(state.items, merged);
    state.items = merged;
  }

  if (!error) await syncSuggestionsFromRemote();

  state.syncing = false;
  render();
}

function detectConflicts(localItems, mergedItems) {
  const localById = new Map(localItems.map((i) => [i.id, i]));
  for (const remote of mergedItems) {
    const local = localById.get(remote.id);
    if (!local) continue;
    const rts = new Date(remote.updated_at).getTime();
    const lts = new Date(local.updated_at).getTime();
    if (rts <= lts) continue;
    if (!hasMaterialDifference(local, remote)) continue;
    queueConflict(describeRemoteResolution(local, remote));
  }
}

function hasMaterialDifference(a, b) {
  return (
    a.name !== b.name ||
    a.section !== b.section ||
    a.quantity_text !== b.quantity_text ||
    Boolean(a.checked) !== Boolean(b.checked) ||
    Boolean(a.deleted_at) !== Boolean(b.deleted_at)
  );
}

function describeRemoteResolution(local, remote) {
  const label = remote.name || local.name || "item";
  if (!local.deleted_at && remote.deleted_at) return `Conflict on "${label}": it will be removed based on the latest update.`;
  if (!local.checked && remote.checked) return `Conflict on "${label}": it will be marked checked and removed from the active list.`;
  if (local.checked && !remote.checked) return `Conflict on "${label}": it will be restored to the active list.`;
  if (local.section !== remote.section) return `Conflict on "${label}": section will change to ${remote.section}.`;
  if (local.quantity_text !== remote.quantity_text) return `Conflict on "${label}": quantity will change to "${remote.quantity_text || "none"}".`;
  if (local.name !== remote.name) return `Conflict: item will be renamed to "${remote.name}".`;
  return `Conflict on "${label}": latest update will be applied.`;
}

async function enqueue(type, payload) {
  state.pending.push({ type, payload });
  await persistLocal();
}

function mergeById(local, remote) {
  const byId = new Map(local.map((i) => [i.id, i]));
  for (const i of remote) byId.set(i.id, i);
  return [...byId.values()];
}

async function upsertSuggestion(name, section) {
  const normalizedName = normalizeItemName(name);
  if (!normalizedName) return;

  const key = canonicalNameKey(normalizedName);
  const existing = state.suggestions.find((s) => canonicalNameKey(s.name) === key);

  if (existing) {
    existing.name = normalizedName;
    if (section) existing.section = section;
    existing.use_count = (existing.use_count || 1) + 1;
    existing.last_used_at = new Date().toISOString();
  } else {
    state.suggestions.push({
      id: crypto.randomUUID(),
      household_id: APP_CONFIG.householdId,
      name: normalizedName,
      section,
      use_count: 1,
      last_used_at: new Date().toISOString()
    });
  }

  rebuildSuggestionIndex();
  await persistLocal();
  upsertSuggestionRemote(existing || state.suggestions[state.suggestions.length - 1]).catch(() => {});
}

async function seedSuggestionsFromItems() {
  let changed = false;
  for (const item of state.items) {
    if (!item?.name || item.deleted_at) continue;
    const name = normalizeItemName(item.name);
    if (!name) continue;
    const key = canonicalNameKey(name);
    const exists = state.suggestions.some((s) => canonicalNameKey(s.name) === key);
    if (exists) continue;

    state.suggestions.push({
      id: crypto.randomUUID(),
      household_id: APP_CONFIG.householdId,
      name,
      section: item.section || "",
      use_count: 1,
      last_used_at: new Date().toISOString()
    });
    changed = true;
  }

  rebuildSuggestionIndex();
  if (changed) await persistLocal();
}

async function setFavourite(name, favourite, fallbackSection = "") {
  const key = canonicalNameKey(name);
  if (!key) return;

  let found = false;
  for (const s of state.suggestions) {
    if (canonicalNameKey(s.name) !== key) continue;
    s.favourite = favourite;
    if (!s.section && fallbackSection) s.section = fallbackSection;
    found = true;
  }

  if (!found) {
    state.suggestions.push({
      id: crypto.randomUUID(),
      household_id: APP_CONFIG.householdId,
      name: normalizeItemName(name),
      section: fallbackSection || "",
      use_count: 1,
      last_used_at: new Date().toISOString(),
      favourite
    });
  }

  rebuildSuggestionIndex();
  await persistLocal();
  for (const s of state.suggestions.filter((x) => canonicalNameKey(x.name) === key)) {
    await upsertSuggestionRemote(s);
  }
}

async function updateEntrySection(name, newSection) {
  const section = normalizeSection(newSection) || SECTIONS[0];
  const key = canonicalNameKey(name);
  if (!key) return;

  for (const s of state.suggestions) {
    if (canonicalNameKey(s.name) !== key) continue;
    s.section = section;
    await upsertSuggestionRemote(s);
  }

  for (const item of state.items) {
    if (item.deleted_at) continue;
    if (canonicalNameKey(item.name) !== key) continue;
    item.section = section;
    item.updated_at = new Date().toISOString();
    await enqueue("upsert", item);
  }

  rebuildSuggestionIndex();
  await persistLocal();
}

async function deleteDatabaseEntry(name) {
  const key = canonicalNameKey(name);
  if (!key) return;

  const removed = state.suggestions.filter((s) => canonicalNameKey(s.name) === key);
  state.suggestions = state.suggestions.filter((s) => canonicalNameKey(s.name) !== key);
  rebuildSuggestionIndex();

  const affectedItems = state.items.filter((i) => !i.deleted_at && i.checked && canonicalNameKey(i.name) === key);
  for (const item of affectedItems) {
    item.deleted_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    await enqueue("upsert", item);
  }

  await persistLocal();
  await deleteSuggestionsRemote(removed);
}

async function addFavouritesToList() {
  const active = new Set(
    state.items
      .filter((i) => !i.deleted_at && !i.checked)
      .map((i) => canonicalNameKey(i.name))
  );

  const favourites = state.suggestions.filter((s) => s.favourite);
  let lastAddedId = null;

  for (const s of favourites) {
    const key = canonicalNameKey(s.name);
    if (!key || active.has(key)) continue;

    const item = {
      id: crypto.randomUUID(),
      household_id: APP_CONFIG.householdId,
      name: normalizeItemName(s.name),
      section: normalizeSection(s.section) || guessSection(s.name.toLowerCase()) || SECTIONS[0],
      quantity_text: "",
      checked: false,
      deleted_at: null,
      updated_at: new Date().toISOString()
    };

    state.items.push(item);
    active.add(key);
    await enqueue("upsert", item);
    lastAddedId = item.id;
  }

  if (lastAddedId) {
    captureUndo("add", { id: lastAddedId });
    render();
    syncNow();
  }
}

async function syncSuggestionsFromRemote() {
  if (!supabase) return;
  const { data, error } = await apiSelect("suggestion_items", {
    columns: "*",
    eq: { household_id: APP_CONFIG.householdId }
  });
  if (error || !data) return;

  let changed = false;
  for (const remote of data) {
    const key = canonicalNameKey(remote.name);
    if (!key) continue;

    const local = state.suggestions.find((s) => canonicalNameKey(s.name) === key);
    if (!local) {
      state.suggestions.push({
        id: remote.id,
        household_id: remote.household_id,
        name: normalizeItemName(remote.name),
        section: remote.section || "",
        favourite: Boolean(remote.favourite),
        use_count: remote.use_count || 1,
        last_used_at: remote.last_used_at || new Date().toISOString()
      });
      changed = true;
      continue;
    }

    local.id = remote.id || local.id;
    local.section = remote.section || local.section || "";
    local.favourite = Boolean(remote.favourite);
    local.use_count = Math.max(local.use_count || 1, remote.use_count || 1);
    local.last_used_at = remote.last_used_at || local.last_used_at;
    changed = true;
  }

  if (changed) {
    rebuildSuggestionIndex();
    await persistLocal();
  }
}

async function upsertSuggestionRemote(suggestion) {
  if (!supabase || !suggestion) return;

  const payload = {
    id: suggestion.id,
    household_id: APP_CONFIG.householdId,
    name: normalizeItemName(suggestion.name),
    section: suggestion.section || "",
    favourite: Boolean(suggestion.favourite),
    use_count: suggestion.use_count || 1,
    last_used_at: suggestion.last_used_at || new Date().toISOString()
  };

  const { error } = await apiUpsert("suggestion_items", payload);
  if (!error && suggestion.id) return;

  const { data } = await apiSelect("suggestion_items", {
    columns: "id",
    eq: { household_id: APP_CONFIG.householdId, name: payload.name }
  });

  if (data?.[0]?.id) suggestion.id = data[0].id;
}

async function deleteSuggestionsRemote(removedSuggestions) {
  if (!supabase || !removedSuggestions?.length) return;
  for (const s of removedSuggestions) {
    if (s.id) {
      await apiDelete("suggestion_items", { eq: { id: s.id } });
    } else {
      await apiDelete("suggestion_items", {
        eq: { household_id: APP_CONFIG.householdId },
        ilike: { name: s.name }
      });
    }
  }
}

function rebuildSuggestionIndex() {
  state.suggestionIndex = state.suggestions.map((s) => ({
    name: s.name,
    nameLower: (s.name || "").toLowerCase(),
    use_count: s.use_count || 0
  }));
}

async function loadLocal() {
  const db = await dbPromise;
  state.items = (await idbGet(db, "state", "items")) || [];
  state.suggestions = (await idbGet(db, "state", "suggestions")) || [];
  state.pending = (await idbGet(db, "state", "pending")) || [];
  rebuildSuggestionIndex();
}

async function persistLocal() {
  const db = await dbPromise;
  await idbSet(db, "state", "items", state.items);
  await idbSet(db, "state", "suggestions", state.suggestions);
  await idbSet(db, "state", "pending", state.pending);
}

async function apiUpsert(table, payload) {
  return apiRequest({
    table,
    method: "POST",
    query: { on_conflict: "id" },
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: Array.isArray(payload) ? payload : [payload]
  });
}

async function apiSelect(table, { columns = "*", eq = {}, is = {}, ilike = {} } = {}) {
  const query = { select: columns };
  for (const [k, v] of Object.entries(eq)) query[k] = `eq.${encodeFilterValue(v)}`;
  for (const [k, v] of Object.entries(is)) query[k] = `is.${v}`;
  for (const [k, v] of Object.entries(ilike)) query[k] = `ilike.${encodeFilterValue(v)}`;
  return apiRequest({ table, method: "GET", query });
}

async function apiDelete(table, { eq = {}, ilike = {} } = {}) {
  const query = {};
  for (const [k, v] of Object.entries(eq)) query[k] = `eq.${encodeFilterValue(v)}`;
  for (const [k, v] of Object.entries(ilike)) query[k] = `ilike.${encodeFilterValue(v)}`;
  return apiRequest({ table, method: "DELETE", query });
}

async function apiRequest({ table, method, query = {}, headers = {}, body }) {
  if (!supabase) return { data: null, error: { message: "Supabase not configured" } };

  const qs = new URLSearchParams(query).toString();
  const url = `${supabase.url}/rest/v1/${table}${qs ? `?${qs}` : ""}`;

  try {
    const res = await fetch(url, {
      method,
      headers: {
        apikey: supabase.anonKey,
        Authorization: `Bearer ${supabase.anonKey}`,
        "Content-Type": "application/json",
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });

    let data = null;
    const text = await res.text();
    if (text) {
      try { data = JSON.parse(text); } catch { data = null; }
    }

    if (!res.ok) {
      return { data: null, error: { message: data?.message || data?.error || `${res.status} ${res.statusText}` } };
    }

    return { data, error: null };
  } catch (err) {
    return { data: null, error: { message: err?.message || "network error" } };
  }
}

function encodeFilterValue(value) {
  return String(value).replaceAll(",", "\\,");
}

function normalizeItemName(value) {
  const compact = (value || "").trim().replace(/\s+/g, " ");
  if (!compact) return "";
  return compact
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function canonicalNameKey(value) {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, "");
}

function normalizeSection(raw) {
  if (!raw) return "";
  const r = raw.toLowerCase();
  const match = SECTIONS.find((s) => s.toLowerCase() === r);
  return match || "";
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("shopping-list-db", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("state");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db, store, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbSet(db, store, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
