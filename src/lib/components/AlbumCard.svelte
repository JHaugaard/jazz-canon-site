<script>
	import { selectAlbum } from '$lib/stores/ui.js';

	/** @type {{ album: import('$lib/data/albums.js').Album }} */
	let { album } = $props();
</script>

<button class="album-card" onclick={() => selectAlbum(album.id)} title={album.title}>
	<div class="art">
		{#if album.cover_art_url}
			<img src={album.cover_art_url} alt="Cover of {album.title}" loading="lazy" />
		{:else}
			<div class="art-fallback"><span>{album.title}</span></div>
		{/if}
		<span class="year-badge">{album.year}</span>
	</div>
	<div class="meta">
		<span class="title">{album.title}</span>
		<span class="artist">{album.artist_name}</span>
		<span class="style">{album.style_display}</span>
	</div>
</button>

<style>
	.album-card {
		display: block;
		width: 200px;
		padding: 0;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface);
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		font: inherit;
		color: inherit;
		transition: box-shadow 0.15s ease, transform 0.15s ease;
	}
	.album-card:hover {
		box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
		transform: translateY(-2px);
	}
	.art {
		position: relative;
		width: 200px;
		height: 200px;
		background: var(--bg);
	}
	.art img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.art-fallback {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--sp-3);
		text-align: center;
		font-weight: 600;
		font-size: var(--fs-base);
		color: var(--muted);
		background: repeating-linear-gradient(
			45deg,
			var(--bg),
			var(--bg) 10px,
			var(--surface) 10px,
			var(--surface) 20px
		);
	}
	.year-badge {
		position: absolute;
		left: var(--sp-1);
		bottom: var(--sp-1);
		background: rgba(0, 0, 0, 0.72);
		color: #fff;
		font-size: var(--fs-sm);
		font-weight: 600;
		padding: 1px 6px;
		border-radius: 4px;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 1px;
		padding: var(--sp-2);
	}
	.title {
		font-size: var(--fs-base);
		font-weight: 600;
		line-height: 1.25;
		/* bigger cards have room for the full title on up to two lines */
		display: -webkit-box;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.artist {
		font-size: var(--fs-sm);
		color: var(--muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.style {
		font-size: 0.7rem;
		color: var(--accent);
		text-transform: uppercase;
		letter-spacing: 0.03em;
		margin-top: 2px;
	}
</style>
