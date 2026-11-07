// Weekly shop planning wizard: pick days, favourites and meals per day, then
// add every ingredient to the list in one go (quantities merged across meals).

export function planDays(today = new Date(), count = 7) {
  const pad = (n) => String(n).padStart(2, "0");
  const days = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    days.push({
      iso: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      label: i === 0 ? `Today · ${label}` : label
    });
  }
  return days;
}

// entries: [{ name, section }] with one entry per time an ingredient is needed.
// Returns one row per distinct ingredient with how many times it was needed.
export function aggregateIngredients(entries, keyOf) {
  const byKey = new Map();
  for (const entry of entries) {
    const key = keyOf(entry.name);
    if (!key) continue;
    const row = byKey.get(key);
    if (row) {
      row.count += 1;
      if (!row.section && entry.section) row.section = entry.section;
    } else {
      byKey.set(key, { key, name: entry.name, section: entry.section || "", count: 1 });
    }
  }
  return [...byKey.values()];
}

// Quantity for an item that is already on the list. Plain numbers (or blank, meaning 1)
// are incremented; free text such as "500g" is left alone rather than guessed at.
export function mergeQuantity(existingText, add) {
  const text = (existingText || "").trim();
  if (!text) return String(1 + add);
  if (/^\d+$/.test(text)) return String(Number(text) + add);
  return existingText;
}

export function quantityForNew(count) {
  return count > 1 ? String(count) : "";
}

function icsEscape(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

// events: [{ iso: "YYYY-MM-DD", name, ingredients: [string] }] -> all-day VEVENTs.
// DTEND is exclusive, so it is the following day.
export function buildMealsIcs(events) {
  const compact = (dt) => dt.toISOString().slice(0, 10).replaceAll("-", "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//MSL//Meals//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH"];
  for (const ev of events) {
    const [y, m, d] = ev.iso.split("-").map(Number);
    lines.push(
      "BEGIN:VEVENT",
      `UID:${crypto.randomUUID()}@msl`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${compact(new Date(Date.UTC(y, m - 1, d)))}`,
      `DTEND;VALUE=DATE:${compact(new Date(Date.UTC(y, m - 1, d + 1)))}`,
      `SUMMARY:${icsEscape(ev.name)}`
    );
    if (ev.ingredients?.length) lines.push(`DESCRIPTION:${icsEscape(`Ingredients: ${ev.ingredients.join(", ")}`)}`);
    lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

// iOS cannot write to Calendar from a web app, so hand it an .ics via the share
// sheet (or a download fallback); the user confirms with "Add to Calendar".
export async function shareIcs(icsText, filename = "meals.ics") {
  const file = new File([icsText], filename, { type: "text/calendar" });
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Meal plan" });
      return;
    }
  } catch (err) {
    if (err?.name === "AbortError") return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}

// ctx supplies everything that lives in app.js:
// { sections, keyOf, normalizeName, guessSection, getMeals, getMealItems, getFavourites,
//   isOnList, createMeal(name, items), addToList(rows) -> { added, updated }, toast(msg) }
export function createWizard(ctx) {
  const root = {
    modal: document.getElementById("wizard-modal"),
    progress: document.getElementById("wizard-progress"),
    body: document.getElementById("wizard-body"),
    back: document.getElementById("wizard-back-btn"),
    next: document.getElementById("wizard-next-btn"),
    close: document.getElementById("wizard-close-btn")
  };

  let days = [];
  let plan;
  let uid = 0;

  function resetPlan() {
    days = planDays();
    plan = { step: 0, selectedDays: new Set(), favs: new Map(), dayMeals: new Map(), calendar: true };
    for (const fav of ctx.getFavourites()) {
      plan.favs.set(ctx.keyOf(fav.name), { ...fav, selected: !ctx.isOnList(fav.name) });
    }
  }

  const chosenDays = () => days.filter((d) => plan.selectedDays.has(d.iso));
  const steps = () => ["days", "favs", ...chosenDays().map((d) => d.iso), "review"];

  function open() {
    resetPlan();
    root.modal.classList.add("is-open");
    render();
  }

  function close(force = false) {
    const touched = plan.selectedDays.size > 0 || [...plan.dayMeals.values()].some((m) => m.length);
    if (!force && touched && !window.confirm("Discard this weekly plan?")) return;
    root.modal.classList.remove("is-open");
  }

  function render() {
    const all = steps();
    if (plan.step >= all.length) plan.step = all.length - 1;
    const step = all[plan.step];
    root.progress.textContent = `Step ${plan.step + 1} of ${all.length}`;
    root.body.innerHTML = "";
    root.back.hidden = plan.step === 0;
    root.next.textContent = step === "review" ? "Add to list" : "Next";

    if (step === "days") renderDays();
    else if (step === "favs") renderFavs();
    else if (step === "review") renderReview();
    else renderDay(days.find((d) => d.iso === step));
    root.body.scrollTop = 0;
  }

  function renderDays() {
    root.body.append(
      h("h3", { text: "Which days need meals?" }),
      h("p", { class: "wizard-hint", text: "Pick the days in the coming week you want to plan." })
    );
    const wrap = h("div", { class: "wizard-days" });
    for (const d of days) {
      const on = plan.selectedDays.has(d.iso);
      wrap.append(h("button", {
        type: "button",
        class: `wizard-day-btn${on ? " is-active" : ""}`,
        "aria-pressed": String(on),
        text: d.label,
        onclick: () => {
          if (plan.selectedDays.has(d.iso)) plan.selectedDays.delete(d.iso);
          else plan.selectedDays.add(d.iso);
          render();
        }
      }));
    }
    root.body.append(wrap);
  }

  function renderFavs() {
    root.body.append(
      h("h3", { text: "Add your favourites?" }),
      h("p", { class: "wizard-hint", text: "Untick anything you don't need this week." })
    );
    if (!plan.favs.size) {
      root.body.append(h("p", { class: "wizard-hint", text: "No favourites saved yet." }));
      return;
    }
    const list = h("div", { class: "wizard-checklist" });
    for (const fav of plan.favs.values()) {
      const input = h("input", { type: "checkbox", checked: fav.selected });
      input.addEventListener("change", () => { fav.selected = input.checked; });
      const onList = ctx.isOnList(fav.name);
      list.append(h("label", { class: "wizard-check" }, input, h("span", { text: onList ? `${fav.name} (already on list)` : fav.name })));
    }
    root.body.append(list);
  }

  function renderDay(day) {
    const meals = plan.dayMeals.get(day.iso) || [];
    plan.dayMeals.set(day.iso, meals);
    root.body.append(h("h3", { text: day.label }));

    const input = h("input", {
      type: "text",
      class: "wizard-input",
      placeholder: "Type a meal, e.g. Spaghetti bolognese",
      autocomplete: "off",
      autocapitalize: "none",
      spellcheck: "false"
    });
    const options = h("div", { class: "wizard-options" });
    const cards = h("div", { class: "wizard-cards" });
    root.body.append(input, options, cards);

    const addMeal = (meal) => {
      meals.push(meal);
      input.value = "";
      renderOptions();
      renderCards();
    };

    function renderOptions() {
      options.innerHTML = "";
      const raw = input.value.trim();
      if (!raw) return;
      const q = raw.toLowerCase();
      const matches = ctx.getMeals().filter((m) => m.name.toLowerCase().includes(q)).slice(0, 6);
      for (const m of matches) {
        options.append(h("button", {
          type: "button",
          class: "wizard-option",
          text: m.name,
          onclick: () => addMeal({
            uid: ++uid,
            name: m.name,
            isNew: false,
            items: ctx.getMealItems(m.id).map((i) => ({ name: i.name, section: i.section || "", selected: true }))
          })
        }));
      }
      const exact = ctx.getMeals().some((m) => ctx.keyOf(m.name) === ctx.keyOf(raw));
      if (!exact) {
        options.append(h("button", {
          type: "button",
          class: "wizard-option wizard-option-new",
          text: `＋ Create new meal "${ctx.normalizeName(raw)}"`,
          onclick: () => addMeal({ uid: ++uid, name: ctx.normalizeName(raw), isNew: true, items: [] })
        }));
      }
    }
    input.addEventListener("input", renderOptions);

    function renderCards(focusUid = null) {
      cards.innerHTML = "";
      for (const meal of meals) {
        const card = h("div", { class: "wizard-card" });
        card.append(h("div", { class: "wizard-card-head" },
          h("strong", { text: meal.isNew ? `${meal.name} (new)` : meal.name }),
          h("button", {
            type: "button",
            class: "icon-btn wizard-remove",
            "aria-label": `Remove ${meal.name}`,
            text: "✕",
            onclick: () => { meals.splice(meals.indexOf(meal), 1); renderCards(); }
          })
        ));
        if (!meal.items.length && !meal.isNew) {
          card.append(h("p", { class: "wizard-hint", text: "No ingredients saved for this meal yet." }));
        }
        for (const item of meal.items) {
          const cb = h("input", { type: "checkbox", checked: item.selected });
          cb.addEventListener("change", () => { item.selected = cb.checked; });
          card.append(h("label", { class: "wizard-check" }, cb, h("span", { text: item.name })));
        }
        if (meal.isNew) {
          const ing = h("input", { type: "text", class: "wizard-input", placeholder: "Add an ingredient", autocomplete: "off", spellcheck: "false" });
          const add = () => {
            const name = ctx.normalizeName(ing.value);
            if (!name) return;
            if (!meal.items.some((i) => ctx.keyOf(i.name) === ctx.keyOf(name))) {
              meal.items.push({ name, section: ctx.guessSection(name.toLowerCase()), selected: true });
            }
            renderCards(meal.uid);
          };
          ing.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") { ev.preventDefault(); ev.stopPropagation(); add(); }
          });
          card.append(h("div", { class: "wizard-ing-row" }, ing, h("button", { type: "button", class: "icon-btn", text: "Add", onclick: add })));
          card.dataset.uid = String(meal.uid);
        }
        cards.append(card);
      }
      if (focusUid != null) cards.querySelector(`[data-uid="${focusUid}"] input[type="text"]`)?.focus();
    }
    renderCards();
  }

  function collect() {
    const entries = [];
    for (const fav of plan.favs.values()) {
      if (fav.selected) entries.push({ name: fav.name, section: fav.section || "" });
    }
    const meals = [];
    for (const day of chosenDays()) {
      for (const meal of plan.dayMeals.get(day.iso) || []) {
        meals.push({ iso: day.iso, meal });
        for (const item of meal.items) {
          if (item.selected) entries.push({ name: item.name, section: item.section });
        }
      }
    }
    return { rows: aggregateIngredients(entries, ctx.keyOf), meals };
  }

  function renderReview() {
    const { rows, meals } = collect();
    root.body.append(h("h3", { text: "Review your plan" }));
    if (!rows.length) {
      root.body.append(h("p", { class: "wizard-hint", text: "Nothing selected yet. Go back to add favourites or meals." }));
    } else {
      root.body.append(h("p", { class: "wizard-hint", text: `${rows.length} item${rows.length === 1 ? "" : "s"} will be added. Ingredients needed by several meals get a higher quantity.` }));
      const list = h("ul", { class: "wizard-review" });
      for (const row of rows) list.append(h("li", { text: row.count > 1 ? `${row.name} × ${row.count}` : row.name }));
      root.body.append(list);
    }

    const newNames = [...new Set(meals.filter((m) => m.meal.isNew).map((m) => m.meal.name))];
    if (newNames.length) {
      root.body.append(h("p", { class: "wizard-hint", text: `Saved as new meal${newNames.length === 1 ? "" : "s"} for next time: ${newNames.join(", ")}` }));
    }

    if (meals.length) {
      const cb = h("input", { type: "checkbox", checked: plan.calendar });
      cb.addEventListener("change", () => { plan.calendar = cb.checked; });
      root.body.append(h("label", { class: "wizard-check wizard-calendar" }, cb,
        h("span", { text: `Add ${meals.length} meal${meals.length === 1 ? "" : "s"} to my calendar as all-day events` })));
    }
  }

  async function finish() {
    const { rows, meals } = collect();
    if (!rows.length && !meals.length) {
      close(true);
      return;
    }

    // Start the share sheet first, synchronously, so iOS still sees the tap that triggered it.
    let calendarDone = Promise.resolve();
    if (plan.calendar && meals.length) {
      const ics = buildMealsIcs(meals.map(({ iso, meal }) => ({
        iso,
        name: meal.name,
        ingredients: meal.items.filter((i) => i.selected).map((i) => i.name)
      })));
      calendarDone = shareIcs(ics).catch(() => ctx.toast("Couldn't open the calendar"));
    }

    root.next.disabled = true;
    const savedMeals = new Set();
    for (const { meal } of meals) {
      if (!meal.isNew || savedMeals.has(meal.uid)) continue;
      savedMeals.add(meal.uid);
      await ctx.createMeal(meal.name, meal.items);
    }
    const { added, updated } = await ctx.addToList(rows);
    root.next.disabled = false;
    close(true);
    ctx.toast(`Added ${added} item${added === 1 ? "" : "s"}${updated ? `, updated ${updated}` : ""}`);
    await calendarDone;
  }

  root.next.addEventListener("click", () => {
    if (steps()[plan.step] === "review") finish();
    else { plan.step += 1; render(); }
  });
  root.back.addEventListener("click", () => { plan.step = Math.max(0, plan.step - 1); render(); });
  root.close.addEventListener("click", () => close());

  return { open };
}
