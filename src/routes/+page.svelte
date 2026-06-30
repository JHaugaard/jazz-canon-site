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
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content={TITLE} />
	<meta name="twitter:description" content={DESCRIPTION} />
</svelte:head>

<SiteHeader navLabel="About" navHref="/about" />

<Timeline albums={data.albums} />
<DeepDivePanel />
<PersonnelNetwork />
