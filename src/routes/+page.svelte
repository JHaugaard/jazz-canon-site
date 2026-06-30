<script>
	import Timeline from '$lib/components/Timeline.svelte';
	import DeepDivePanel from '$lib/components/DeepDivePanel.svelte';
	import PersonnelNetwork from '$lib/components/PersonnelNetwork.svelte';
	import SiteHeader from '$lib/components/SiteHeader.svelte';

	/** @type {{ data: { albums: import('$lib/data/albums.js').Album[] } }} */
	let { data } = $props();

	// Brand string is "A Jazz Canon" — the year range is supporting text (tagline /
	// meta), never fused into the title itself.
	const TITLE = 'A Jazz Canon';
	const DESCRIPTION =
		'A curated canon of essential jazz albums — cool jazz through post-bop — with track-level personnel and an interactive Constellation of who played with whom.';
</script>

<svelte:head>
	<title>{TITLE}</title>
	<meta name="description" content={DESCRIPTION} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={TITLE} />
	<meta property="og:description" content={DESCRIPTION} />
	<meta property="og:image" content="/og-image.svg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
	<meta name="twitter:image" content="/og-image.svg" />
</svelte:head>

<SiteHeader navLabel="About" navHref="/about" />

<h1 class="sr-only">A Jazz Canon — a curated canon of essential jazz albums, 1949–1972</h1>

<Timeline albums={data.albums} />

<style>
	/* Accessible page heading without altering the visual design (the brand
	   wordmark in the header is a link, not the document heading). */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}
</style>
<DeepDivePanel />
<PersonnelNetwork />
