<script>
	import logoMark from '$lib/assets/logo-mark.svg';

	/** @type {{ navLabel: string, navHref: string }} */
	let { navLabel, navHref } = $props();
</script>

<header class="site-header">
	<a class="brand" href="/">
		<img class="logo-mark" src={logoMark} alt="" width="142" height="92" />
		<span class="brand-text">
			<span class="brand-title">A Jazz Canon</span>
			<span class="tagline">Jazz on Record</span>
		</span>
	</a>
	<nav class="site-nav">
		<a href={navHref}>{navLabel}</a>
	</nav>
</header>

<style>
	.site-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding: var(--sp-4) var(--sp-4) var(--sp-3);
		border-bottom: 1px solid var(--line);
	}
	.brand {
		display: flex;
		align-items: flex-end;
		gap: var(--sp-3);
		text-decoration: none;
	}
	.logo-mark {
		display: block;
		flex-shrink: 0;
	}
	.brand-text {
		display: flex;
		flex-direction: column;
	}
	.brand-title {
		font-family: var(--font-display);
		font-size: 2.1rem;
		font-weight: 600;
		font-variant: small-caps;
		letter-spacing: 0.03em;
		color: var(--ink);
	}
	.tagline {
		margin-top: 4px;
		color: var(--muted);
		font-size: 1.05rem;
		letter-spacing: 0.01em;
	}
	.site-nav a {
		font-family: var(--font-display, inherit);
		font-size: var(--fs-base);
		font-weight: 600;
		font-variant: small-caps;
		letter-spacing: 0.04em;
		color: var(--bn-blue);
		text-decoration: none;
	}
	.site-nav a:hover {
		text-decoration: underline;
	}
</style>
