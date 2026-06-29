# A Jazz Canon

A curated canon of essential jazz albums (1949–1972 — cool jazz through post-bop) with
track-level personnel and an interactive Personnel Network. A static SvelteKit site that
reads pre-exported JSON; D3 powers the force-directed network graph.

See `docs/app-spec-v1.md` for the design spec and `docs/implementation-plan-v1.md` for the
build plan.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
