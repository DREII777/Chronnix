# QA Report — Chronnix (build 2025-09-17)

## Executive Summary
- ✅ Build (`npm run build`) and preview server (`npm run preview -- --host 0.0.0.0 --port 4173`) succeed after fixing package versions and TypeScript type errors.
- ⚠️ The production bundle still loads `config.js` at runtime; the file ships with live Supabase URL and anon key, exposing credentials in the built artifact.
- 🎯 Addressed critical a11y regression: converted the sign-in layout to use semantic landmarks and WCAG-compliant primary button styling; axe-core scans now report **0 violations** on `/`, `/login`, `/dashboard`.
- 📊 Largest assets remain heavy (1.4 MB logo, 420 kB XLSX chunk, 304 kB app bundle); Lighthouse highlights render-blocking Tailwind CDN and unused JavaScript as main performance wins.

## Checklist
- [x] Repo setup (`git checkout -B qa/autofix`, dependency install, `.env` from template)
- [x] Build + TypeScript (`npm run build`)
- [x] Preview smoke (`npm run preview -- --host 0.0.0.0 --port 4173`)
- [x] Automated UI crawl (Playwright + axe) — `/`, `/login`, `/dashboard`
- [x] Lighthouse (desktop & mobile presets) on `/`
- [x] `npm audit` (focus on HIGH/CRITICAL)

## Visual / UX Findings
| Screenshot | Notes |
| --- | --- |
| `qa/screenshots/home-desktop.png` | Sign-in screen styled with updated accessible primary action. Still loads remote logo via `<img src="./logo.png">`; 1.4 MB PNG drives layout jank on slow links. |
| `qa/screenshots/dashboard-tablet.png` | Without a valid session the dashboard route renders the sign-in form (expected). |
| `qa/screenshots/dashboard-mobile.png` | Horizontal scroll is required for the 31-column timesheet; sticky worker column works, but consider a condensed mobile view (2-day chunks) to reduce scroll fatigue. |

### Quick-win patches applied
```diff
+.btn:focus-visible {
+  outline: 2px solid #166534;
+  outline-offset: 2px;
+}
-.btn-primary { background: #16a34a; }
+.btn-primary { background: #166534; }
```
```diff
-  <div className="min-h-screen ...">
+  <main className="min-h-screen ..." aria-labelledby="sign-in-heading">
     ...
-  {error && <div className="text-sm text-red-600">{error}</div>}
+  {error && <div className="text-sm text-red-600" role="alert">{error}</div>}
```

## Accessibility
- Tooling: `@axe-core/playwright` on `/`, `/login`, `/dashboard` (desktop/tablet/mobile).
- Result: **0 violations** post-fix (previously `color-contrast`, `landmark-one-main`, `region`).
- Remaining opportunities:
  - OTP inputs expose only visual labeling; consider `aria-label`/`aria-describedby` per digit for screen readers.
  - Tailwind CDN script is render-blocking and not marked `defer`; moving to precompiled CSS avoids blocking AT from reading content promptly.

## Performance
- Lighthouse Desktop: **Perf 95**, **A11y 92**, **Best Practices 96**, **SEO 83**.
- Lighthouse Mobile: **Perf 98**, **A11y 92**, **Best Practices 96**, **SEO 83**.
- Top opportunities:
  1. Eliminate render-blocking resources (Tailwind CDN script) → ~120 ms.
  2. Trim unused JavaScript (~40 ms) — main bundle still 304 kB.
  3. Optimise `logo.png` (1.4 MB) — convert to SVG/WebP and lazy-load on auth screen.
  4. Review XLSX dynamic chunk (429 kB) — already lazy loaded but still heavy; ensure tree-shaking or move export to worker.
  5. Preconnect Supabase endpoints to reduce TTFB when auth requests fire.

## Security & DX
- **High severity**: `config.js` is bundled verbatim and exposes live Supabase URL + anon key. Attackers can reuse the anon key; move secrets to server-side or rotate key before go-live.
- `npm audit` high: `xlsx` <0.20.2 has Prototype Pollution & ReDoS advisories (GHSA-4r6h-8v6p-xvw6 / GHSA-5pgg-2g8v-p4x9). No patched release available in current registry mirror; monitor upstream and sandbox export inputs meanwhile.
- No CSP / security headers configured; add via reverse-proxy or `vite` preview middleware.

## Limitations
- Auth flow requires whitelisted Supabase accounts; functional dashboard scenarios (creating projects, exporting XLSX) could not be exercised without valid credentials.
- Export routines rely on Supabase data; verified only up to client-side invocation (no file fixtures generated).

## Artifacts
- Screenshots & axe JSON: `qa/screenshots/*`, `qa/axe/*.json`.
- Lighthouse JSON: `qa/lighthouse/home-desktop.json`, `qa/lighthouse/home-mobile.json`.
- npm audit JSON: `qa/npm-audit.json`.
