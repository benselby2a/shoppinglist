const APP_CONFIG = {
  supabaseUrl: "https://cnkznpkvwoqxaiywwmhr.supabase.co",
  supabaseAnonKey: "sb_publishable_xlNQ_QudJNUlMLjWpr0iJA_YgO87tox",
  householdId: "shared-household",
  passcode: ""
};
const APP_VERSION = "v114";

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
const HIDE_BIG_SHOP_FILTER_KEY = "shopping_list_hide_big_shop";

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
  lastAction: null,
  hideBigShopItems: false,
  dbFilterQuery: "",
  meals: [],
  mealItems: [],
  mealPickerQuery: "",
  mealDraftItems: [],
  addMode: "item",
  selectedAddMealId: null,
  editingMealId: null,
  mealEditDraftItems: []
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
  addBigShopCheckbox: document.getElementById("add-big-shop-checkbox"),
  addModeItemBtn: document.getElementById("add-mode-item-btn"),
  addModeMealBtn: document.getElementById("add-mode-meal-btn"),
  addItemPane: document.getElementById("add-item-pane"),
  addMealPane: document.getElementById("add-meal-pane"),
  addMealFilter: document.getElementById("add-meal-filter"),
  addMealOptions: document.getElementById("add-meal-options"),
  addSelectedMealBtn: document.getElementById("add-selected-meal-btn"),
  optionsFabBtn: document.getElementById("options-fab-btn"),
  optionsMenu: document.getElementById("options-menu"),
  itemName: document.getElementById("item-entry"),
  itemQty: document.getElementById("item-qty"),
  itemOptions: document.getElementById("item-options"),

  topUndoBtn: document.getElementById("top-undo-btn"),
  checkAllBtn: document.getElementById("check-all-btn"),
  smallShopFilterBtn: document.getElementById("small-shop-filter-btn"),
  addFavouritesBtn: document.getElementById("add-favourites-btn"),
  manageMealsBtn: document.getElementById("manage-meals-btn"),

  checkedModal: document.getElementById("checked-modal"),
  checkedList: document.getElementById("checked-list"),
  checkedFilterInput: document.getElementById("checked-filter-input"),
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
  appVersion: document.getElementById("app-version"),

  appShell: document.querySelector(".app-shell"),
  mealPickerModal: document.getElementById("meal-picker-modal"),
  closeMealPickerBtn: document.getElementById("close-meal-picker-btn"),
  mealPickerFilter: document.getElementById("meal-picker-filter"),
  mealPickerList: document.getElementById("meal-picker-list"),
  mealEditorModal: document.getElementById("meal-editor-modal"),
  closeMealEditorBtn: document.getElementById("close-meal-editor-btn"),
  mealEditorForm: document.getElementById("meal-editor-form"),
  mealNameInput: document.getElementById("meal-name-input"),
  mealItemEntry: document.getElementById("meal-item-entry"),
  mealItemOptions: document.getElementById("meal-item-options"),
  mealItemSection: document.getElementById("meal-item-section"),
  mealItemAddBtn: document.getElementById("meal-item-add-btn"),
  mealDraftList: document.getElementById("meal-draft-list"),
  saveMealBtn: document.getElementById("save-meal-btn"),
  mealEditorList: document.getElementById("meal-editor-list"),
  openAddMealPopupBtn: document.getElementById("open-add-meal-popup-btn"),
  addMealPopup: document.getElementById("add-meal-popup"),
  closeAddMealPopupBtn: document.getElementById("close-add-meal-popup-btn"),
  mealEditPopup: document.getElementById("meal-edit-popup"),
  mealEditForm: document.getElementById("meal-edit-form"),
  mealEditNameInput: document.getElementById("meal-edit-name-input"),
  mealEditItemEntry: document.getElementById("meal-edit-item-entry"),
  mealEditItemOptions: document.getElementById("meal-edit-item-options"),
  mealEditItemSection: document.getElementById("meal-edit-item-section"),
  mealEditItemAddBtn: document.getElementById("meal-edit-item-add-btn"),
  mealEditDraftList: document.getElementById("meal-edit-draft-list"),
  mealEditDeleteBtn: document.getElementById("meal-edit-delete-btn"),
  mealEditCancelBtn: document.getElementById("meal-edit-cancel-btn")
};

const dbPromise = openDB();
let supabase = null;
let suggestionTimer = null;
let lastSuggestionQuery = "";
let suggestionActiveIndex = -1;
let mealSuggestionActiveIndex = -1;
let addMealSuggestionActiveIndex = -1;
let mealEditSuggestionActiveIndex = -1;
let checkToastTimer = null;
let checkToastMode = "undo";
let dbFeedbackTimer = null;

init();

async function init() {
  guardPasscode();
  if (el.appVersion) el.appVersion.textContent = APP_VERSION;
  el.sectionSelect.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
  el.mealItemSection.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
  el.mealEditItemSection.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
  bindEvents();
  await loadLocal();
  state.hideBigShopItems = localStorage.getItem(HIDE_BIG_SHOP_FILTER_KEY) === "true";
  renderBigShopFilterButton();
  setAddCardCollapsed(true);
  el.addBigShopCheckbox.checked = true;
  setAddMode("item");
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
    navigator.serviceWorker.register("./sw.js");
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
  el.optionsFabBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const opening = el.optionsMenu.hidden;
    el.optionsMenu.hidden = !opening;
    document.body.classList.toggle("options-menu-open", opening);
  });
  el.optionsMenu.addEventListener("click", (ev) => ev.stopPropagation());
  document.addEventListener("click", () => {
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });

  el.addForm.addEventListener("submit", onAddItemSubmit);
  el.itemName.addEventListener("input", scheduleSuggestionsRender);
  el.itemName.addEventListener("focus", renderSuggestions);
  el.itemName.addEventListener("keydown", onSuggestionKeyDown);
  el.itemName.addEventListener("blur", () => {
    // Allow option tap to register before hiding.
    setTimeout(hideSuggestions, 120);
  });

  el.topUndoBtn.addEventListener("click", async () => {
    if (!state.lastAction) return;
    await undoLastAction();
    showInfoToast("Undid last action");
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });
  el.checkAllBtn.addEventListener("click", async () => {
    await checkAllActiveItems();
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });
  el.smallShopFilterBtn.addEventListener("click", () => {
    state.hideBigShopItems = !state.hideBigShopItems;
    localStorage.setItem(HIDE_BIG_SHOP_FILTER_KEY, String(state.hideBigShopItems));
    renderBigShopFilterButton();
    render();
    showInfoToast(state.hideBigShopItems ? "Hiding big shop items" : "Showing full list");
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });

  el.addFavouritesBtn.addEventListener("click", () => {
    addFavouritesToList();
    showInfoToast("Added favourite items");
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });
  el.addModeItemBtn.addEventListener("click", () => setAddMode("item"));
  el.addModeMealBtn.addEventListener("click", () => setAddMode("meal"));
  el.addMealFilter.addEventListener("input", () => {
    state.mealPickerQuery = el.addMealFilter.value.trim();
    renderAddMealSuggestions();
  });
  el.addMealFilter.addEventListener("focus", renderAddMealSuggestions);
  el.addMealFilter.addEventListener("keydown", onAddMealSuggestionKeyDown);
  el.addMealFilter.addEventListener("blur", () => {
    setTimeout(hideAddMealSuggestions, 120);
  });
  el.addSelectedMealBtn.addEventListener("click", async () => {
    if (!state.selectedAddMealId) return;
    await addMealToList(state.selectedAddMealId);
  });
  el.manageMealsBtn.addEventListener("click", () => {
    openMealEditor();
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });

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
    el.optionsMenu.hidden = true;
    document.body.classList.remove("options-menu-open");
  });

  el.closeCheckedBtn.addEventListener("click", closeCheckedModal);
  el.closeMealPickerBtn.addEventListener("click", closeMealPicker);
  el.closeMealEditorBtn.addEventListener("click", closeMealEditor);
  el.mealPickerFilter.addEventListener("input", () => {
    state.mealPickerQuery = el.mealPickerFilter.value.trim();
    renderMealPicker();
  });
  el.mealEditorForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    await saveNewMealFromEditor();
  });
  el.openAddMealPopupBtn.addEventListener("click", () => {
    openAddMealPopup();
  });
  el.closeAddMealPopupBtn.addEventListener("click", () => {
    closeAddMealPopup();
  });
  el.mealItemAddBtn.addEventListener("click", () => {
    addMealDraftItemFromInput();
  });
  el.mealItemEntry.addEventListener("input", () => {
    const q = el.mealItemEntry.value.trim().toLowerCase();
    const guessed = guessSection(q);
    if (guessed) el.mealItemSection.value = guessed;
    renderMealItemSuggestions();
  });
  el.mealItemEntry.addEventListener("keydown", onMealSuggestionKeyDown);
  el.mealItemEntry.addEventListener("focus", renderMealItemSuggestions);
  el.mealItemEntry.addEventListener("blur", () => {
    setTimeout(hideMealItemSuggestions, 120);
  });
  el.mealEditForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    await saveEditedMeal();
  });
  el.mealEditDeleteBtn.addEventListener("click", async () => {
    await deleteEditedMeal();
  });
  el.mealEditItemAddBtn.addEventListener("click", () => {
    addMealEditDraftItemFromInput();
  });
  el.mealEditItemEntry.addEventListener("input", () => {
    const q = el.mealEditItemEntry.value.trim().toLowerCase();
    const guessed = guessSection(q);
    if (guessed) el.mealEditItemSection.value = guessed;
    renderMealEditItemSuggestions();
  });
  el.mealEditItemEntry.addEventListener("keydown", onMealEditSuggestionKeyDown);
  el.mealEditItemEntry.addEventListener("focus", renderMealEditItemSuggestions);
  el.mealEditItemEntry.addEventListener("blur", () => {
    setTimeout(hideMealEditItemSuggestions, 120);
  });
  el.mealEditCancelBtn.addEventListener("click", () => {
    closeMealEditPopup();
  });
  if (el.checkedFilterInput) {
    el.checkedFilterInput.addEventListener("input", () => {
      state.dbFilterQuery = el.checkedFilterInput.value.trim();
      renderCheckedModal();
    });
  }

  el.checkToast.addEventListener("click", async () => {
    if (checkToastMode === "undo") {
      if (!state.lastAction) return;
      await undoLastAction();
    }
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
  if (isActiveDuplicateName(name)) {
    showDuplicateToast(name);
    return;
  }

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
  captureUndo("add", { id: item.id, name: item.name });
  render();
  enqueue("upsert", item).catch(() => {});
  upsertSuggestion(name, item.section).catch(() => {});
  if (el.addBigShopCheckbox.checked) {
    setBigShop(name, true, item.section).catch(() => {});
  }

  el.addForm.reset();
  el.addBigShopCheckbox.checked = true;
  hideSuggestions();
  setAddCardCollapsed(true);
  syncNow();
}

function render() {
  const grouped = new Map(SECTIONS.map((s) => [s, []]));
  for (const item of state.items) {
    if (item.checked || item.deleted_at) continue;
    if (state.hideBigShopItems && isBigShopItem(item)) continue;
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
      <span class="item-name">
        <span class="item-status-icons"></span>
        <span class="item-name-text"></span>
      </span>
      <span class="item-qty"></span>
    </button>
    <div class="item-menu-wrap">
      <button class="item-menu-btn" type="button" aria-label="Item actions">...</button>
      <div class="item-menu" hidden>
        <button class="item-menu-fav-btn db-icon-btn db-fav-btn item-menu-action-btn" type="button"></button>
        <button class="item-menu-big-btn db-icon-btn db-big-shop-btn item-menu-action-btn" type="button"></button>
      </div>
    </div>
  `;

  row.querySelector(".item-status-icons").textContent = getItemStatusPrefix(item);
  row.querySelector(".item-name-text").textContent = item.name;
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

  const menuWrap = row.querySelector(".item-menu-wrap");
  const menuBtn = row.querySelector(".item-menu-btn");
  const menu = row.querySelector(".item-menu");
  const favBtn = row.querySelector(".item-menu-fav-btn");
  const bigBtn = row.querySelector(".item-menu-big-btn");

  const refreshMenuLabels = () => {
    const favActive = isFavouriteItem(item);
    const bigActive = isBigShopItem(item);
    favBtn.innerHTML = `<span class="action-icon">${favActive ? "★" : "☆"}</span><span class="action-label">${favActive ? "Remove favourite" : "Mark favourite"}</span>`;
    favBtn.title = favActive ? "Remove favourite" : "Mark favourite";
    favBtn.setAttribute("aria-label", favBtn.title);
    bigBtn.innerHTML = `<span class="action-icon">🛒</span><span class="action-label">${bigActive ? "Remove big shop" : "Mark big shop"}</span>`;
    bigBtn.title = bigActive ? "Remove big shop" : "Mark big shop";
    bigBtn.setAttribute("aria-label", bigBtn.title);
    bigBtn.classList.toggle("is-active", bigActive);
  };
  refreshMenuLabels();

  menuBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const isOpen = !menu.hidden;
    document.querySelectorAll(".item-menu").forEach((m) => { m.hidden = true; });
    menu.hidden = isOpen;
  });

  favBtn.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    const prevFavourite = isFavouriteItem(item);
    const prevBigShop = isBigShopItem(item);
    const actionMessage = prevFavourite ? "Removed favourite" : "Marked favourite";
    captureUndo("item-meta", {
      name: item.name,
      section: getEffectiveSection(item),
      favourite: prevFavourite,
      big_shop: prevBigShop,
      action_message: actionMessage
    });
    await setFavourite(item.name, !prevFavourite, getEffectiveSection(item));
    refreshMenuLabels();
    render();
    menu.hidden = true;
  });

  bigBtn.addEventListener("click", async (ev) => {
    ev.stopPropagation();
    const prevFavourite = isFavouriteItem(item);
    const prevBigShop = isBigShopItem(item);
    const actionMessage = prevBigShop ? "Removed big shop" : "Marked big shop";
    captureUndo("item-meta", {
      name: item.name,
      section: getEffectiveSection(item),
      favourite: prevFavourite,
      big_shop: prevBigShop,
      action_message: actionMessage
    });
    await setBigShop(item.name, !prevBigShop, getEffectiveSection(item));
    refreshMenuLabels();
    render();
    menu.hidden = true;
  });

  menuWrap.addEventListener("click", (ev) => ev.stopPropagation());
  document.addEventListener("click", () => { menu.hidden = true; });

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
        big_shop: Boolean(s.big_shop),
        checkedItem: null
      });
    } else {
      if (s.favourite) byKey.get(key).favourite = true;
      if (s.big_shop) byKey.get(key).big_shop = true;
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
        big_shop: false,
        checkedItem: item
      });
    } else {
      byKey.get(key).checkedItem = item;
    }
  }

  if (el.checkedFilterInput) {
    el.checkedFilterInput.value = state.dbFilterQuery;
  }

  const filterQuery = state.dbFilterQuery.trim().toLowerCase();
  const entries = [...byKey.values()]
    .filter((entry) => !filterQuery || entry.name.toLowerCase().includes(filterQuery))
    .sort((a, b) => a.name.localeCompare(b.name));
  el.checkedList.innerHTML = "";

  if (!entries.length) {
    const emptyLi = document.createElement("li");
    emptyLi.className = "item-row db-empty-row";
    emptyLi.textContent = "No items match your filter.";
    el.checkedList.appendChild(emptyLi);
    return;
  }

  for (const entry of entries) {
    const isExpanded = false;
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <div class="db-row-card">
        <button class="db-row-toggle" type="button" aria-expanded="${isExpanded ? "true" : "false"}">
          <span class="item-name"></span>
          <span class="db-row-chevron">${isExpanded ? "▾" : "▸"}</span>
        </button>
        <div class="db-row-details"${isExpanded ? "" : " hidden"}>
          <div class="db-section-row">
            <label>Section</label>
            <select class="db-section-select"></select>
          </div>
          <div class="db-actions"></div>
        </div>
      </div>
    `;

    li.querySelector(".item-name").textContent = entry.name;
    const toggleBtn = li.querySelector(".db-row-toggle");
    const details = li.querySelector(".db-row-details");
    const chevron = li.querySelector(".db-row-chevron");
    toggleBtn.addEventListener("click", () => {
      const currentlyExpanded = !details.hidden;
      details.hidden = currentlyExpanded;
      toggleBtn.setAttribute("aria-expanded", currentlyExpanded ? "false" : "true");
      chevron.textContent = currentlyExpanded ? "▸" : "▾";
    });

    const sectionSelect = li.querySelector(".db-section-select");
    sectionSelect.innerHTML = SECTIONS.map((s) => `<option value="${s}">${s}</option>`).join("");
    sectionSelect.value = normalizeSection(entry.section) || SECTIONS[0];

    sectionSelect.addEventListener("change", async () => {
      await updateEntrySection(entry.name, sectionSelect.value);
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
      renderCheckedModal();
    });
    actions.appendChild(favBtn);

    const bigShopBtn = document.createElement("button");
    bigShopBtn.type = "button";
    bigShopBtn.className = "db-icon-btn db-big-shop-btn";
    bigShopBtn.textContent = "🛒";
    bigShopBtn.title = entry.big_shop ? "Remove from Big Shop" : "Mark as Big Shop";
    bigShopBtn.setAttribute("aria-label", bigShopBtn.title);
    if (entry.big_shop) bigShopBtn.classList.add("is-active");
    bigShopBtn.addEventListener("click", async () => {
      const previousWindowScrollY = window.scrollY;
      const checkedModalContent = el.checkedModal.querySelector(".modal-content");
      const previousScrollTop = checkedModalContent ? checkedModalContent.scrollTop : 0;
      await setBigShop(entry.name, !entry.big_shop, entry.section);
      renderCheckedModal();
      const nextCheckedModalContent = el.checkedModal.querySelector(".modal-content");
      if (nextCheckedModalContent) nextCheckedModalContent.scrollTop = previousScrollTop;
      window.scrollTo(0, previousWindowScrollY);
      render();
    });
    actions.appendChild(bigShopBtn);

    const renameBtn = document.createElement("button");
    renameBtn.type = "button";
    renameBtn.className = "db-icon-btn db-edit-btn";
    renameBtn.textContent = "✎";
    renameBtn.title = "Rename item";
    renameBtn.setAttribute("aria-label", "Rename item");
    renameBtn.addEventListener("click", async () => {
      const nextNameInput = window.prompt(`Rename "${entry.name}" to:`, entry.name);
      if (nextNameInput === null) return;
      const nextName = normalizeItemName(nextNameInput);
      if (!nextName) {
        showDbFeedback("Enter a valid item name");
        return;
      }
      if (canonicalNameKey(nextName) === canonicalNameKey(entry.name)) {
        showDbFeedback("Name is unchanged");
        return;
      }

      await renameDatabaseEntry(entry.name, nextName);
      renderCheckedModal();
      render();
      syncNow();
      showDbFeedback(`Renamed to ${nextName}`);
    });
    actions.appendChild(renameBtn);

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

function setAddMode(mode) {
  state.addMode = mode === "meal" ? "meal" : "item";
  const itemMode = state.addMode === "item";
  el.addModeItemBtn.classList.toggle("is-active", itemMode);
  el.addModeMealBtn.classList.toggle("is-active", !itemMode);
  el.addItemPane.hidden = !itemMode;
  el.addMealPane.hidden = itemMode;
  if (!itemMode) {
    state.mealPickerQuery = "";
    el.addMealFilter.value = "";
    state.selectedAddMealId = null;
    renderAddMealSuggestions();
  }
}

function renderAddMealSuggestions() {
  const q = state.mealPickerQuery.toLowerCase();
  const meals = [...state.meals]
    .filter((m) => !q || (m.name || "").toLowerCase().includes(q))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  el.addMealOptions.innerHTML = "";
  if (!meals.length) {
    state.selectedAddMealId = null;
    el.addSelectedMealBtn.disabled = true;
    el.addSelectedMealBtn.textContent = "Add meal items to list";
    hideAddMealSuggestions();
    return;
  }

  const visibleMeals = meals.slice(0, 12);
  addMealSuggestionActiveIndex = -1;
  el.addMealOptions.innerHTML = visibleMeals
    .map((meal) => `<button class="item-option-btn${state.selectedAddMealId === meal.id ? " is-active" : ""}" type="button" data-id="${escapeHtml(meal.id)}"><span>${escapeHtml(meal.name)}</span></button>`)
    .join("");
  el.addMealOptions.hidden = false;
  for (const btn of el.addMealOptions.querySelectorAll(".item-option-btn")) {
    btn.addEventListener("click", () => {
      const mealId = btn.getAttribute("data-id") || "";
      state.selectedAddMealId = mealId;
      const meal = state.meals.find((m) => m.id === mealId);
      if (meal?.name) el.addMealFilter.value = meal.name;
      hideAddMealSuggestions();
      updateAddMealSubmitButton();
    });
  }

  if (state.selectedAddMealId && !visibleMeals.some((m) => m.id === state.selectedAddMealId) && !meals.some((m) => m.id === state.selectedAddMealId)) {
    state.selectedAddMealId = null;
  }
  syncAddMealSuggestionActiveState();
  updateAddMealSubmitButton();
}

function hideAddMealSuggestions() {
  addMealSuggestionActiveIndex = -1;
  el.addMealOptions.innerHTML = "";
  el.addMealOptions.hidden = true;
}

function onAddMealSuggestionKeyDown(ev) {
  if (ev.key === "Enter" && el.addMealOptions.hidden) {
    ev.preventDefault();
    if (state.selectedAddMealId) el.addSelectedMealBtn.click();
    return;
  }

  const options = [...el.addMealOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;

  if (ev.key === "ArrowDown") {
    ev.preventDefault();
    addMealSuggestionActiveIndex = Math.min(options.length - 1, addMealSuggestionActiveIndex + 1);
    syncAddMealSuggestionActiveState();
    return;
  }

  if (ev.key === "ArrowUp") {
    ev.preventDefault();
    addMealSuggestionActiveIndex = Math.max(0, addMealSuggestionActiveIndex - 1);
    syncAddMealSuggestionActiveState();
    return;
  }

  if (ev.key === "Enter") {
    ev.preventDefault();
    if (addMealSuggestionActiveIndex >= 0 && options[addMealSuggestionActiveIndex]) {
      options[addMealSuggestionActiveIndex].click();
      return;
    }
    if (state.selectedAddMealId) el.addSelectedMealBtn.click();
    return;
  }

  if (ev.key === "Escape") {
    ev.preventDefault();
    hideAddMealSuggestions();
  }
}

function syncAddMealSuggestionActiveState() {
  const options = [...el.addMealOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;
  options.forEach((btn, idx) => {
    btn.classList.toggle("is-active", idx === addMealSuggestionActiveIndex);
  });
  const active = options[addMealSuggestionActiveIndex];
  if (active) active.scrollIntoView({ block: "nearest" });
}

function updateAddMealSubmitButton() {
  const selectedMeal = state.meals.find((m) => m.id === state.selectedAddMealId);
  el.addSelectedMealBtn.disabled = !selectedMeal;
  el.addSelectedMealBtn.textContent = "Add meal items to list";
}

function openMealPicker() {
  el.mealPickerModal.classList.add("is-open");
  el.appShell.classList.add("modal-focus");
  state.mealPickerQuery = "";
  el.mealPickerFilter.value = "";
  renderMealPicker();
}

function closeMealPicker() {
  el.mealPickerModal.classList.remove("is-open");
  el.appShell.classList.remove("modal-focus");
}

function openMealEditor() {
  el.mealEditorModal.classList.add("is-open");
  el.appShell.classList.add("modal-focus");
  state.mealDraftItems = [];
  el.mealNameInput.value = "";
  el.mealItemEntry.value = "";
  el.mealItemSection.value = SECTIONS[0];
  hideMealItemSuggestions();
  renderMealEditorList();
  renderMealDraftItems();
  closeAddMealPopup();
  closeMealEditPopup();
}

function closeMealEditor() {
  el.mealEditorModal.classList.remove("is-open");
  el.appShell.classList.remove("modal-focus");
  closeAddMealPopup();
}

function openAddMealPopup() {
  state.mealDraftItems = [];
  el.mealNameInput.value = "";
  el.mealItemEntry.value = "";
  el.mealItemSection.value = SECTIONS[0];
  hideMealItemSuggestions();
  renderMealDraftItems();
  el.addMealPopup.hidden = false;
  requestAnimationFrame(() => el.mealNameInput.focus());
}

function closeAddMealPopup() {
  state.mealDraftItems = [];
  hideMealItemSuggestions();
  el.addMealPopup.hidden = true;
}

function renderMealPicker() {
  const q = state.mealPickerQuery.toLowerCase();
  const meals = [...state.meals]
    .filter((m) => !q || (m.name || "").toLowerCase().includes(q))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  el.mealPickerList.innerHTML = "";
  if (!meals.length) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.textContent = "No meals yet. Create one in Manage Meals.";
    el.mealPickerList.appendChild(li);
    return;
  }

  for (const meal of meals) {
    const li = document.createElement("li");
    li.className = "item-row";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "item-main-btn";
    const count = state.mealItems.filter((i) => i.meal_id === meal.id).length;
    btn.innerHTML = `<span class="item-name-text">${escapeHtml(meal.name)}</span><span class="item-qty">${count} items</span>`;
    btn.addEventListener("click", async () => {
      await addMealToList(meal.id);
      closeMealPicker();
    });
    li.appendChild(btn);
    el.mealPickerList.appendChild(li);
  }
}

function renderMealEditorList() {
  const meals = [...state.meals].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  el.mealEditorList.innerHTML = "";
  if (!meals.length) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.textContent = "No meals yet.";
    el.mealEditorList.appendChild(li);
    return;
  }

  for (const meal of meals) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <div>
        <span class="item-name">${escapeHtml(meal.name)}</span>
      </div>
      <button class="icon-btn" type="button">Edit</button>
    `;
    const editBtn = li.querySelector("button");
    editBtn.addEventListener("click", () => openMealEditPopup(meal.id));
    el.mealEditorList.appendChild(li);
  }
}

function openMealEditPopup(mealId) {
  state.editingMealId = mealId;
  const meal = state.meals.find((m) => m.id === mealId);
  if (!meal) return;
  el.mealEditNameInput.value = meal.name || "";
  state.mealEditDraftItems = state.mealItems
    .filter((x) => x.meal_id === mealId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((x) => ({
      name: x.name,
      section: normalizeSection(x.section) || guessSection((x.name || "").toLowerCase()) || SECTIONS[0]
    }));
  renderMealEditDraftItems();
  el.mealEditItemEntry.value = "";
  el.mealEditItemSection.value = SECTIONS[0];
  hideMealEditItemSuggestions();
  el.mealEditPopup.hidden = false;
}

function closeMealEditPopup() {
  state.editingMealId = null;
  state.mealEditDraftItems = [];
  el.mealEditPopup.hidden = true;
}

function renderMealEditDraftItems() {
  el.mealEditDraftList.innerHTML = "";
  if (!state.mealEditDraftItems.length) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.textContent = "No items yet. Add one above.";
    el.mealEditDraftList.appendChild(li);
    return;
  }
  for (let i = 0; i < state.mealEditDraftItems.length; i += 1) {
    const draft = state.mealEditDraftItems[i];
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <div>
        <span class="item-name">${escapeHtml(draft.name)}</span>
        <div class="item-qty">${escapeHtml(draft.section || "")}</div>
      </div>
      <button class="db-icon-btn db-delete-btn" type="button" aria-label="Remove meal item">🗑</button>
    `;
    li.querySelector("button").addEventListener("click", () => {
      state.mealEditDraftItems.splice(i, 1);
      renderMealEditDraftItems();
    });
    el.mealEditDraftList.appendChild(li);
  }
}

function addMealEditDraftItemFromInput() {
  const name = normalizeItemName(el.mealEditItemEntry.value);
  if (!name) return;
  const key = canonicalNameKey(name);
  if (!key) return;
  if (state.mealEditDraftItems.some((x) => canonicalNameKey(x.name) === key)) {
    showInfoToast(`${name} already in meal`);
    return;
  }
  const section = normalizeSection(el.mealEditItemSection.value)
    || normalizeSection(state.suggestions.find((s) => canonicalNameKey(s.name) === key)?.section)
    || guessSection(name.toLowerCase())
    || SECTIONS[0];
  state.mealEditDraftItems.push({ name, section });
  renderMealEditDraftItems();
  el.mealEditItemEntry.value = "";
  el.mealEditItemSection.value = section;
  hideMealEditItemSuggestions();
  el.mealEditItemEntry.focus();
}

function renderMealEditItemSuggestions() {
  const q = el.mealEditItemEntry.value.trim().toLowerCase();
  if (q.length < 2) return hideMealEditItemSuggestions();
  const byKey = new Map();
  for (const s of state.suggestionIndex) {
    const key = canonicalNameKey(s.name);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, s.name);
  }
  const matches = [...byKey.values()].filter((name) => name.toLowerCase().includes(q)).slice(0, 8);
  if (!matches.length) return hideMealEditItemSuggestions();
  mealEditSuggestionActiveIndex = -1;
  el.mealEditItemOptions.innerHTML = matches
    .map((name) => `<button class="item-option-btn" type="button" data-value="${escapeHtml(name)}"><span>${escapeHtml(name)}</span></button>`)
    .join("");
  el.mealEditItemOptions.hidden = false;
  for (const btn of el.mealEditItemOptions.querySelectorAll(".item-option-btn")) {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-value") || "";
      el.mealEditItemEntry.value = value;
      const key = canonicalNameKey(value);
      const section = normalizeSection(state.suggestions.find((s) => canonicalNameKey(s.name) === key)?.section)
        || guessSection(value.toLowerCase())
        || SECTIONS[0];
      el.mealEditItemSection.value = section;
      hideMealEditItemSuggestions();
      el.mealEditItemEntry.focus();
    });
  }
  syncMealEditSuggestionActiveState();
}

function hideMealEditItemSuggestions() {
  mealEditSuggestionActiveIndex = -1;
  el.mealEditItemOptions.innerHTML = "";
  el.mealEditItemOptions.hidden = true;
}

function onMealEditSuggestionKeyDown(ev) {
  if (el.mealEditItemOptions.hidden) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      addMealEditDraftItemFromInput();
    }
    return;
  }
  const options = [...el.mealEditItemOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;
  if (ev.key === "ArrowDown") {
    ev.preventDefault();
    mealEditSuggestionActiveIndex = Math.min(options.length - 1, mealEditSuggestionActiveIndex + 1);
    return syncMealEditSuggestionActiveState();
  }
  if (ev.key === "ArrowUp") {
    ev.preventDefault();
    mealEditSuggestionActiveIndex = Math.max(0, mealEditSuggestionActiveIndex - 1);
    return syncMealEditSuggestionActiveState();
  }
  if (ev.key === "Enter") {
    ev.preventDefault();
    if (mealEditSuggestionActiveIndex >= 0 && options[mealEditSuggestionActiveIndex]) return options[mealEditSuggestionActiveIndex].click();
    return addMealEditDraftItemFromInput();
  }
  if (ev.key === "Escape") {
    ev.preventDefault();
    hideMealEditItemSuggestions();
  }
}

function syncMealEditSuggestionActiveState() {
  const options = [...el.mealEditItemOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;
  options.forEach((btn, idx) => btn.classList.toggle("is-active", idx === mealEditSuggestionActiveIndex));
  const active = options[mealEditSuggestionActiveIndex];
  if (active) active.scrollIntoView({ block: "nearest" });
}

function renderMealDraftItems() {
  el.mealDraftList.innerHTML = "";
  if (!state.mealDraftItems.length) {
    const li = document.createElement("li");
    li.className = "item-row";
    li.textContent = "No items yet. Add one above.";
    el.mealDraftList.appendChild(li);
    return;
  }

  for (let i = 0; i < state.mealDraftItems.length; i += 1) {
    const draft = state.mealDraftItems[i];
    const li = document.createElement("li");
    li.className = "item-row";
    li.innerHTML = `
      <div>
        <span class="item-name">${escapeHtml(draft.name)}</span>
        <div class="item-qty">${escapeHtml(draft.section || "")}</div>
      </div>
      <button class="db-icon-btn db-delete-btn" type="button" aria-label="Remove meal item">🗑</button>
    `;
    const removeBtn = li.querySelector("button");
    removeBtn.addEventListener("click", () => {
      state.mealDraftItems.splice(i, 1);
      renderMealDraftItems();
    });
    el.mealDraftList.appendChild(li);
  }
}

function addMealDraftItemFromInput() {
  const name = normalizeItemName(el.mealItemEntry.value);
  if (!name) return;
  const key = canonicalNameKey(name);
  if (!key) return;
  if (state.mealDraftItems.some((x) => canonicalNameKey(x.name) === key)) {
    showInfoToast(`${name} already in meal`);
    return;
  }

  const section = normalizeSection(el.mealItemSection.value)
    || normalizeSection(state.suggestions.find((s) => canonicalNameKey(s.name) === key)?.section)
    || guessSection(name.toLowerCase())
    || SECTIONS[0];
  state.mealDraftItems.push({ name, section });
  renderMealDraftItems();
  el.mealItemEntry.value = "";
  el.mealItemSection.value = section;
  hideMealItemSuggestions();
  el.mealItemEntry.focus();
}

function renderMealItemSuggestions() {
  const q = el.mealItemEntry.value.trim().toLowerCase();
  if (q.length < 2) {
    hideMealItemSuggestions();
    return;
  }

  const byKey = new Map();
  for (const s of state.suggestionIndex) {
    const key = canonicalNameKey(s.name);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, s.name);
  }
  const matches = [...byKey.values()]
    .filter((name) => name.toLowerCase().includes(q))
    .slice(0, 8);
  if (!matches.length) {
    hideMealItemSuggestions();
    return;
  }

  mealSuggestionActiveIndex = -1;
  el.mealItemOptions.innerHTML = matches
    .map((name) => `<button class="item-option-btn" type="button" data-value="${escapeHtml(name)}"><span>${escapeHtml(name)}</span></button>`)
    .join("");
  el.mealItemOptions.hidden = false;
  for (const btn of el.mealItemOptions.querySelectorAll(".item-option-btn")) {
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-value") || "";
      el.mealItemEntry.value = value;
      const key = canonicalNameKey(value);
      const section = normalizeSection(state.suggestions.find((s) => canonicalNameKey(s.name) === key)?.section)
        || guessSection(value.toLowerCase())
        || SECTIONS[0];
      el.mealItemSection.value = section;
      hideMealItemSuggestions();
      el.mealItemEntry.focus();
    });
  }
  syncMealSuggestionActiveState();
}

function hideMealItemSuggestions() {
  mealSuggestionActiveIndex = -1;
  el.mealItemOptions.innerHTML = "";
  el.mealItemOptions.hidden = true;
}

function onMealSuggestionKeyDown(ev) {
  if (el.mealItemOptions.hidden) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      addMealDraftItemFromInput();
    }
    return;
  }

  const options = [...el.mealItemOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;

  if (ev.key === "ArrowDown") {
    ev.preventDefault();
    mealSuggestionActiveIndex = Math.min(options.length - 1, mealSuggestionActiveIndex + 1);
    syncMealSuggestionActiveState();
    return;
  }

  if (ev.key === "ArrowUp") {
    ev.preventDefault();
    mealSuggestionActiveIndex = Math.max(0, mealSuggestionActiveIndex - 1);
    syncMealSuggestionActiveState();
    return;
  }

  if (ev.key === "Enter") {
    ev.preventDefault();
    if (mealSuggestionActiveIndex >= 0 && options[mealSuggestionActiveIndex]) {
      options[mealSuggestionActiveIndex].click();
      return;
    }
    addMealDraftItemFromInput();
    return;
  }

  if (ev.key === "Escape") {
    ev.preventDefault();
    hideMealItemSuggestions();
  }
}

function syncMealSuggestionActiveState() {
  const options = [...el.mealItemOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;
  options.forEach((btn, idx) => {
    btn.classList.toggle("is-active", idx === mealSuggestionActiveIndex);
  });
  const active = options[mealSuggestionActiveIndex];
  if (active) active.scrollIntoView({ block: "nearest" });
}

async function saveNewMealFromEditor() {
  const name = normalizeItemName(el.mealNameInput.value);
  if (!name) {
    showInfoToast("Enter a meal name");
    return;
  }

  if (!state.mealDraftItems.length) {
    showInfoToast("Add at least one meal item");
    return;
  }

  const existing = state.meals.find((m) => canonicalNameKey(m.name) === canonicalNameKey(name));
  if (existing) {
    showInfoToast("A meal with that name already exists");
    return;
  }

  const meal = {
    id: crypto.randomUUID(),
    household_id: APP_CONFIG.householdId,
    name,
    updated_at: new Date().toISOString()
  };
  state.meals.push(meal);

  const dedupedDraftItems = [];
  const seenDraftKeys = new Set();
  for (const draftItem of state.mealDraftItems) {
    const key = canonicalNameKey(draftItem.name);
    if (!key || seenDraftKeys.has(key)) continue;
    seenDraftKeys.add(key);
    dedupedDraftItems.push(draftItem);
  }

  const newMealItems = dedupedDraftItems.map((draftItem, idx) => {
    const itemName = normalizeItemName(draftItem.name);
    const existingItem = state.mealItems.find((x) => x.meal_id === meal.id && canonicalNameKey(x.name) === canonicalNameKey(itemName));
    return {
      id: existingItem?.id || crypto.randomUUID(),
      meal_id: meal.id,
      household_id: APP_CONFIG.householdId,
      name: itemName,
      section: normalizeSection(draftItem.section)
        || state.suggestions.find((s) => canonicalNameKey(s.name) === canonicalNameKey(itemName))?.section
        || "",
      sort_order: idx,
      updated_at: new Date().toISOString()
    };
  });

  await replaceMealItems(meal.id, newMealItems);
  await enqueue("upsert", meal, "meals");
  await persistLocal();
  renderMealEditorList();
  state.mealDraftItems = [];
  el.mealNameInput.value = "";
  renderMealDraftItems();
  closeAddMealPopup();
  showInfoToast("Meal saved");
  syncNow();
}

async function saveEditedMeal() {
  const meal = state.meals.find((m) => m.id === state.editingMealId);
  if (!meal) return;
  const nextName = normalizeItemName(el.mealEditNameInput.value);
  if (!nextName) {
    showInfoToast("Enter a meal name");
    return;
  }
  const lines = state.mealEditDraftItems
    .map((x) => normalizeItemName(x.name))
    .filter(Boolean);
  if (!lines.length) {
    showInfoToast("Add at least one meal item");
    return;
  }
  const dupName = state.meals.find((m) => m.id !== meal.id && canonicalNameKey(m.name) === canonicalNameKey(nextName));
  if (dupName) {
    showInfoToast("A meal with that name already exists");
    return;
  }

  meal.name = nextName;
  meal.updated_at = new Date().toISOString();
  const seenLineKeys = new Set();
  const uniqueLines = lines.filter((x) => {
    const key = canonicalNameKey(x);
    if (!key || seenLineKeys.has(key)) return false;
    seenLineKeys.add(key);
    return true;
  });
  const newMealItems = uniqueLines.map((itemName, idx) => ({
    id: state.mealItems.find((x) => x.meal_id === meal.id && canonicalNameKey(x.name) === canonicalNameKey(itemName))?.id || crypto.randomUUID(),
    meal_id: meal.id,
    household_id: APP_CONFIG.householdId,
    name: itemName,
    section: normalizeSection(state.mealEditDraftItems.find((x) => canonicalNameKey(x.name) === canonicalNameKey(itemName))?.section || "")
      || normalizeSection(state.suggestions.find((s) => canonicalNameKey(s.name) === canonicalNameKey(itemName))?.section || "")
      || "",
    sort_order: idx,
    updated_at: new Date().toISOString()
  }));
  await replaceMealItems(meal.id, newMealItems);
  await enqueue("upsert", meal, "meals");
  await persistLocal();
  closeMealEditPopup();
  renderMealEditorList();
  showInfoToast("Meal updated");
  syncNow();
}

async function deleteEditedMeal() {
  const meal = state.meals.find((m) => m.id === state.editingMealId);
  if (!meal) return;
  const ok = window.confirm(`Delete meal "${meal.name}"?`);
  if (!ok) return;

  state.meals = state.meals.filter((m) => m.id !== meal.id);
  const removedItems = state.mealItems.filter((x) => x.meal_id === meal.id);
  state.mealItems = state.mealItems.filter((x) => x.meal_id !== meal.id);
  await persistLocal();
  await apiDelete("meals", { eq: { id: meal.id } });
  for (const item of removedItems) {
    await apiDelete("meal_items", { eq: { id: item.id } });
  }
  closeMealEditPopup();
  renderMealEditorList();
  showInfoToast("Meal deleted");
}

async function replaceMealItems(mealId, nextItems) {
  const existing = state.mealItems.filter((x) => x.meal_id === mealId);
  state.mealItems = state.mealItems.filter((x) => x.meal_id !== mealId).concat(nextItems);
  for (const item of nextItems) {
    await enqueue("upsert", item, "meal_items");
  }
  for (const removed of existing) {
    if (nextItems.some((x) => x.id === removed.id)) continue;
    await apiDelete("meal_items", { eq: { id: removed.id } });
  }
}

async function addMealToList(mealId) {
  const meal = state.meals.find((m) => m.id === mealId);
  if (!meal) return;
  const mealItems = state.mealItems
    .filter((x) => x.meal_id === mealId)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const active = getActiveUncheckedNameKeys();
  let added = 0;
  let skipped = 0;

  for (const mealItem of mealItems) {
    const name = normalizeItemName(mealItem.name);
    const key = canonicalNameKey(name);
    if (!name || !key) continue;
    if (active.has(key)) {
      skipped += 1;
      continue;
    }
    const section = normalizeSection(mealItem.section)
      || normalizeSection(state.suggestions.find((s) => canonicalNameKey(s.name) === key)?.section)
      || guessSection(name.toLowerCase())
      || SECTIONS[0];
    const item = {
      id: crypto.randomUUID(),
      household_id: APP_CONFIG.householdId,
      name,
      section,
      quantity_text: "",
      checked: false,
      deleted_at: null,
      updated_at: new Date().toISOString()
    };
    state.items.push(item);
    active.add(key);
    added += 1;
    await enqueue("upsert", item);
    await upsertSuggestion(name, section);
  }

  render();
  syncNow();
  showInfoToast(`Added ${added} from ${meal.name}${skipped ? `, skipped ${skipped}` : ""}`);
}

function renderSuggestions() {
  const q = el.itemName.value.trim().toLowerCase();
  applySectionGuess(q);
  applyAddFlagDefaults(q);

  if (q.length < 3) {
    lastSuggestionQuery = q;
    hideSuggestions();
    return;
  }

  if (q === lastSuggestionQuery && el.itemOptions.children.length > 0 && !el.itemOptions.hidden) return;
  lastSuggestionQuery = q;

  const activeNameKeys = getActiveUncheckedNameKeys();
  const byKey = new Map();

  for (const s of state.suggestionIndex) {
    const key = canonicalNameKey(s.name);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, {
      name: s.name,
      nameLower: s.nameLower,
      use_count: s.use_count || 0,
      inList: activeNameKeys.has(key)
    });
  }

  for (const item of state.items) {
    if (item.deleted_at || item.checked) continue;
    const normalizedName = normalizeItemName(item.name);
    const key = canonicalNameKey(normalizedName);
    if (!key) continue;
    if (byKey.has(key)) continue;
    byKey.set(key, {
      name: normalizedName,
      nameLower: normalizedName.toLowerCase(),
      use_count: 0,
      inList: true
    });
  }

  const matches = [...byKey.values()]
    .filter((s) => s.nameLower.includes(q) && s.nameLower !== q)
    .sort((a, b) => {
      const aStarts = a.nameLower.startsWith(q) ? 0 : 1;
      const bStarts = b.nameLower.startsWith(q) ? 0 : 1;
      if (aStarts !== bStarts) return aStarts - bStarts;
      const aInList = a.inList ? 1 : 0;
      const bInList = b.inList ? 1 : 0;
      if (aInList !== bInList) return aInList - bInList;
      return b.use_count - a.use_count;
    })
    .slice(0, 5);

  if (!matches.length) {
    hideSuggestions();
    return;
  }

  el.itemOptions.innerHTML = matches
    .map((s) => {
      const secondary = s.inList ? `<span class="item-option-meta">Already on list</span>` : "";
      return `<button class="item-option-btn${s.inList ? " in-list" : ""}" type="button" data-value="${escapeHtml(s.name)}"><span>${escapeHtml(s.name)}</span>${secondary}</button>`;
    })
    .join("");
  el.itemOptions.hidden = false;
  suggestionActiveIndex = -1;

  for (const btn of el.itemOptions.querySelectorAll(".item-option-btn")) {
    btn.addEventListener("mousedown", (ev) => ev.preventDefault());
    btn.addEventListener("click", () => {
      const value = btn.getAttribute("data-value") || "";
      el.itemName.value = value;
      applySectionGuess(value.toLowerCase());
      applyAddFlagDefaults(value.toLowerCase());
      hideSuggestions();
    });
  }
}

function scheduleSuggestionsRender() {
  if (suggestionTimer) clearTimeout(suggestionTimer);
  suggestionTimer = setTimeout(() => {
    renderSuggestions();
    suggestionTimer = null;
  }, 80);
}

function hideSuggestions() {
  el.itemOptions.innerHTML = "";
  el.itemOptions.hidden = true;
  suggestionActiveIndex = -1;
}

function onSuggestionKeyDown(e) {
  if (el.itemOptions.hidden) return;
  const options = [...el.itemOptions.querySelectorAll(".item-option-btn")];
  if (!options.length) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    suggestionActiveIndex = (suggestionActiveIndex + 1) % options.length;
    applySuggestionHighlight(options, suggestionActiveIndex);
    return;
  }

  if (e.key === "ArrowUp") {
    e.preventDefault();
    suggestionActiveIndex = suggestionActiveIndex <= 0 ? options.length - 1 : suggestionActiveIndex - 1;
    applySuggestionHighlight(options, suggestionActiveIndex);
    return;
  }

  if (e.key === "Enter" && suggestionActiveIndex >= 0) {
    e.preventDefault();
    const btn = options[suggestionActiveIndex];
    if (btn) btn.click();
  }
}

function applySuggestionHighlight(options, index) {
  options.forEach((btn, i) => {
    const active = i === index;
    btn.classList.toggle("is-active", active);
    if (active) {
      btn.scrollIntoView({ block: "nearest" });
      const value = btn.getAttribute("data-value") || "";
      el.itemName.value = value;
      applySectionGuess(value.toLowerCase());
      applyAddFlagDefaults(value.toLowerCase());
    }
  });
}

function renderSyncBar() {
  const pendingCount = state.pending.length;
  const hasError = Boolean(state.lastSyncError);
  const effectivelyOnline = state.online && (supabase ? state.supabaseReachable : true);
  const warning = hasError || !effectivelyOnline;

  el.syncBar.className = `sync-bar ${warning ? "sync-conflict" : "sync-online"}`;
  el.syncText.textContent = warning ? "Sync warning" : state.syncing ? "Checking..." : "Online";

  if (warning && pendingCount > 0) {
    el.syncMeta.textContent = `${pendingCount} updates will sync once connectivity is restored`;
  } else if (warning) {
    el.syncMeta.textContent = state.lastSyncError || "Sync warning";
  } else if (pendingCount > 0) {
    el.syncMeta.textContent = state.syncing
      ? `Syncing ${pendingCount} pending updates...`
      : `${pendingCount} pending updates`;
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
  document.body.classList.toggle("add-panel-open", !collapsed);
  el.addFabBtn.textContent = collapsed ? "＋" : "－";
  el.addFabBtn.setAttribute("aria-label", collapsed ? "Show add new item panel" : "Hide add new item panel");
  el.addFabBtn.hidden = false;
  localStorage.setItem(ADD_CARD_COLLAPSED_KEY, String(collapsed));
  if (!collapsed) {
    // Focus after panel becomes visible so typing can start immediately.
    requestAnimationFrame(() => {
      if (state.addMode === "item") {
        el.itemName.focus();
      } else {
        el.addMealFilter.focus();
      }
    });
  }
}

function captureUndo(type, payload) {
  state.lastAction = { type, payload, ts: Date.now() };
  el.topUndoBtn.disabled = false;
  el.topUndoBtn.textContent = buildUndoButtonLabel(type, payload);
  if (type === "check" || type === "item-meta" || type === "add") {
    showCheckToast(payload?.name, payload?.action_message);
  }
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
  } else if (type === "item-meta") {
    const name = payload?.name || "";
    const section = payload?.section || "";
    await setFavourite(name, Boolean(payload?.favourite), section);
    await setBigShop(name, Boolean(payload?.big_shop), section);
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
  const key = message?.key || message?.summary || String(message);
  if (!state.conflictQueue.some((c) => (c?.key || c?.summary || String(c)) === key)) {
    state.conflictQueue.push(message);
  }
  showConflictSummary();
}

function showConflictSummary() {
  if (!state.conflictQueue.length) return;
  const rows = state.conflictQueue.map((entry, i) => {
    if (typeof entry === "string") {
      return `<div><strong>${i + 1}. ${escapeHtml(entry)}</strong></div>`;
    }
    const detailsHtml = (entry.details || [])
      .map((line) => `<div>${escapeHtml(line)}</div>`)
      .join("");
    return `
      <div class="conflict-entry">
        <strong>${i + 1}. ${escapeHtml(entry.summary || "Conflict detected")}</strong>
        <details>
          <summary>Show details</summary>
          <div class="conflict-details">${detailsHtml}</div>
        </details>
      </div>
    `;
  }).join("");
  el.conflictMessage.innerHTML = rows;
  el.conflictModal.classList.add("is-open");
}

function acknowledgeConflict() {
  state.conflictQueue = [];
  el.conflictModal.classList.remove("is-open");
}

function showCheckToast(itemName, actionMessage = "") {
  if (checkToastTimer) clearTimeout(checkToastTimer);
  checkToastMode = "undo";
  el.checkToast.classList.remove("is-error");
  el.checkToast.style.cursor = "pointer";
  const label = itemName ? String(itemName).trim() : "item";
  if (actionMessage) {
    el.checkToastText.textContent = `${actionMessage} for ${label}. Tap to undo.`;
  } else if (state.lastAction?.type === "add") {
    el.checkToastText.textContent = `Added ${label}. Tap to undo.`;
  } else {
    el.checkToastText.textContent = `Update saved for ${label}. Tap to undo.`;
  }
  el.checkToast.hidden = false;
  checkToastTimer = setTimeout(hideCheckToast, 3000);
}

function showDuplicateToast(itemName) {
  if (checkToastTimer) clearTimeout(checkToastTimer);
  checkToastMode = "info";
  el.checkToast.classList.add("is-error");
  el.checkToast.style.cursor = "default";
  el.checkToastText.textContent = `${itemName} is already on your list`;
  el.checkToast.hidden = false;
  checkToastTimer = setTimeout(hideCheckToast, 2600);
}

function showInfoToast(message) {
  if (checkToastTimer) clearTimeout(checkToastTimer);
  checkToastMode = "info";
  el.checkToast.classList.remove("is-error");
  el.checkToast.style.cursor = "default";
  el.checkToastText.textContent = message;
  el.checkToast.hidden = false;
  checkToastTimer = setTimeout(hideCheckToast, 2200);
}

function hideCheckToast() {
  if (checkToastTimer) clearTimeout(checkToastTimer);
  checkToastTimer = null;
  checkToastMode = "undo";
  el.checkToast.classList.remove("is-error");
  el.checkToast.style.cursor = "pointer";
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
  if (type === "item-meta") return "item options";
  return "action";
}

function buildUndoButtonLabel(type, payload) {
  const action = actionLabel(type);
  const name = (payload?.name || "").trim();
  if (name) return `Undo ${action} (${name})`;
  return `Undo ${action}`;
}

function renderBigShopFilterButton() {
  if (!el.smallShopFilterBtn) return;
  el.smallShopFilterBtn.textContent = state.hideBigShopItems ? "Show Full List" : "Hide Big Shop Items";
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

function applyAddFlagDefaults(queryLower) {
  const q = (queryLower || "").trim();
  if (!q) {
    el.addBigShopCheckbox.checked = true;
    return;
  }

  const match = state.suggestions.find((s) => {
    const name = (s.name || "").trim().toLowerCase();
    return name === q;
  });
  el.addBigShopCheckbox.checked = match ? Boolean(match.big_shop) : true;
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
    const opIndex = findNextPendingIndex();
    const op = state.pending[opIndex];
    const table = inferPendingTable(op);
    op.table = table;
    const { error } = await apiUpsert(table, op.payload);
    if (error) {
      state.lastSyncError = `sync failed: ${error.message}`;
      break;
    }
    state.pending.splice(opIndex, 1);
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

  if (!error) {
    await syncSuggestionsFromRemote();
    await syncMealsFromRemote();
  }

  state.syncing = false;
  render();
}

function findNextPendingIndex() {
  if (!state.pending.length) return 0;
  // Flush parent meal rows first so meal_items FK inserts do not block queue.
  const mealsIdx = state.pending.findIndex((op) => inferPendingTable(op) === "meals");
  if (mealsIdx >= 0) return mealsIdx;
  const nonMealItemsIdx = state.pending.findIndex((op) => inferPendingTable(op) !== "meal_items");
  if (nonMealItemsIdx >= 0) return nonMealItemsIdx;
  return 0;
}

function inferPendingTable(op) {
  const payload = op?.payload || {};
  if (op?.table === "shopping_items" || op?.table === "suggestion_items" || op?.table === "meals" || op?.table === "meal_items") {
    // Guard against old malformed queued ops that were written to shopping_items.
    if (op.table === "shopping_items" && payload?.meal_id) return "meal_items";
    if (op.table === "shopping_items" && payload?.checked === undefined && payload?.meal_id === undefined && payload?.name && payload?.updated_at) {
      return "meals";
    }
    return op.table;
  }

  if (payload?.meal_id) return "meal_items";
  if (payload?.checked !== undefined || payload?.deleted_at !== undefined || payload?.quantity_text !== undefined) return "shopping_items";
  if (payload?.favourite !== undefined || payload?.big_shop !== undefined || payload?.use_count !== undefined) return "suggestion_items";
  if (payload?.name && payload?.household_id) return "meals";
  return "shopping_items";
}

function detectConflicts(localItems, mergedItems) {
  const localById = new Map(localItems.map((i) => [i.id, i]));
  const pendingIds = new Set(
    state.pending
      .map((op) => op?.payload?.id)
      .filter(Boolean)
  );

  for (const remote of mergedItems) {
    const local = localById.get(remote.id);
    if (!local) continue;
    const rts = new Date(remote.updated_at).getTime();
    const lts = new Date(local.updated_at).getTime();
    if (rts <= lts) continue;
    if (!pendingIds.has(remote.id)) continue;
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
  let summary = `${label}: updated to latest version`;
  if (!local.deleted_at && remote.deleted_at) summary = `${label}: removed`;
  else if (!local.checked && remote.checked) summary = `${label}: marked checked`;
  else if (local.checked && !remote.checked) summary = `${label}: restored to active list`;
  else if (local.section !== remote.section) summary = `${label}: section updated to ${remote.section}`;
  else if (local.quantity_text !== remote.quantity_text) summary = `${label}: quantity updated to ${remote.quantity_text || "none"}`;
  else if (local.name !== remote.name) summary = `${local.name || "Item"}: renamed to ${remote.name}`;

  return {
    key: `conflict:${remote.id}:${remote.updated_at || ""}`,
    summary,
    details: [
      `Local -> name: ${local.name || "none"}, section: ${local.section || "none"}, qty: ${local.quantity_text || "none"}, checked: ${Boolean(local.checked)}, deleted: ${Boolean(local.deleted_at)}, updated_at: ${local.updated_at || "none"}`,
      `Remote -> name: ${remote.name || "none"}, section: ${remote.section || "none"}, qty: ${remote.quantity_text || "none"}, checked: ${Boolean(remote.checked)}, deleted: ${Boolean(remote.deleted_at)}, updated_at: ${remote.updated_at || "none"}`
    ]
  };
}

async function enqueue(type, payload, table = "shopping_items") {
  state.pending.push({ type, payload, table });
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

async function setBigShop(name, bigShop, fallbackSection = "") {
  const key = canonicalNameKey(name);
  if (!key) return;

  let found = false;
  for (const s of state.suggestions) {
    if (canonicalNameKey(s.name) !== key) continue;
    s.big_shop = bigShop;
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
      favourite: false,
      big_shop: bigShop
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

async function renameDatabaseEntry(currentName, nextNameInput) {
  const currentKey = canonicalNameKey(currentName);
  const nextName = normalizeItemName(nextNameInput);
  const nextKey = canonicalNameKey(nextName);
  if (!currentKey || !nextKey || currentKey === nextKey) return;

  const matchingSuggestions = state.suggestions.filter((s) => canonicalNameKey(s.name) === currentKey);
  const existingTargetSuggestions = state.suggestions.filter((s) => canonicalNameKey(s.name) === nextKey);
  const combined = [...matchingSuggestions, ...existingTargetSuggestions];

  if (combined.length) {
    const primary = { ...combined[0] };
    const sectionCandidate = combined.find((s) => normalizeSection(s.section))?.section || "";
    const useCount = combined.reduce((max, s) => Math.max(max, s.use_count || 0), 0) || 1;
    const lastUsedAt = combined.reduce((latest, s) => {
      const value = s.last_used_at || "";
      return value > latest ? value : latest;
    }, "");

    primary.name = nextName;
    primary.section = sectionCandidate;
    primary.favourite = combined.some((s) => Boolean(s.favourite));
    primary.big_shop = combined.some((s) => Boolean(s.big_shop));
    primary.use_count = useCount;
    primary.last_used_at = lastUsedAt || new Date().toISOString();

    const combinedIds = new Set(combined.map((s) => s.id));
    const removedSuggestions = combined.filter((s) => s.id !== primary.id);
    state.suggestions = state.suggestions.filter((s) => !combinedIds.has(s.id));
    state.suggestions.push(primary);
    await upsertSuggestionRemote(primary);
    await deleteSuggestionsRemote(removedSuggestions);
  }

  for (const item of state.items) {
    if (item.deleted_at) continue;
    if (canonicalNameKey(item.name) !== currentKey) continue;
    item.name = nextName;
    item.updated_at = new Date().toISOString();
    await enqueue("upsert", item);
  }

  rebuildSuggestionIndex();
  await persistLocal();
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

async function checkAllActiveItems() {
  const activeItems = state.items.filter((i) => !i.deleted_at && !i.checked);
  if (!activeItems.length) {
    showInfoToast("No active items to check");
    return;
  }

  const nowIso = new Date().toISOString();
  for (const item of activeItems) {
    item.checked = true;
    item.updated_at = nowIso;
    await enqueue("upsert", item);
  }

  render();
  syncNow();
  showInfoToast(`Checked ${activeItems.length} items`);
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
        big_shop: Boolean(remote.big_shop),
        use_count: remote.use_count || 1,
        last_used_at: remote.last_used_at || new Date().toISOString()
      });
      changed = true;
      continue;
    }

    local.id = remote.id || local.id;
    local.section = remote.section || local.section || "";
    local.favourite = Boolean(remote.favourite);
    local.big_shop = Boolean(remote.big_shop);
    local.use_count = Math.max(local.use_count || 1, remote.use_count || 1);
    local.last_used_at = remote.last_used_at || local.last_used_at;
    changed = true;
  }

  if (changed) {
    rebuildSuggestionIndex();
    await persistLocal();
  }
}

async function syncMealsFromRemote() {
  if (!supabase) return;
  const { data: mealRows, error: mealError } = await apiSelect("meals", {
    columns: "*",
    eq: { household_id: APP_CONFIG.householdId }
  });
  if (mealError || !mealRows) return;

  const { data: mealItemRows, error: itemError } = await apiSelect("meal_items", {
    columns: "*",
    eq: { household_id: APP_CONFIG.householdId }
  });
  if (itemError || !mealItemRows) return;

  const remoteMeals = mealRows.map((m) => ({
    id: m.id,
    household_id: m.household_id,
    name: normalizeItemName(m.name),
    updated_at: m.updated_at || new Date().toISOString()
  }));
  const remoteMealItems = mealItemRows.map((x) => ({
    id: x.id,
    meal_id: x.meal_id,
    household_id: x.household_id,
    name: normalizeItemName(x.name),
    section: x.section || "",
    sort_order: x.sort_order || 0,
    updated_at: x.updated_at || new Date().toISOString()
  }));

  // Merge remote onto local so unsynced local edits are not dropped from UI.
  state.meals = mergeById(state.meals, remoteMeals);
  state.mealItems = mergeById(state.mealItems, remoteMealItems);
  await persistLocal();
  renderMealPicker();
  renderAddMealSuggestions();
  renderMealEditorList();
}

async function upsertSuggestionRemote(suggestion) {
  if (!supabase || !suggestion) return;

  const payload = {
    id: suggestion.id,
    household_id: APP_CONFIG.householdId,
    name: normalizeItemName(suggestion.name),
    section: suggestion.section || "",
    favourite: Boolean(suggestion.favourite),
    big_shop: Boolean(suggestion.big_shop),
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

function getActiveUncheckedNameKeys() {
  const keys = new Set();
  for (const item of state.items) {
    if (item.deleted_at || item.checked) continue;
    const key = canonicalNameKey(item.name);
    if (!key) continue;
    keys.add(key);
  }
  return keys;
}

function isActiveDuplicateName(name) {
  const key = canonicalNameKey(name);
  if (!key) return false;
  return getActiveUncheckedNameKeys().has(key);
}

function isBigShopItem(item) {
  const key = canonicalNameKey(item?.name);
  if (!key) return false;
  return state.suggestions.some((s) => canonicalNameKey(s.name) === key && Boolean(s.big_shop));
}

function isFavouriteItem(item) {
  const key = canonicalNameKey(item?.name);
  if (!key) return false;
  return state.suggestions.some((s) => canonicalNameKey(s.name) === key && Boolean(s.favourite));
}

function getItemStatusPrefix(item) {
  let prefix = "";
  if (isFavouriteItem(item)) prefix += "★ ";
  if (isBigShopItem(item)) prefix += "🛒 ";
  return prefix;
}

async function loadLocal() {
  const db = await dbPromise;
  state.items = (await idbGet(db, "state", "items")) || [];
  state.suggestions = (await idbGet(db, "state", "suggestions")) || [];
  state.pending = (await idbGet(db, "state", "pending")) || [];
  state.meals = (await idbGet(db, "state", "meals")) || [];
  state.mealItems = (await idbGet(db, "state", "mealItems")) || [];
  rebuildSuggestionIndex();
}

async function persistLocal() {
  const db = await dbPromise;
  await idbSet(db, "state", "items", state.items);
  await idbSet(db, "state", "suggestions", state.suggestions);
  await idbSet(db, "state", "pending", state.pending);
  await idbSet(db, "state", "meals", state.meals);
  await idbSet(db, "state", "mealItems", state.mealItems);
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
