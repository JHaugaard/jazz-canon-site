<script>
	import { buildLayout, focusOpacity } from '$lib/timeline-layout.js';
	import EraBands from './EraBands.svelte';
	import YearAxis from './YearAxis.svelte';
	import YearStack from './YearStack.svelte';

	/** @type {{ albums: import('$lib/data/albums.js').Album[] }} */
	let { albums } = $props();

	const layout = $derived(buildLayout(albums));

	/** @type {HTMLDivElement | undefined} */
	let scrollEl = $state();
	let scrollLeft = $state(0);
	let centerYear = $state(1959);

	function onScroll() {
		if (!scrollEl) return;
		scrollLeft = scrollEl.scrollLeft;
		// the year whose block sits under the horizontal centre of the viewport
		const viewportCenter = scrollLeft + scrollEl.clientWidth / 2;
		let cy = layout.blocks[0]?.year ?? centerYear;
		for (const b of layout.blocks) {
			if (viewportCenter >= b.x) cy = b.year;
			else break;
		}
		centerYear = cy;
	}

	// initialise centre year once the element is measured
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
		<div class="layer cards-layer">
			{#each layout.blocks as block (block.year)}
				{#if block.count > 0}
					<YearStack {block} opacity={focusOpacity(block.year, centerYear)} />
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
		height: 560px;
	}
</style>
