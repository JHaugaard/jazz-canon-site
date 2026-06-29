<script>
	import AlbumCard from './AlbumCard.svelte';

	/** @type {{ block: import('$lib/timeline-layout.js').YearBlock, opacity: number }} */
	let { block, opacity } = $props();
</script>

<div class="year-stack" style="left: {block.x}px; width: {block.width}px; opacity: {opacity};">
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
		transition: opacity 0.18s ease;
	}
	.grid {
		display: grid;
		gap: var(--sp-3);
		/* cap to ~2 card rows; denser years scroll vertically within their block */
		max-height: 560px;
		overflow-y: auto;
		overflow-x: hidden;
		padding-bottom: var(--sp-2);
	}
</style>
