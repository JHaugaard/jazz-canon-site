<script>
	import AlbumCard from './AlbumCard.svelte';

	/** @type {{ block: import('$lib/timeline-layout.js').YearBlock }} */
	let { block } = $props();

	// Full-height blocks (no cap). Multi-row years extend below the fold, so flag
	// "there's more, scroll down" — no number: the fold is a moving target and the
	// whole block is rendered anyway, so an exact hidden-count would be a lie.
	const hasMore = $derived(block.rows >= 2);
</script>

<div class="year-stack" style="left: {block.x}px; width: {block.width}px;">
	{#if hasMore}
		<!-- top-anchored so it's seen while scrubbing horizontally (eye is on row 1) -->
		<span class="more-badge">More ↓</span>
	{/if}
	<div class="grid" style="grid-template-columns: repeat({block.cols}, 1fr);">
		{#each block.albums as album (album.id)}
			<AlbumCard {album} />
		{/each}
	</div>
</div>

<style>
	.year-stack {
		position: absolute;
		top: 0;
	}
	.grid {
		display: grid;
		gap: var(--sp-3);
	}
	.more-badge {
		position: absolute;
		top: 6px;
		right: 8px;
		z-index: 3;
		pointer-events: none;
		font-family: var(--font-display, inherit);
		font-size: var(--fs-sm);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--bn-blue, var(--ink));
		background: var(--surface);
		border: 1px solid var(--bn-blue, var(--line));
		border-radius: 999px;
		padding: 3px 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}
</style>
