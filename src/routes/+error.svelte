<script>
	import { page } from '$app/state';
	import SiteHeader from '$lib/components/SiteHeader.svelte';
</script>

<svelte:head>
	<title>{page.status} — A Jazz Canon</title>
</svelte:head>

<SiteHeader navLabel="Home" navHref="/" />

<main class="err">
	<p class="code">{page.status}</p>
	<h1>{page.status === 404 ? 'Off the record' : 'Something went sideways'}</h1>
	<p class="msg">
		{page.status === 404
			? "That page isn’t in the canon — but the music’s still on the shelf."
			: (page.error?.message ?? 'An unexpected error occurred.')}
	</p>
	<a class="home" href="/">← Back to the timeline</a>
</main>

<style>
	.err {
		max-width: 640px;
		margin: 0 auto;
		padding: var(--sp-5) var(--sp-4);
		text-align: center;
	}
	.code {
		font-family: var(--font-display);
		font-variant: small-caps;
		font-size: 4rem;
		font-weight: 600;
		color: var(--bn-blue);
		margin: 0;
		line-height: 1;
	}
	h1 {
		font-family: var(--font-display);
		font-variant: small-caps;
		font-weight: 600;
		margin: var(--sp-2) 0;
	}
	.msg {
		color: var(--muted);
		margin: 0 0 var(--sp-4);
	}
	.home {
		color: var(--bn-blue);
		font-weight: 600;
		text-decoration: none;
	}
	.home:hover {
		text-decoration: underline;
	}
</style>
