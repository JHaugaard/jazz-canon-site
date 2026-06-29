<script>
	import { buildLayout } from '$lib/timeline-layout.js';
	import EraBands from './EraBands.svelte';
	import YearAxis from './YearAxis.svelte';
	import YearStack from './YearStack.svelte';

	/** @type {{ albums: import('$lib/data/albums.js').Album[] }} */
	let { albums } = $props();

	const layout = $derived(buildLayout(albums));

	// Blocks are absolutely positioned (by year on the x-axis), so the card area
	// needs an explicit height = the tallest year. ROW_H bounds one card row
	// (cover 200 + 2-line meta + gap); the title's 2-line clamp keeps it stable.
	const ROW_H = 305;
	const maxRows = $derived(layout.blocks.reduce((m, b) => Math.max(m, b.rows), 1));

	/** @type {HTMLDivElement | undefined} */
	let scrollEl = $state();
	let scrollLeft = $state(0);

	function onScroll() {
		if (scrollEl) scrollLeft = scrollEl.scrollLeft;
	}

	// keep scrollLeft initialised so the era-band sliding labels position correctly
	$effect(() => {
		if (scrollEl) onScroll();
	});
</script>

<div class="timeline-scroll" bind:this={scrollEl} onscroll={onScroll}>
	<div class="timeline-strip" style="width: {layout.totalWidth}px;">
		<div class="layer lanes-layer">
			<EraBands blocks={layout.blocks} {scrollLeft} />
		</div>
		<div class="layer axis-layer">
			<YearAxis blocks={layout.blocks} totalWidth={layout.totalWidth} />
		</div>
		<div class="layer cards-layer" style="height: {maxRows * ROW_H}px;">
			{#each layout.blocks as block (block.year)}
				{#if block.count > 0}
					<YearStack {block} />
				{/if}
			{/each}
		</div>
	</div>
</div>

<style>
	.timeline-scroll {
		overflow-x: auto;
		overflow-y: hidden;
		width: 100%;
		border-top: 1px solid var(--line);
		background: var(--bg);
	}
	.timeline-strip {
		position: relative;
	}
	.layer {
		position: relative;
	}
	.lanes-layer {
		padding: var(--sp-3) 0 var(--sp-2);
	}
	.axis-layer {
		margin-bottom: var(--sp-3);
	}
	.cards-layer {
		position: relative;
		/* height set inline = tallest year × ROW_H (full-height blocks, no cap) */
	}
</style>
