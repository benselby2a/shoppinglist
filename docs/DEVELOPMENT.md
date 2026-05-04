# MSL Development Notes

## Architecture (Single-file App)
- `app/app.js`:
  - UI rendering and events
  - local state + IndexedDB persistence
  - sync queue to Supabase REST
  - offline-first behavior

## Core UX Principles
- Local-first writes: add/check/delete render immediately
- Network sync is async/background
- Conflicts are summarized in one modal

## Key Data Paths
- Active items: `state.items`
- Autocomplete/favourites: `state.suggestions`
- Pending sync queue: `state.pending`

## Style/Behavior Conventions
- Narrow-screen behavior at `max-width: 900px`
- Add panel visibility controlled by `add-panel-collapsed` body class
- Single `+/-` toggle button controls add panel open/close

## Safe Refactor Rules
- Preserve local-first UX for mutations
- Keep IndexedDB schema backward compatible (`state` object store)
- Do not reintroduce runtime CDN dependency for core app logic

## Release Rule (Mandatory)
- On every app change, always bump `CACHE_VERSION` in `/sw.js`.
- Do this automatically as part of the change set; do not ask for confirmation.
