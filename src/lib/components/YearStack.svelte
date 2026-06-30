<script>
	import AlbumCard from './AlbumCard.svelte';

	/** @type {{ block: import('$lib/timeline-layout.js').YearBlock }} */
	let { block } = $props();

	// Full-height blocks (no cap). The "More ↓" cue should appear ONLY when the block
	// actually runs past the bottom of the viewport — otherwise it lies on years whose
	// rows are all visible. A sentinel at the block's bottom + IntersectionObserver
	// tells us exactly that, regardless of fold position / screen size / canon growth.
	const multiRow = $derived(block.rows >= 2);

	/** @type {HTMLElement | undefined} */
	let sentinel = $state();
	let belowFold = $state(false);

	$effect(() => {
		if (!sentinel) return;
		const io = new IntersectionObserver(
			([entry]) => {
				belowFold = !entry.isIntersecting;
			},
			{ root: null, threshold: 0 }
		);
		io.observe(sentinel);
		return () => io.disconnect();
	});

	const showMore = $derived(multiRow && belowFold);
</script>

<div class="year-stack" style="left: {block.x}px; width: {block.width}px;">
	{#if showMore}
		<!-- only when the block's bottom is off-screen — a true "more below" signal -->
		<span class="more-badge">More ↓</span>
	{/if}
	<div class="grid" style="grid-template-columns: repeat({block.cols}, 1fr);">
		{#each block.albums as album (album.id)}
			<AlbumCard {album} />
		{/each}
	</div>
	<div class="sentinel" bind:this={sentinel}></div>
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
	.sentinel {
		height: 1px;
	}
	.more-badge {
		position: absolute;
		top: 6px;
		right: 8px;
		z-index: 3;
		pointer-events: none;
		font-family: var(--font-display, inherit);
		font-size: var(--fs-sm);
		font-weight: 600;
		letter-spacing: 0.04em;
		font-variant: small-caps;
		color: var(--bn-blue, var(--ink));
		background: var(--surface);
		border: 1px solid var(--bn-blue, var(--line));
		border-radius: 999px;
		padding: 3px 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
	}
</style>
