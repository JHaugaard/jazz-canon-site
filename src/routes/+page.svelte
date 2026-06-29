<script>
	import Timeline from '$lib/components/Timeline.svelte';
	import DeepDivePanel from '$lib/components/DeepDivePanel.svelte';
	import PersonnelNetwork from '$lib/components/PersonnelNetwork.svelte';

	/** @type {{ data: { albums: import('$lib/data/albums.js').Album[] } }} */
	let { data } = $props();

	// Brand string is "A Jazz Canon" — the year range is supporting text (tagline /
	// meta), never fused into the title itself.
	const TITLE = 'A Jazz Canon';
	const DESCRIPTION =
		'A curated canon of essential jazz albums, 1949–1972 — cool jazz through post-bop — with track-level personnel and an interactive Personnel Network.';
</script>

<svelte:head>
	<title>{TITLE}</title>
	<meta name="description" content={DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={TITLE} />
	<meta property="og:description" content={DESCRIPTION} />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
</svelte:head>

<header class="site-header">
	<div class="brand">
		<h1>A Jazz Canon</h1>
		<p class="tagline">Jazz on record · 1949–1972</p>
	</div>
	<nav class="site-nav">
		<a href="/about">About</a>
	</nav>
</header>

<Timeline albums={data.albums} />
<DeepDivePanel />
<PersonnelNetwork />

<style>
	.site-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: var(--sp-4) var(--sp-4) var(--sp-3);
	}
	.brand h1 {
		margin: 0;
	}
	.tagline {
		margin: 2px 0 0;
		color: var(--muted);
		font-size: var(--fs-base);
		letter-spacing: 0.01em;
	}
	.site-nav a {
		font-family: var(--font-display, inherit);
		font-size: var(--fs-base);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--bn-blue);
		text-decoration: none;
	}
	.site-nav a:hover {
		text-decoration: underline;
	}
</style>
