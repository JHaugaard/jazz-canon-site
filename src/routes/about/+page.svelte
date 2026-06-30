<script>
	import SiteHeader from '$lib/components/SiteHeader.svelte';
</script>

<svelte:head>
	<title>About — A Jazz Canon</title>
	<meta
		name="description"
		content="About A Jazz Canon — a curated canon of essential jazz albums, 1949–1972."
	/>
</svelte:head>

<SiteHeader navLabel="Timeline" navHref="/" />

<main class="about">
	<h1>About</h1>

	<p class="lede">
		<em>A Jazz Canon</em> is a curated set of essential jazz albums — cool jazz through
		post-bop, roughly 1949–1972 — with track-level personnel for every record.
	</p>

	<p>
		The site is a personal discovery tool: travel the timeline, open an album to see who
		played on each track, then follow the thread through the <strong>Constellation</strong> to
		see the web of musicians who made the era.
	</p>

	<!-- STUB — placeholder copy. Real About content (sources, method, epistemic note,
	     credits, contact) to be written. -->
	<p class="stub-note">More to come — this page is a stub.</p>
</main>

<style>
	.about {
		max-width: 60ch;
		padding: var(--sp-5, 32px) var(--sp-4);
		line-height: 1.6;
	}
	.about h1 {
		font-size: 2rem;
		margin: 0 0 var(--sp-3);
	}
	.lede {
		font-size: var(--fs-lg);
		color: var(--ink);
	}
	.stub-note {
		margin-top: var(--sp-4);
		color: var(--muted);
		font-style: italic;
	}
</style>
