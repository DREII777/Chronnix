# Config.js exposes live Supabase credentials

## Summary
- `config.js` is loaded directly in `index.html` (non-module script).
- The file is shipped as-is in `dist/index.html` (`<script src="./config.js"></script>`) and contains a real Supabase URL + anon key.
- Anyone viewing the production bundle can reuse the anon key to access Supabase APIs.

## Impact
- Anon key grants database access as configured; malicious actors can enumerate tables or spam auth endpoints.
- Because the script is not bundled, rotating the key requires manual file updates and redeploy.

## Steps to Reproduce
1. Build the project (`npm run build`).
2. Inspect `dist/index.html` — note the `<script src="./config.js"></script>` tag.
3. Open `config.js`; observe hard-coded Supabase credentials.

## Expected
- Secrets should be provided via environment variables during build/deploy and never shipped to clients.
- `config.js` should not contain live keys or be publicly accessible.

## Suggested Fix
- Remove `config.js` from the client bundle; rely solely on `VITE_SUPABASE_*` env vars.
- Rotate the exposed anon key in Supabase dashboard.
