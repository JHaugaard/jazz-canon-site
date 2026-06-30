<script>
	import { preview, brokenPreviews, toggle } from '$lib/stores/preview.js';

	/** @type {{ trackId: string, url: string | null | undefined, title: string }} */
	let { trackId, url, title } = $props();

	// Status for THIS track only: 'idle' unless it's the active one.
	const status = $derived($preview.trackId === trackId ? $preview.status : 'idle');
	// A preview that failed at runtime removes its own affordance.
	const broken = $derived($brokenPreviews.has(trackId));
	const playable = $derived(Boolean(url) && !broken);
</script>

<span class="play-slot">
	{#if playable}
		<button
			class="preview {status}"
			onclick={() => toggle(trackId, url)}
			aria-pressed={status !== 'idle'}
			aria-label={status === 'idle'
				? `Play 30-second preview of ${title}`
				: `Stop preview of ${title}`}
			title="30-second preview"
		>
			{#if status === 'playing'}
				<span class="glyph">❚❚</span>
			{:else if status === 'loading'}
				<span class="glyph spin">◌</span>
			{:else}
				<span class="glyph">▶</span>
			{/if}
		</button>
	{/if}
</span>

<style>
	/* Fixed-width slot keeps every row aligned whether or not a button exists —
	   the absence of a preview reads as quiet space, not a broken control. */
	.play-slot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.6em;
		flex: 0 0 auto;
	}
	.preview {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 1.5em;
		height: 1.5em;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: 50%;
		background: var(--surface, #fff);
		color: var(--bn-blue);
		cursor: pointer;
		line-height: 1;
		font-size: 0.7rem;
		transition: background 0.12s ease, border-color 0.12s ease;
	}
	.preview:hover {
		border-color: var(--bn-blue);
		background: color-mix(in srgb, var(--bn-blue) 8%, #fff);
	}
	.preview.playing {
		background: var(--bn-blue);
		color: #fff;
		border-color: var(--bn-blue);
	}
	.glyph {
		display: inline-block;
		transform: translateY(-0.02em);
	}
	.spin {
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.spin {
			animation: none;
		}
	}
</style>
