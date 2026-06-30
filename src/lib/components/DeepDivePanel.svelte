<script>
	import { selectedAlbumId, clearSelection } from '$lib/stores/ui.js';
	import { loadAlbum } from '$lib/data/albums.js';
	import AppleMusicLink from './AppleMusicLink.svelte';
	import AppleFullPlayback from './AppleFullPlayback.svelte';
	import Tracklist from './Tracklist.svelte';
	import PersonnelList from './PersonnelList.svelte';

	// Lazy-load the full detail whenever the selection changes. $derived gives us
	// a fresh promise per slug; {#await} renders loading / loaded / error states.
	const albumPromise = $derived($selectedAlbumId ? loadAlbum($selectedAlbumId) : null);

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Escape') clearSelection();
	}

	// Accessibility: when the dialog opens, move focus into it and trap Tab; on
	// close, return focus to whatever opened it (the album card).
	/** @param {HTMLElement} node */
	function trapFocus(node) {
		const previously = /** @type {HTMLElement | null} */ (document.activeElement);
		const selector =
			'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';
		const items = () =>
			/** @type {HTMLElement[]} */ ([...node.querySelectorAll(selector)]).filter(
				(el) => el.offsetParent !== null
			);
		node.focus();
		/** @param {KeyboardEvent} e */
		function onKeydown(e) {
			if (e.key !== 'Tab') return;
			const f = items();
			if (!f.length) return;
			const first = f[0];
			const last = f[f.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
		node.addEventListener('keydown', onKeydown);
		return {
			destroy() {
				node.removeEventListener('keydown', onKeydown);
				previously?.focus?.();
			}
		};
	}
</script>

<svelte:window onkeydown={onKey} />

{#if $selectedAlbumId}
	<!-- backdrop: click (or Enter/Space) to dismiss; timeline stays mounted behind it -->
	<button class="backdrop" type="button" aria-label="Close album detail" onclick={clearSelection}
	></button>

	<div
		class="panel"
		role="dialog"
		aria-modal="true"
		aria-label="Album detail"
		tabindex="-1"
		use:trapFocus
	>
		<button class="dismiss" onclick={clearSelection} aria-label="Close">×</button>

		{#await albumPromise}
			<p class="state">Loading album “{$selectedAlbumId}”…</p>
		{:then album}
			{#if album}
				<header class="head">
					{#if album.cover_art_url}
						<img class="cover" src={album.cover_art_url} alt="Cover of {album.title}" />
					{/if}
					<h2>{album.title}</h2>
					<p class="artist">{album.artist_name}</p>
					<p class="facts">
						{album.year}{#if album.label} · {album.label}{/if}{#if album.catalog_number}
							· {album.catalog_number}{/if}
					</p>
					<p class="style">{album.style_display}</p>
					<AppleMusicLink appleAlbumId={album.apple_album_id} />
					<AppleFullPlayback appleAlbumId={album.apple_album_id} title={album.title} />
				</header>

				{#if album.description}
					<section class="editorial">
						<span class="editorial-tag">Editorial note</span>
						<p>{album.description}</p>
					</section>
				{/if}

				<section class="recording">
					{#if album.recording_dates_text}
						<p><strong>Recorded:</strong> {album.recording_dates_text}</p>
					{/if}
					{#if album.studios && album.studios.length}
						<p><strong>Studio:</strong> {album.studios.join('; ')}</p>
					{/if}
				</section>

				<section>
					<h3>Tracks</h3>
					<Tracklist tracks={album.tracks} />
				</section>

				<PersonnelList personnel={album.personnel} />
			{:else}
				<p class="state">No data found for “{$selectedAlbumId}”.</p>
			{/if}
		{:catch err}
			<p class="state">Couldn’t load “{$selectedAlbumId}”: {err?.message ?? 'unknown error'}</p>
		{/await}
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.18);
		z-index: 10;
		border: none;
		padding: 0;
		cursor: default;
	}
	.panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: min(440px, 92vw);
		background: var(--surface);
		border-left: 1px solid var(--line);
		box-shadow: -8px 0 28px rgba(0, 0, 0, 0.14);
		z-index: 11;
		overflow-y: auto;
		padding: var(--sp-4);
		animation: slide-in 0.18s ease-out;
	}
	@keyframes slide-in {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(0);
		}
	}
	.dismiss {
		position: absolute;
		top: var(--sp-2);
		right: var(--sp-3);
		background: none;
		border: none;
		font-size: 1.6rem;
		line-height: 1;
		cursor: pointer;
		color: var(--muted);
	}
	.cover {
		width: 100%;
		max-width: 220px;
		border-radius: var(--radius);
		display: block;
		margin-bottom: var(--sp-3);
	}
	.head h2 {
		margin: 0;
		font-size: var(--fs-xl);
	}
	.artist {
		margin: 2px 0;
		font-size: var(--fs-lg);
	}
	.facts {
		margin: 2px 0;
		color: var(--muted);
		font-size: var(--fs-sm);
	}
	.style {
		margin: 2px 0 var(--sp-3);
		color: var(--muted);
		text-transform: uppercase;
		font-size: 0.7rem;
		letter-spacing: 0.04em;
	}
	.editorial {
		margin: var(--sp-3) 0;
		padding: var(--sp-2) var(--sp-3);
		background: var(--bg);
		border-left: 3px solid var(--impulse-amber);
		border-radius: var(--radius);
	}
	.editorial-tag {
		font-family: var(--font-display);
		font-size: 0.62rem;
		font-variant: small-caps;
		letter-spacing: 0.05em;
		color: var(--impulse-amber);
		font-weight: 600;
	}
	/* editorial body — serif italic: interpretation, visibly not sourced fact */
	.editorial p {
		font-family: var(--font-serif);
		font-style: italic;
		margin: var(--sp-1) 0 0;
	}
	.recording {
		margin: var(--sp-3) 0;
		font-size: var(--fs-sm);
	}
	.recording p {
		margin: 2px 0;
	}
	h3 {
		font-size: var(--fs-lg);
		margin: var(--sp-3) 0 var(--sp-2);
	}
	.state {
		color: var(--muted);
	}
</style>
