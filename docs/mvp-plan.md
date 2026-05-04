# MVP Plan: Shared Shopping List PWA (Version B UI)

## Summary
Build a lightweight, static **vanilla JavaScript PWA** (iPhone-first, desktop-responsive) with **Supabase** backend, **real-time multi-user updates**, and **offline-first sync**.  
UI follows approved **Version B** and now includes:
- Checked items hidden from main section view
- Quick **Undo last action**
- Dedicated view for **all checked items**

## Key Implementation Changes
1. **App shell and UI**
- Static files: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`.
- Version B layout:
  - Sticky header
  - Persistent sync bar (`Online`, `Offline`, `Syncing`, `Conflicts`)
  - Quick-add row with section + free-text quantity
  - Section cards with large touch targets
  - Footer actions: `Import .txt`, `Sync now`
- Add global action feedback/toast with `Undo` for last mutation.

2. **Checked-item behavior**
- On check, item is hidden from active section list immediately.
- Maintain a `Checked Items` view (drawer/panel/page) showing all checked items across sections.
- Unchecking from `Checked Items` restores item to active list in its original section.
- `Undo last action` supports at least: add, edit, check, uncheck, delete (soft delete).

3. **Fixed section model (v1)**
- Use exactly:
  - Fruit and Veg
  - Meat
  - Fish
  - Deli
  - Dairy
  - Canned Good and Spices
  - Snacks
  - Drinks
  - Cereal
  - Coffee and Tea
  - Bakery
  - Frozen
  - Household and Cleaning
  - Toiletries

4. **Supabase data + realtime**
- `shopping_items`: `id`, `household_id`, `name`, `section`, `quantity_text`, `checked`, `deleted_at`, `updated_at`, `updated_by`.
- `suggestion_items` for autocomplete/import history.
- Realtime subscription scoped to household.
- Soft deletes via `deleted_at`; checked state via `checked=true`.

5. **Offline sync + conflict model**
- IndexedDB for active cache, checked cache, suggestions, and outbox queue.
- Optimistic local updates first, then queued sync operation.
- Reconnect replay with retry/backoff.
- Conflict policy:
  - Last-write-wins in persisted state.
  - Superseded local edits flagged with `conflictFlag` and surfaced in sync bar.

6. **Autocomplete and import**
- Suggestions from household history and prior entries.
- Plain-text import (`.txt`, one per line), max **1,000 lines**.
- Normalize and dedupe before upsert.

7. **Access model**
- Single shared household.
- Passcode gate on app load.
- Repo remains static-host friendly for GitHub deployment.

## Public Interfaces / Types
- Operation envelope:
  - `{ opId, type, itemId, payload, clientId, clientTs, householdId }`
- Item shape:
  - `{ id, name, section, quantityText, checked, deletedAt, updatedAt, updatedBy, conflictFlag }`
- Sync state:
  - `{ online, syncing, pendingCount, conflictCount, lastSyncAt }`
- Undo contract:
  - `lastAction = { type, targetId, inversePayload, expiresAt }`
- Import API:
  - `importSuggestionsFromText(rawText: string): { imported: number, skipped: number }`

## Test Plan (MVP Acceptance)
- Realtime:
  - Two clients see updates within ~2 seconds.
- Checked/undo behavior:
  - Checking hides item from active view instantly.
  - Undo restores previous state quickly (including after check/delete).
  - Checked Items view lists all checked items and supports uncheck/restore.
- Offline:
  - Offline actions queue and display pending count.
  - Reconnect syncs queue and clears pending state.
- Conflicts:
  - Concurrent edits resolve with LWW and conflict indicator appears.
- Import/autocomplete:
  - `.txt` import up to 1,000 lines; duplicates skipped; suggestions appear while typing.
- Cross-device:
  - iPhone Safari + desktop Chrome smoke tests pass with persistent sync visibility.

## Assumptions and Defaults
- Quantity is free text.
- Delete is soft delete.
- Fixed sections only.
- Single household in MVP.
- Shared passcode gate (default minimum 6 characters unless you specify otherwise).
- Undo is single-level (last action only) in MVP.
