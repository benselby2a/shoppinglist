const APP_CONFIG = {
  supabaseUrl: "https://cnkznpkvwoqxaiywwmhr.supabase.co",
  supabaseAnonKey: "sb_publishable_xlNQ_QudJNUlMLjWpr0iJA_YgO87tox",
  householdId: "shared-household",
  passcode: "123456"
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
  "Cereal",
  "Coffee and Tea",
  "Bakery",
  "Frozen",
  "Household and Cleaning",
  "Toiletries"
];

const state = {
  items: [],
  checkedItems: [],
  suggestions: [],
  pending: [],
  conflictCount: 0,
  syncing: false,
  online: navigator.onLine,
  supabaseReachable: false,
  lastSyncError: "",
  lastAction: null
};

const dbPromise = openDB();
let supabase = null;

const el = {
  syncBar: document.getElementById("sync-bar"),
  syncText: document.getElementById("sync-text"),
  syncMeta: document.getElementById("sync-meta"),
  sectionSelect: document.getElementById("item-section"),
  sectionsContainer: document.getElementById("sections-container"),
  addForm: document.getElementById("add-form"),
  itemName: document.getElementById("item-name"),
  itemQty: document.getElementById("item-qty"),
  suggestions: document.getElementById("suggestions"),
  syncNowBtn: document.getElementById("sync-now-btn"),
  importFile: document.getElementById("import-file"),
  checkedModal: document.getElementById("checked-modal"),
  showCheckedBtn: document.getElementById("show-checked-btn"),
  closeCheckedBtn: document.getElementById("close-checked-btn"),
  checkedList: document.getElementById("checked-list"),
  undoToast: document.getElementById("undo-toast"),
  undoBtn: document.getElementById("undo-btn"),
  undoMessage: document.getElementById("undo-message")
};

init();

async function init() {
  guardPasscode();
  el.sectionSelect.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
  bindEvents();
  await loadLocal();
  render();
  initSupabase();
  syncNow();
  setInterval(syncNow, 15000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) syncNow();
  });
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
}

function guardPasscode() {
  const code = prompt("Enter household passcode");
  if (code !== APP_CONFIG.passcode) {
    alert("Incorrect passcode");
    location.reload();
  }
}

function bindEvents() {
  window.addEventListener("online", () => {
    state.online = true;
    syncNow();
    renderSyncBar();
  });
  window.addEventListener("offline", () => {
    state.online = false;
    renderSyncBar();
  });

  el.addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = el.itemName.value.trim();
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
    await enqueue("upsert", item);
    await upsertSuggestion(name, item.section);
    el.addForm.reset();
    render();
    syncNow();
  });

  el.itemName.addEventListener("input", renderSuggestions);
  el.syncNowBtn.addEventListener("click", syncNow);

  el.importFile.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 1000);
    for (const line of lines) await upsertSuggestion(line, "");
    el.importFile.value = "";
    renderSuggestions();
  });

  el.showCheckedBtn.addEventListener("click", () => {
    el.checkedModal.classList.add("is-open");
    renderCheckedModal();
  });
  el.closeCheckedBtn.addEventListener("click", () => el.checkedModal.classList.remove("is-open"));

  el.undoBtn.addEventListener("click", async () => {
    if (!state.lastAction) return;
    await undoLastAction();
  });
}

function render() {
  const grouped = new Map(SECTIONS.map((s) => [s, []]));
  for (const item of state.items.filter((i) => !i.checked && !i.deleted_at)) grouped.get(item.section)?.push(item);

  el.sectionsContainer.innerHTML = "";
  for (const section of SECTIONS) {
    const items = grouped.get(section);
    const card = document.createElement("section");
    card.className = "card";
    card.innerHTML = `<h3 class="section-title">${section}</h3>`;

    if (!items?.length) {
      const p = document.createElement("p");
      p.className = "item-qty";
      p.textContent = "No items";
      card.appendChild(p);
    } else {
      for (const item of items) card.appendChild(itemRow(item));
    }

    el.sectionsContainer.appendChild(card);
  }

  renderSyncBar();
}

function itemRow(item) {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <input type="checkbox" />
    <span class="item-name"></span>
    <span class="item-qty"></span>
    <button class="delete-btn" type="button">Remove</button>
  `;
  row.querySelector(".item-name").textContent = item.name;
  row.querySelector(".item-qty").textContent = item.quantity_text || "";

  row.querySelector("input").addEventListener("change", async () => {
    const prev = { ...item };
    item.checked = true;
    item.updated_at = new Date().toISOString();
    captureUndo("check", prev);
    await enqueue("upsert", item);
    render();
    syncNow();
  });

  row.querySelector(".delete-btn").addEventListener("click", async () => {
    const prev = { ...item };
    item.deleted_at = new Date().toISOString();
    item.updated_at = new Date().toISOString();
    captureUndo("delete", prev);
    await enqueue("upsert", item);
    render();
    syncNow();
  });

  return row;
}

function renderCheckedModal() {
  const checked = state.items.filter((i) => i.checked && !i.deleted_at);
  el.checkedList.innerHTML = "";
  for (const item of checked) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <span>✓</span>
      <span class="item-name"></span>
      <span class="item-qty"></span>
      <button type="button">Uncheck</button>
    `;
    li.querySelector(".item-name").textContent = `${item.name} (${item.section})`;
    li.querySelector(".item-qty").textContent = item.quantity_text || "";
    li.querySelector("button").addEventListener("click", async () => {
      const prev = { ...item };
      item.checked = false;
      item.updated_at = new Date().toISOString();
      captureUndo("uncheck", prev);
      await enqueue("upsert", item);
      renderCheckedModal();
      render();
      syncNow();
    });
    el.checkedList.appendChild(li);
  }
}

function renderSuggestions() {
  const q = el.itemName.value.trim().toLowerCase();
  if (!q) {
    el.suggestions.hidden = true;
    return;
  }
  const matches = state.suggestions
    .filter((s) => s.name.toLowerCase().includes(q))
    .slice(0, 5);

  el.suggestions.innerHTML = matches
    .map((s) => `<li data-name="${s.name}" data-section="${s.section || ""}">${s.name}</li>`)
    .join("");
  el.suggestions.hidden = matches.length === 0;

  for (const node of el.suggestions.querySelectorAll("li")) {
    node.addEventListener("click", () => {
      el.itemName.value = node.dataset.name;
      if (node.dataset.section) el.sectionSelect.value = node.dataset.section;
      el.suggestions.hidden = true;
    });
  }
}

function renderSyncBar() {
  const pendingCount = state.pending.length;
  const conflict = state.conflictCount > 0;
  const effectivelyOnline = state.online && (supabase ? state.supabaseReachable : true);

  el.syncBar.className = "sync-bar " +
    (conflict ? "sync-conflict" : state.syncing ? "sync-syncing" : effectivelyOnline ? "sync-online" : "sync-offline");

  el.syncText.textContent = conflict
    ? "Conflict detected"
    : state.syncing
      ? "Syncing"
      : effectivelyOnline
        ? "Online"
        : "Offline";

  const err = state.lastSyncError ? ` · ${state.lastSyncError}` : "";
  el.syncMeta.textContent = `${pendingCount} pending · ${state.conflictCount} conflicts${err}`;
}

function captureUndo(type, payload) {
  state.lastAction = { type, payload, ts: Date.now() };
  el.undoMessage.textContent = `Last action: ${type}`;
  el.undoToast.hidden = false;
  setTimeout(() => {
    if (Date.now() - state.lastAction.ts >= 10000) el.undoToast.hidden = true;
  }, 10000);
}

async function undoLastAction() {
  const { type, payload } = state.lastAction;
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
  el.undoToast.hidden = true;
  render();
  syncNow();
}

async function initSupabase() {
  if (!APP_CONFIG.supabaseUrl || !APP_CONFIG.supabaseAnonKey) return;

  supabase = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseAnonKey);
  supabase
    .channel("shopping_items_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "shopping_items", filter: `household_id=eq.${APP_CONFIG.householdId}` },
      (payload) => applyRemote(payload.new)
    )
    .subscribe();
}

function applyRemote(remote) {
  const idx = state.items.findIndex((i) => i.id === remote.id);
  if (idx === -1) {
    state.items.push(remote);
  } else {
    const local = state.items[idx];
    if (new Date(remote.updated_at).getTime() < new Date(local.updated_at).getTime()) {
      state.conflictCount += 1;
      return;
    }
    state.items[idx] = remote;
  }
  persistLocal();
  render();
}

async function syncNow() {
  if (!supabase || state.syncing) return;
  state.syncing = true;
  renderSyncBar();

  while (state.pending.length) {
    const op = state.pending[0];
    const { error } = await supabase.from("shopping_items").upsert(op.payload);
    if (error) {
      state.lastSyncError = `sync failed: ${error.message}`;
      break;
    }
    state.pending.shift();
    await persistLocal();
  }

  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("household_id", APP_CONFIG.householdId)
    .is("deleted_at", null);
  state.supabaseReachable = !error;
  state.online = !error;
  state.lastSyncError = error ? `connect failed: ${error.message}` : "";
  if (data) state.items = mergeById(state.items, data);

  state.syncing = false;
  render();
}

function mergeById(local, remote) {
  const byId = new Map(local.map((i) => [i.id, i]));
  for (const item of remote) byId.set(item.id, item);
  return [...byId.values()];
}

async function enqueue(type, payload) {
  state.pending.push({ type, payload });
  await persistLocal();
}

async function upsertSuggestion(name, section) {
  const existing = state.suggestions.find((s) => s.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    existing.use_count = (existing.use_count || 1) + 1;
    existing.last_used_at = new Date().toISOString();
  } else {
    state.suggestions.push({
      id: crypto.randomUUID(),
      household_id: APP_CONFIG.householdId,
      name,
      section,
      use_count: 1,
      last_used_at: new Date().toISOString()
    });
  }
  await persistLocal();
}

async function loadLocal() {
  const db = await dbPromise;
  state.items = (await idbGet(db, "state", "items")) || [];
  state.suggestions = (await idbGet(db, "state", "suggestions")) || [];
  state.pending = (await idbGet(db, "state", "pending")) || [];
}

async function persistLocal() {
  const db = await dbPromise;
  await idbSet(db, "state", "items", state.items);
  await idbSet(db, "state", "suggestions", state.suggestions);
  await idbSet(db, "state", "pending", state.pending);
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
