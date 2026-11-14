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

## Offline and Sign-in Behaviour
- The app opens on the locally saved list even with no signal or an expired login; the sign-in
  screen only appears on a first-ever launch with no saved login.
- A missing/expired session is restored quietly in the background using the stored refresh
  token (no password is stored), on start-up, when the connection returns, and before each sync.
- If the server rejects the refresh token the status bar shows "Sign in to sync"; tap it to sign in
  (or "Back to my list"). Changes keep queuing on the device until sync resumes.
- Network requests time out after 10s and count as offline instead of hanging.
