<script>
	import {
		appleStatus,
		nowPlaying,
		playbackProgress,
		isConfigured,
		playAlbum,
		togglePlayPause,
		skipNext,
		skipPrev,
		stopFull
	} from '$lib/apple/musickit.js';

	/** @type {{ appleAlbumId: string | null | undefined, title: string }} */
	let { appleAlbumId, title } = $props();

	const configured = isConfigured();

	// Is THIS album the one engaged with MusicKit?
	const mine = $derived($nowPlaying.albumId === appleAlbumId ? $nowPlaying.status : 'idle');
	const active = $derived(mine === 'playing' || mine === 'paused' || mine === 'loading');

	/** @param {number} s */
	function fmt(s) {
		if (!s || s < 0) return '0:00';
		const m = Math.floor(s / 60);
		const sec = Math.floor(s % 60);
		return `${m}:${sec.toString().padStart(2, '0')}`;
	}
	const pct = $derived(
		$playbackProgress.duration ? ($playbackProgress.time / $playbackProgress.duration) * 100 : 0
	);
</script>

{#if configured && appleAlbumId}
	<div class="full">
		{#if !active}
			<button class="cta" onclick={() => playAlbum(appleAlbumId ?? '', title)}>
				▶ Play full album
			</button>
		{:else}
			<div class="player" aria-label="Apple Music player">
				<div class="controls">
					<button class="ctl" onclick={skipPrev} aria-label="Previous track">⏮</button>
					<button class="ctl play" onclick={togglePlayPause}
						aria-label={mine === 'playing' ? 'Pause' : 'Play'}>
						{mine === 'playing' ? '❚❚' : mine === 'loading' ? '◌' : '▶'}
					</button>
					<button class="ctl" onclick={skipNext} aria-label="Next track">⏭</button>
					<span class="np">{$nowPlaying.title || (mine === 'loading' ? 'Loading…' : '')}</span>
					<button class="ctl stop" onclick={stopFull} aria-label="Stop">×</button>
				</div>
				<div class="bar" role="progressbar" aria-valuenow={Math.round(pct)}>
					<div class="fill" style="width: {pct}%"></div>
				</div>
				<div class="time">
					<span>{fmt($playbackProgress.time)}</span>
					<span>{fmt($playbackProgress.duration)}</span>
				</div>
			</div>
		{/if}

		{#if $appleStatus.message}
			<p class="msg">{$appleStatus.message}</p>
		{/if}
	</div>
{/if}

<style>
	.full {
		margin-top: var(--sp-2);
	}
	.cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		padding: var(--sp-2) var(--sp-3);
		border: 1px solid var(--bn-blue);
		border-radius: var(--radius);
		background: var(--bn-blue);
		color: #fff;
		font-size: var(--fs-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.cta:hover {
		filter: brightness(1.08);
	}
	.player {
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: var(--sp-2);
		background: var(--bg);
	}
	.controls {
		display: flex;
		align-items: center;
		gap: var(--sp-2);
	}
	.ctl {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.9em;
		height: 1.9em;
		padding: 0 0.3em;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--surface, #fff);
		color: var(--bn-blue);
		cursor: pointer;
		font-size: 0.8rem;
		line-height: 1;
	}
	.ctl:hover {
		border-color: var(--bn-blue);
	}
	.ctl.play {
		background: var(--bn-blue);
		color: #fff;
		border-color: var(--bn-blue);
	}
	.ctl.stop {
		margin-left: auto;
		color: var(--muted);
	}
	.np {
		font-size: var(--fs-sm);
		font-weight: 600;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.bar {
		height: 4px;
		background: var(--line);
		border-radius: 2px;
		margin: var(--sp-2) 0 4px;
		overflow: hidden;
	}
	.fill {
		height: 100%;
		background: var(--bn-blue);
		transition: width 0.25s linear;
	}
	.time {
		display: flex;
		justify-content: space-between;
		font-size: 0.68rem;
		color: var(--muted);
	}
	.msg {
		margin: var(--sp-2) 0 0;
		font-size: 0.72rem;
		color: var(--muted);
	}
</style>
