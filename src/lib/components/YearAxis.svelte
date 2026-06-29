<script>
	/** @type {{ blocks: import('$lib/timeline-layout.js').YearBlock[], totalWidth: number }} */
	let { blocks, totalWidth } = $props();
</script>

<div class="year-axis" style="width: {totalWidth}px;">
	{#each blocks as b (b.year)}
		{#if b.count > 0}
			<span class="tick" style="left: {b.centerX}px;">{b.year}</span>
		{/if}
	{/each}
</div>

<style>
	.year-axis {
		position: relative;
		height: 44px;
		border-bottom: 1px solid var(--line);
	}
	.tick {
		position: absolute;
		top: 6px;
		transform: translateX(-50%);
		font-family: var(--font-display, inherit);
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--ink);
		white-space: nowrap;
	}
</style>
