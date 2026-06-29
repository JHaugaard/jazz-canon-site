<script>
	// v1: a simple out-link to the Apple Music album page. This component is the
	// single Apple Music touchpoint, so MusicKit JS (per-track previews/playback)
	// can later replace its internals without touching the rest of the app.
	/** @type {{ appleAlbumId: string | null | undefined }} */
	let { appleAlbumId } = $props();

	const href = $derived(
		appleAlbumId ? `https://music.apple.com/us/album/${appleAlbumId}` : null
	);
</script>

{#if href}
	<a class="apple-cta" {href} target="_blank" rel="noopener noreferrer">Listen on Apple Music</a>
{/if}

<style>
	.apple-cta {
		display: inline-block;
		padding: var(--sp-2) var(--sp-3);
		background: var(--ink);
		color: #fff;
		border-radius: var(--radius);
		text-decoration: none;
		font-size: var(--fs-sm);
		font-weight: 600;
	}
	.apple-cta:hover {
		background: #000;
	}
</style>
