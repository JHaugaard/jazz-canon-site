<script>
	import { eraLanes } from '$lib/timeline-layout.js';

	/** @type {{ blocks: import('$lib/timeline-layout.js').YearBlock[], scrollLeft: number }} */
	let { blocks, scrollLeft } = $props();

	const lanes = $derived(eraLanes(blocks));

	const LANE_H = 46; // height of one lane
	const STEP = LANE_H * 0.8; // vertical step → ~20% overlap between adjacent lanes
	const PAD = 8;

	/** measured label widths, for clamping the slide @type {number[]} */
	let labelW = $state([]);

	/**
	 * Slide offset so the label tracks the viewport's left edge while its band is
	 * in view, clamped to [0, bandWidth - labelWidth] (spec §5.1).
	 * @param {{ x: number, width: number }} lane
	 * @param {number} i
	 */
	function slideX(lane, i) {
		const w = labelW[i] ?? 80;
		const max = Math.max(0, lane.width - w - PAD * 2);
		return Math.min(Math.max(scrollLeft - lane.x, 0), max);
	}
</script>

<div class="era-lanes" style="height: {LANE_H + STEP * (lanes.length - 1)}px;">
	{#each lanes as lane, i (lane.name)}
		<div
			class="lane"
			style="left: {lane.x}px; width: {lane.width}px; top: {i * STEP}px; height: {LANE_H}px; background: {lane.color};"
		>
			<span
				class="lane-label"
				bind:clientWidth={labelW[i]}
				style="transform: translate({slideX(lane, i)}px, -50%);"
			>
				{lane.name}
			</span>
		</div>
	{/each}
</div>

<style>
	.era-lanes {
		position: relative;
		width: 100%;
	}
	.lane {
		position: absolute;
		border-radius: var(--radius);
	}
	.lane-label {
		position: absolute;
		left: 8px;
		top: 50%;
		font-size: var(--fs-sm);
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--era-ink);
		background: rgba(250, 248, 243, 0.78);
		padding: 1px 8px;
		border-radius: 4px;
		white-space: nowrap;
		will-change: transform;
	}
</style>
