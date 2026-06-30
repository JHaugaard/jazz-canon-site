<script>
	import { selectMusician } from '$lib/stores/ui.js';
	import { epistemicMeta } from '$lib/epistemic.js';
	import EpistemicBadge from './EpistemicBadge.svelte';
	import PreviewButton from './PreviewButton.svelte';

	/** @type {{ tracks: import('$lib/data/albums.js').Track[] }} */
	let { tracks } = $props();
</script>

<ol class="tracklist">
	{#each tracks as track (track.track_id)}
		<li class="track">
			<div class="track-head">
				<PreviewButton trackId={track.track_id} url={track.preview_url} title={track.title} />
				<span class="num">{track.track_number}</span>
				<span class="title">{track.title}</span>
				{#if track.duration_text}<span class="dur">{track.duration_text}</span>{/if}
			</div>
			<ul class="players">
				{#each track.personnel as p (p.person_id + ':' + p.instrument)}
					<li>
						<button
							class="musician {epistemicMeta(p.epistemic).cls}"
							onclick={() => selectMusician(p.name_slug)}
						>
							{p.canonical_name}
						</button>
						<span class="instrument">{p.instrument}</span>
						<EpistemicBadge code={p.epistemic} />
					</li>
				{/each}
			</ul>
		</li>
	{/each}
</ol>

<style>
	.tracklist {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.track {
		padding: var(--sp-2) 0;
		border-bottom: 1px solid var(--line);
	}
	.track-head {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.num {
		color: var(--muted);
		font-size: var(--fs-sm);
		min-width: 1.4em;
	}
	.title {
		font-weight: 600;
	}
	.dur {
		margin-left: auto;
		color: var(--muted);
		font-size: var(--fs-sm);
	}
	.players {
		list-style: none;
		/* Indent past the play-slot + number so names align under the title. */
		margin: var(--sp-1) 0 0 calc(1.6em + 1.4em + var(--sp-2) * 2);
		padding: 0;
	}
	.players li {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
		padding: 1px 0;
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
	/* Epistemic treatment carries onto the name itself, not just the badge. */
	.musician.epi-inf {
		font-style: italic;
		color: #8a6d3b;
	}
	.musician.epi-unk {
		color: #9a3a2f;
	}
	.instrument {
		color: var(--muted);
		font-size: var(--fs-sm);
	}
</style>
