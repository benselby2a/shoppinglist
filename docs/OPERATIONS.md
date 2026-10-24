# MSL Operations Guide

## Local Run
- Serve from project root:
  - `python3 -m http.server 4173`
- Open `http://localhost:4173`

## Deploy (GitHub Pages)
- Push to `main`
- Pages source: `main` branch, `/ (root)`
- Main entrypoint is root `index.html`

## Cache / Update Behavior
- Service worker: `/sw.js`
- Shell assets are refreshed during SW install using `cache: reload`
- In-app update banner appears when a new SW is installed

## If UI Looks Stale
1. Hard refresh (`Cmd+Shift+R`)
2. DevTools -> Application -> Service Workers -> Unregister
3. DevTools -> Application -> Clear storage -> Clear site data
4. Reload

## iPhone Home Screen App
- Remove app icon
- Clear Safari website data for the site
- Reopen site in Safari
- Add to Home Screen again

## Supabase Health Checks
- Confirm `supabaseUrl` and `supabaseAnonKey` in `app/app.js`
- RLS requires an authenticated session for every table (`to authenticated`,
  gated further by `household_id = 'shared-household'`) -- the `anon` role
  has no access at all. See
  `supabase/migrations/2026-10-24_require_authenticated_access.sql`.
- Sync and any remote write silently no-ops until the user is signed in
  (`apiRequest` returns an error instead of falling back to the anon key)
- If offline: app should still work locally and queue pending ops

