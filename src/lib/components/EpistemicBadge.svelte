<script>
	import { epistemicMeta } from '$lib/epistemic.js';

	/** @type {{ code: string }} */
	let { code } = $props();
	const meta = $derived(epistemicMeta(code));
</script>

<abbr class="epi {meta.cls}" title={meta.title}>{meta.short}</abbr>

<style>
	.epi {
		font-size: 0.62rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 1px 4px;
		border-radius: 3px;
		border: 1px solid transparent;
		cursor: help;
		white-space: nowrap;
		text-decoration: none;
	}
	/* design-spec §2.4 — one amber family for inf/unk, distinguished by weight +
	   marker, never hue. obs is the quiet default. No red anywhere. */
	/* obs — sourced fact: quiet, normal weight, no fill */
	.epi-obs {
		color: var(--muted);
		font-weight: 400;
	}
	/* inf — inferred: warm amber, italic (echoes the editorial serif) */
	.epi-inf {
		color: var(--impulse-amber);
		background: rgba(196, 134, 42, 0.08);
		font-style: italic;
	}
	/* unk — uncertain: same amber family, but bold + "?" marker */
	.epi-unk {
		color: var(--impulse-amber);
		background: rgba(196, 134, 42, 0.12);
		font-weight: 700;
	}
</style>
