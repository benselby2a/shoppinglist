# Shopping List MVP

Static vanilla JS PWA with Supabase realtime + offline queue.

## Local run

Use any static server from `app/`, for example:

```bash
cd app
python3 -m http.server 4173
```

Open <http://localhost:4173>.

## Configure Supabase

1. Create a Supabase project.
2. Run SQL in `supabase/schema.sql` in the SQL editor.
3. In `app/app.js`, fill `APP_CONFIG.supabaseUrl` and `APP_CONFIG.supabaseAnonKey`.
4. Optionally change `householdId` and `passcode`.

## Deploy

Upload `app/*` to GitHub Pages (or any static host).
