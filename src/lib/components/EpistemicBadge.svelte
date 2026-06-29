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
	/* obs — sourced fact: quiet, normal weight */
	.epi-obs {
		color: var(--muted);
		border-color: var(--line);
		background: var(--surface);
	}
	/* inf — inferred: muted + italic */
	.epi-inf {
		color: #8a6d3b;
		background: rgba(190, 150, 70, 0.12);
		border-color: rgba(190, 150, 70, 0.4);
		font-style: italic;
	}
	/* unk — uncertain: visually distinct, must not read as fact */
	.epi-unk {
		color: #9a3a2f;
		background: rgba(180, 70, 55, 0.12);
		border-color: rgba(180, 70, 55, 0.5);
		font-weight: 700;
	}
</style>
