# Phase 1 — Build Script (test-first, gate-by-gate)

**Status:** Ready to execute — 2026-06-27 (session `build-1`)
**Expands:** `docs/implementation-plan-v1.md` §7, Phase 1 (lines 270–281)
**Binding spec:** `docs/app-spec-v1.md`

> **Phase 1 goal, one sentence:** A SvelteKit app (adapter-static) that builds to plain
> static files and proves it can read the **real** `data/albums.json` and render all 100
> album titles + years onto a page — no styling, no DB, no other features.
>
> This phase proves the *pipeline*, nothing else. If you can `npm run build` and grep 100
> real album titles out of the emitted static HTML, Phase 1 is done.

---

## How this script is meant to be run

Per your standing preferences (surfaced from Honcho this session):

- **Headless vps8 — no browser.** Every gate is verified from the CLI (`node -e`, `grep`
  on built HTML, `svelte-check`). No "open localhost and look" steps.
- **Discrete gates with STOP points.** Each gate ends in a runnable check and a
  ✋ **STOP — confirm before continuing**. We do not run end-to-end unattended.
- **Test-first.** The one logic-bearing piece in Phase 1 (the data loader) gets its test
  written *first* (RED), then the code to make it pass (GREEN).
- **Small and reversible.** One thing wired through the whole pipe, verified, then advance.
- **No styling.** Raw semantic HTML only. Light theme is the default anyway (no dark mode).
- **Pass the full data shape through.** The loader returns whole album objects (keeping
  `epistemic` downstream, `apple_album_id`, etc.) so Phases 2–4 need no loader rewrite.

Pre-decided facts this script relies on (from `data/albums.json`, verified 2026-06-27):
100 albums; each row has `id, title, artist_name, year, style_primary, style_display,
label, catalog_number, cover_art_url, apple_album_id`.

---

## Gate 0 — Preflight (no writes)

**Goal:** Confirm the ground is solid before scaffolding anything.

```bash
cd /home/john/dev/active/jazz-canon-site
node --version          # expect v24.x (have v24.15.0)
npm --version           # expect 11.x

# Data is present and the right size/shape
node -e 'const a=require("./data/albums.json"); console.log("albums:",a.length); console.log("keys:",Object.keys(a[0]).join(","))'

# Secrets are already protected (must list .env.local and node_modules/)
grep -E "^\.env\.local$|^node_modules/" .gitignore

# src/ is empty and there is no package.json yet (clean slate for scaffold)
ls -A src; test -f package.json && echo "HAS package.json" || echo "no package.json (good)"
```

**Pass criteria:** `albums: 100`; keys list matches the fields above; `.gitignore` shows
both lines; `no package.json (good)`.

✋ **STOP — confirm Gate 0 is green before scaffolding.**

---

## Gate 1 — Scaffold SvelteKit + adapter-static (bare build proves the toolchain)

**Goal:** A minimal SvelteKit project that builds to static files. No data yet.

### 1a. Create the project in-place

`src/` is empty but the repo is not (it has `data/`, `docs/`, `.git`, etc.), so we scaffold
with the modern `sv` CLI and let it merge into the current directory.

```bash
cd /home/john/dev/active/jazz-canon-site
npx sv create .
```

Interactive choices (I will confirm each with you as they appear):
- **"Directory not empty… continue?"** → **Yes** (it adds files; it won't touch `data/`/`docs/`).
- **Template** → **SvelteKit minimal** (no demo app).
- **Type checking** → **JavaScript with JSDoc comments** (you write plain `.js`; no TS step).
- **Add-ons** → select **vitest** (we need it for the test-first loader) and **prettier**.
  Skip Playwright, Tailwind, ESLint extras — out of Phase 1 scope.
- **Install dependencies** → **Yes** (npm).

If `sv create .` refuses the non-empty dir outright, fallback: scaffold into a temp subdir
and move the generated `package.json`, `svelte.config.js`, `vite.config.js`, `src/`,
`static/`, and merge `.gitignore` — I'll handle this only if needed.

### 1b. Switch to the static adapter

```bash
npm install -D @sveltejs/adapter-static
```

Edit `svelte.config.js` to use it:

```js
import adapter from '@sveltejs/adapter-static';

const config = {
  kit: {
    adapter: adapter()   // emits a fully static site into build/
  }
};

export default config;
```

Make the whole app prerender — create `src/routes/+layout.js`:

```js
export const prerender = true;
```

### 1c. Add a `$data` alias so the loader can import the repo's JSON cleanly

`data/` lives at the repo root, outside `src/`. Add a Vite alias in `vite.config.js`:

```js
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $data: fileURLToPath(new URL('./data', import.meta.url))
    }
  }
});
```

### 1d. Verify the bare toolchain

```bash
npm run build        # must succeed and create build/
ls build/            # expect index.html + _app/ (or similar)
```

**Pass criteria:** `npm run build` exits 0 and `build/` contains static HTML/JS.

✋ **STOP — confirm the bare static build works before adding data.**

---

## Gate 2 — Test-first data loader (RED → GREEN)

**Goal:** `src/lib/data/albums.js` exposes the canon to the app, and a test pins its contract.

### 2a. Write the test FIRST (expect RED — module doesn't exist yet)

`src/lib/data/albums.test.js`:

```js
import { describe, it, expect } from 'vitest';
import { getAlbums } from './albums.js';

describe('getAlbums', () => {
  const albums = getAlbums();

  it('returns all 100 canon albums', () => {
    expect(albums).toHaveLength(100);
  });

  it('preserves the full album shape (no field-stripping)', () => {
    // Phases 2–4 depend on these surviving the loader untouched.
    for (const key of ['id', 'title', 'artist_name', 'year', 'apple_album_id']) {
      expect(albums[0]).toHaveProperty(key);
    }
  });

  it('every album has a title and a numeric year', () => {
    for (const a of albums) {
      expect(typeof a.title).toBe('string');
      expect(a.title.length).toBeGreaterThan(0);
      expect(typeof a.year).toBe('number');
    }
  });
});
```

```bash
npm run test -- --run        # RED: fails to import ./albums.js
```

### 2b. Write the loader to make it GREEN

`src/lib/data/albums.js`:

```js
import albums from '$data/albums.json';

/** Return the full canon album list, shape preserved. */
export function getAlbums() {
  return albums;
}
```

```bash
npm run test -- --run        # GREEN: 3 tests pass
```

**Pass criteria:** all three tests pass. (If the `$data` import fails inside Vitest, add the
same alias to a `test.alias` / `resolve.alias` block — I'll wire it if it surfaces.)

✋ **STOP — confirm the loader test is green before touching the page.**

---

## Gate 3 — Render the bare list (the pipeline, end to end)

**Goal:** The page renders all 100 real titles + years. This is the Phase 1 deliverable.

### 3a. Universal load function — `src/routes/+page.js`

(Universal `load`, not `+page.server.js`: this is a static prerendered site with no runtime
server. The load runs at build time and bakes the data into the HTML.)

```js
import { getAlbums } from '$lib/data/albums.js';

export function load() {
  return { albums: getAlbums() };
}
```

### 3b. The page — `src/routes/+page.svelte` (no styling, semantic HTML)

```svelte
<script>
  /** @type {{ albums: Array<{id:string,title:string,artist_name:string,year:number}> }} */
  let { data } = $props();
</script>

<h1>The Jazz Canon — {data.albums.length} albums</h1>

<ul>
  {#each data.albums as album (album.id)}
    <li>{album.year} — {album.title} · {album.artist_name}</li>
  {/each}
</ul>
```

### 3c. CLI verification (headless — no browser)

Build to static and prove the real data is baked into the HTML:

```bash
npm run build

# The prerendered homepage:
PAGE=$(find build -maxdepth 2 -name 'index.html' | head -1); echo "page: $PAGE"

# 1) The count line rendered:
grep -o "The Jazz Canon — 100 albums" "$PAGE"

# 2) A known album from the real data is present:
grep -o "Birth of the Cool" "$PAGE"

# 3) Sanity: roughly 100 <li> rows in the prerendered HTML:
grep -o "<li" "$PAGE" | wc -l        # expect ~100
```

Optional live check (also CLI, no browser): `npm run preview &` then
`curl -s localhost:4173 | grep -c "<li"`.

**Pass criteria:** count line present; "Birth of the Cool" present; ~100 `<li>` rows.

✋ **STOP — confirm the rendered static HTML contains the real canon.**

---

## Gate 4 — Lock it in

**Goal:** A clean, verifiable end state and a commit boundary.

```bash
npm run test -- --run     # loader contract still green
npm run build             # static build still succeeds
npx svelte-check          # no type/usage errors (informational)
```

**Commit (your call — commits are yours to make):** the natural Phase 1 commit covers
`package.json`, `package-lock.json`, `svelte.config.js`, `vite.config.js`,
`src/` (routes + lib loader + test). Note the **pre-existing** open loop from Phase 0: the
generated `data/*.json` files are still uncommitted — worth folding into the same commit so
the app and its data land together. `.gitignore` already excludes `node_modules/`,
`.svelte-kit/`, `build/`, `.env.local`, `.venv/`.

**Phase 1 Definition of Done:**
- [ ] `npm run build` emits a static site into `build/`
- [ ] Prerendered `index.html` contains all 100 real album titles + years
- [ ] `getAlbums()` test green (count + shape preserved)
- [ ] No styling added; light default; no DB touched; no other features
- [ ] Data shape passes through whole (epistemic/apple ids survive for later phases)

✋ **STOP — Phase 1 complete. Next gate is Phase 2 (timeline), a separate session/script.**

---

## Out of scope for Phase 1 (guardrails — do not drift)

No styling/CSS tokens beyond what the scaffold ships, no era bands, no cards, no deep-dive
panel, no D3/network, no Apple Music calls, no cover-art rendering, no DB connection. Those
are Phases 2–5. If a step starts reaching for any of them, stop — it's scope creep.
