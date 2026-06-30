import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// fallback emits build/404.html so static hosts (Cloudflare Pages, etc.)
			// serve our branded +error.svelte for unknown URLs.
			adapter: adapter({ fallback: '404.html' }),
			// The canon JSON lives at the repo root (outside src/). $data lets the
			// loader import it cleanly; this is the static-site "API". Declaring it
			// here (SvelteKit alias) wires both Vite *and* the generated tsconfig path.
			alias: {
				$data: 'data'
			}
		})
	],
	server: {
		fs: {
			// Album detail JSON in data/ (repo root) is lazily fetched in dev, so the
			// dev server must be allowed to serve it. SvelteKit's default allow-list
			// excludes the repo root; allowing the project dir covers data/ + src/ +
			// .svelte-kit + node_modules. Dev-only; production bundles these files.
			allow: [fileURLToPath(new URL('.', import.meta.url))]
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.js',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
