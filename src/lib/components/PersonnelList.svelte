<script>
	import { selectMusician } from '$lib/stores/ui.js';
	import EpistemicBadge from './EpistemicBadge.svelte';

	/** @type {{ personnel: import('$lib/data/albums.js').Performer[] }} */
	let { personnel } = $props();

	// De-dupe by person + instrument (a performer can appear across many tracks).
	const deduped = $derived.by(() => {
		const seen = new Map();
		for (const p of personnel) {
			const key = `${p.person_id}:${p.instrument}`;
			if (!seen.has(key)) seen.set(key, p);
		}
		return [...seen.values()].sort((a, b) => a.canonical_name.localeCompare(b.canonical_name));
	});
</script>

<details class="personnel">
	<summary>Full album personnel ({deduped.length})</summary>
	<ul>
		{#each deduped as p (p.person_id + ':' + p.instrument)}
			<li>
				<button class="musician" onclick={() => selectMusician(p.name_slug)}>
					{p.canonical_name}
				</button>
				<span class="instrument">{p.instrument}</span>
				<EpistemicBadge code={p.epistemic} />
			</li>
		{/each}
	</ul>
</details>

<style>
	.personnel {
		margin-top: var(--sp-3);
		border-top: 1px solid var(--line);
		padding-top: var(--sp-2);
	}
	summary {
		cursor: pointer;
		font-weight: 600;
		font-size: var(--fs-sm);
		color: var(--muted);
	}
	ul {
		list-style: none;
		margin: var(--sp-2) 0 0;
		padding: 0;
	}
	li {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 2px 0;
	}
	.musician {
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		color: var(--bn-blue);
		cursor: pointer;
		text-align: left;
	}
	.musician:hover {
		text-decoration: underline;
	}
	.instrument {
		color: var(--muted);
		font-size: var(--fs-sm);
	}
</style>
