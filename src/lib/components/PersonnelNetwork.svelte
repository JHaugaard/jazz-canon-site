<script>
	import { selectedMusician, selectAlbum, selectMusician, clearMusician } from '$lib/stores/ui.js';
	import { buildScopedGraph } from '$lib/data/network.js';
	import { createForceSim, nodeRadius } from '$lib/graph/force.js';
	import { select } from 'd3-selection';
	import { drag } from 'd3-drag';
	import { zoom } from 'd3-zoom';

	// D3 owns everything inside this <svg>; Svelte only decides when the panel
	// shows and provides the element. The two libraries meet only here.
	const W = 960;
	const H = 680;

	/** @type {SVGSVGElement | undefined} */
	let svgEl = $state();
	/** @type {string} */
	let centerLabel = $state('');

	const fillFor = (/** @type {any} */ n) => {
		if (n.type === 'album') return '#c98a3c'; // brass — albums
		if (n.isCenter) return '#8a5a2b'; // accent — the centered musician
		return '#5f86a8'; // muted blue — co-personnel
	};

	// Epistemic edge encoding (spec §5.3): solid=obs, dashed=inf, dotted=unk.
	// null (no label) renders solid so the graph still reads if a link is unlabelled.
	const dashFor = (/** @type {string | null} */ epi) =>
		epi === 'inf' ? '6 3' : epi === 'unk' ? '2 3' : null;

	$effect(() => {
		const slug = $selectedMusician;
		if (!slug || !svgEl) return;

		/** @type {import('$lib/data/network.js').ScopedGraph} */
		let graph;
		try {
			graph = buildScopedGraph(slug);
		} catch {
			centerLabel = slug;
			return;
		}
		centerLabel = graph.center.label;

		const svg = select(svgEl);
		svg.selectAll('*').remove();
		const root = svg.append('g');

		svg.call(
			/** @type {any} */ (zoom())
				.scaleExtent([0.3, 3])
				.on('zoom', (/** @type {any} */ ev) => root.attr('transform', ev.transform))
		);

		const link = root
			.append('g')
			.attr('stroke', '#d8ccbb')
			.attr('stroke-opacity', 0.7)
			.selectAll('line')
			.data(graph.links)
			.join('line')
			.attr('stroke-width', 1.3)
			.attr('stroke-dasharray', (/** @type {any} */ d) => dashFor(d.epistemic));

		const node = root
			.append('g')
			.selectAll('g')
			.data(graph.nodes)
			.join('g')
			.style('cursor', (/** @type {any} */ d) => (d.isCenter ? 'default' : 'pointer'));

		node
			.append('circle')
			.attr('r', nodeRadius)
			.attr('fill', fillFor)
			.attr('stroke', '#fff')
			.attr('stroke-width', 1.5);

		node
			.append('text')
			.text((/** @type {any} */ d) => d.label)
			.attr('x', (/** @type {any} */ d) => nodeRadius(d) + 4)
			.attr('y', 4)
			.attr('font-size', (/** @type {any} */ d) => (d.isCenter ? 14 : d.type === 'album' ? 11 : 10))
			.attr('fill', '#1c1a17')
			.attr('paint-order', 'stroke')
			.attr('stroke', 'rgba(250,248,243,0.85)')
			.attr('stroke-width', 3)
			// Only the center is labelled by default; others reveal on hover so the
			// star stays legible (dense hubs would otherwise be a thicket of text).
			.attr('opacity', (/** @type {any} */ d) => (d.isCenter ? 1 : 0));

		node
			.append('title')
			.text((/** @type {any} */ d) =>
				d.type === 'musician'
					? `${d.label}${d.instruments?.length ? ' — ' + d.instruments.join(', ') : ''}`
					: `${d.label}${d.year ? ' (' + d.year + ')' : ''}`
			);

		node.on('click', (/** @type {any} */ _ev, /** @type {any} */ d) => {
			if (d.type === 'album') {
				selectAlbum(d.id.replace(/^a:/, ''));
				clearMusician();
			} else if (!d.isCenter) {
				selectMusician(d.id.replace(/^m:/, '')); // follow the thread (re-scope)
			}
		});

		// Reveal a node's label on hover (and lift it above its neighbours).
		node
			.on('mouseenter', /** @this {SVGGElement} */ function () {
				const g = select(this);
				g.raise();
				g.select('text').attr('opacity', 1);
			})
			.on('mouseleave', /** @this {SVGGElement} */ function (/** @type {any} */ _ev, /** @type {any} */ d) {
				if (!d.isCenter) select(this).select('text').attr('opacity', 0);
			});

		const sim = createForceSim(graph.nodes, graph.links, W, H);

		node.call(
			/** @type {any} */ (drag())
				.on('start', (/** @type {any} */ ev, /** @type {any} */ d) => {
					if (!ev.active) sim.alphaTarget(0.3).restart();
					d.fx = d.x;
					d.fy = d.y;
				})
				.on('drag', (/** @type {any} */ ev, /** @type {any} */ d) => {
					d.fx = ev.x;
					d.fy = ev.y;
				})
				.on('end', (/** @type {any} */ ev, /** @type {any} */ d) => {
					if (!ev.active) sim.alphaTarget(0);
					d.fx = null;
					d.fy = null;
				})
		);

		sim.on('tick', () => {
			link
				.attr('x1', (/** @type {any} */ d) => d.source.x)
				.attr('y1', (/** @type {any} */ d) => d.source.y)
				.attr('x2', (/** @type {any} */ d) => d.target.x)
				.attr('y2', (/** @type {any} */ d) => d.target.y);
			node.attr('transform', (/** @type {any} */ d) => `translate(${d.x},${d.y})`);
		});

		return () => sim.stop();
	});

	/** @param {KeyboardEvent} e */
	function onKey(e) {
		if (e.key === 'Escape') clearMusician();
	}
</script>

<svelte:window onkeydown={onKey} />

{#if $selectedMusician}
	<div class="net-overlay">
		<div class="net-panel">
			<header class="net-head">
				<div>
					<span class="net-kicker">Personnel Network</span>
					<h2>{centerLabel}</h2>
					<p class="net-hint">
						Click an <strong>album</strong> to open it · click a <strong>musician</strong> to follow
						the thread · drag to rearrange · scroll to zoom
					</p>
					<div class="net-legend" aria-label="Edge epistemic legend">
						<span><span class="lk solid"></span> observed</span>
						<span><span class="lk dashed"></span> inferred</span>
						<span><span class="lk dotted"></span> uncertain</span>
					</div>
				</div>
				<button class="net-close" onclick={clearMusician} aria-label="Close network">×</button>
			</header>
			<svg bind:this={svgEl} viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet"></svg>
		</div>
	</div>
{/if}

<style>
	.net-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.28);
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-3);
	}
	.net-panel {
		background: var(--surface);
		border-radius: var(--radius);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.22);
		width: min(1000px, 96vw);
		height: min(760px, 92vh);
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.net-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: var(--sp-3);
		border-bottom: 1px solid var(--line);
	}
	.net-kicker {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--accent);
		font-weight: 700;
	}
	.net-head h2 {
		margin: 2px 0;
		font-size: var(--fs-xl);
	}
	.net-legend {
		display: flex;
		gap: var(--sp-3);
		margin-top: var(--sp-2);
		font-size: var(--fs-sm);
		color: var(--muted);
	}
	.net-legend .lk {
		display: inline-block;
		width: 20px;
		border-top: 2px solid #8a7a66;
		vertical-align: middle;
		margin-right: 4px;
	}
	.net-legend .lk.dashed {
		border-top-style: dashed;
	}
	.net-legend .lk.dotted {
		border-top-style: dotted;
	}
	.net-hint {
		margin: 2px 0 0;
		font-size: var(--fs-sm);
		color: var(--muted);
	}
	.net-close {
		background: none;
		border: none;
		font-size: 1.8rem;
		line-height: 1;
		cursor: pointer;
		color: var(--muted);
	}
	svg {
		flex: 1;
		width: 100%;
		min-height: 0;
		background: var(--bg);
	}
</style>
