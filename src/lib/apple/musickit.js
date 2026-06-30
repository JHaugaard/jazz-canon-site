// Apple MusicKit JS (v3) — full-album playback for signed-in subscribers.
// Progressive enhancement: everything here is lazy and optional. If the token
// is absent, the SDK fails to load, the user declines auth, or they're not a
// subscriber, the app silently keeps the 30s previews + the Apple Music link.
import { writable, get } from 'svelte/store';
import { env } from '$env/dynamic/public';
import { stop as stopPreview } from '$lib/stores/preview.js';

const DEV_TOKEN = env.PUBLIC_APPLE_DEV_TOKEN || '';
const SDK_URL = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';

/**
 * @typedef {'idle'|'loading'|'ready'|'authorized'|'unsupported'} AppleState
 * @typedef {{ state: AppleState, canPlayFull: boolean, message: string }} AppleStatus
 */

/** @type {import('svelte/store').Writable<AppleStatus>} */
export const appleStatus = writable({ state: 'idle', canPlayFull: false, message: '' });

/** @type {import('svelte/store').Writable<{ albumId: string | null, title: string, status: 'idle'|'loading'|'playing'|'paused' }>} */
export const nowPlaying = writable({ albumId: null, title: '', status: 'idle' });

/** Playback position for the player UI. */
/** @type {import('svelte/store').Writable<{ time: number, duration: number }>} */
export const playbackProgress = writable({ time: 0, duration: 0 });

/** Is the feature even possible? (token present) */
export function isConfigured() {
	return Boolean(DEV_TOKEN);
}

/** @type {any} */
let music = null; // the MusicKit instance once configured
/** @type {Promise<any> | null} */
let loadPromise = null;

/** Warn loudly in the console when the developer token is near/at expiry. */
function checkTokenExpiry() {
	try {
		const payload = JSON.parse(atob(DEV_TOKEN.split('.')[1]));
		const daysLeft = Math.floor((payload.exp * 1000 - Date.now()) / 86400000);
		if (daysLeft <= 14) {
			console.warn(
				`[A Jazz Canon] Apple Music developer token expires in ${daysLeft} day(s). ` +
					'Full playback will break when it does. Rotate it: ' +
					'see docs/apple-token-rotation.md (scripts/gen_dev_token.py).'
			);
		}
	} catch {
		/* token unparseable — configure() will surface the real failure */
	}
}

/** Inject the MusicKit script tag once and resolve when window.MusicKit exists. */
function loadSdk() {
	if (loadPromise) return loadPromise;
	loadPromise = new Promise((resolve, reject) => {
		if (typeof window === 'undefined') {
			reject(new Error('no window'));
			return;
		}
		const w = /** @type {any} */ (window);
		if (w.MusicKit) {
			resolve(w.MusicKit);
			return;
		}
		const finish = () => (w.MusicKit ? resolve(w.MusicKit) : reject(new Error('MusicKit missing')));
		document.addEventListener('musickitloaded', finish, { once: true });
		const s = document.createElement('script');
		s.src = SDK_URL;
		s.async = true;
		s.onerror = () => reject(new Error('MusicKit SDK failed to load'));
		document.head.appendChild(s);
	});
	return loadPromise;
}

/**
 * Wire MusicKit playback events to the nowPlaying store.
 * @param {any} MusicKit
 */
function bindEvents(MusicKit) {
	const States = MusicKit.PlaybackStates;
	music.addEventListener('playbackStateDidChange', (/** @type {any} */ e) => {
		const state = e.state;
		nowPlaying.update((np) => {
			let status = np.status;
			if (state === States.playing) status = 'playing';
			else if (state === States.paused) status = 'paused';
			else if (state === States.loading || state === States.waiting) status = 'loading';
			else if (state === States.completed || state === States.stopped || state === States.none)
				status = 'idle';
			return { ...np, status };
		});
	});
	music.addEventListener('nowPlayingItemDidChange', (/** @type {any} */ e) => {
		if (e.item) nowPlaying.update((np) => ({ ...np, title: e.item.title || '' }));
	});
	music.addEventListener('playbackTimeDidChange', (/** @type {any} */ e) => {
		const duration = e.currentPlaybackDuration || 0;
		playbackProgress.set({ time: e.currentPlaybackTime || 0, duration });
		// A full track is minutes long; a ~30s clip means we're getting previews.
		if (duration > 0 && duration <= 31) {
			appleStatus.update((s) =>
				s.message
					? s
					: {
							...s,
							message: previewFallbackReason()
						}
			);
		}
	});
}

/** Explain WHY only 30s previews are playing (secure context vs subscription). */
function previewFallbackReason() {
	const secure = typeof window !== 'undefined' && window.isSecureContext;
	return secure
		? 'Only 30-second previews are playing — your Apple Music subscription may be inactive.'
		: 'This is an insecure (http://) address, so Apple only allows 30-second previews here. Full albums play over https — e.g. in production.';
}

/**
 * Load + configure + authorize. Returns true if the user is connected and can
 * (attempt to) play full content. Safe to call repeatedly.
 */
export async function connect() {
	if (!isConfigured()) {
		appleStatus.set({ state: 'unsupported', canPlayFull: false, message: 'Apple Music not configured.' });
		return false;
	}
	if (music && get(appleStatus).state === 'authorized') return true;

	appleStatus.set({ state: 'loading', canPlayFull: false, message: '' });
	try {
		checkTokenExpiry();
		const MusicKit = await loadSdk();
		if (!music) {
			music = await MusicKit.configure({
				developerToken: DEV_TOKEN,
				app: { name: 'A Jazz Canon', build: '1.0.0' }
			});
			bindEvents(MusicKit);
		}
		await music.authorize(); // prompts Apple sign-in; throws if declined
		appleStatus.set({ state: 'authorized', canPlayFull: true, message: '' });
		return true;
	} catch (err) {
		// Declined, popup blocked, network, etc. — degrade quietly to previews.
		appleStatus.set({
			state: 'ready',
			canPlayFull: false,
			message: 'Could not connect to Apple Music. Previews still work.'
		});
		return false;
	}
}

/**
 * Play a full album by its Apple catalog id. Stops any 30s preview first.
 * @param {string} albumId
 * @param {string} [albumTitle]
 */
export async function playAlbum(albumId, albumTitle = '') {
	stopPreview();
	appleStatus.update((s) => ({ ...s, message: '' })); // clear stale notices
	const ok = music && get(appleStatus).state === 'authorized' ? true : await connect();
	if (!ok || !music) return false;
	nowPlaying.set({ albumId, title: albumTitle, status: 'loading' });
	try {
		await music.setQueue({ album: albumId });
		await music.play();
		return true;
	} catch (err) {
		// Most commonly: not a subscriber, or content unavailable in storefront.
		nowPlaying.set({ albumId: null, title: '', status: 'idle' });
		appleStatus.update((s) => ({
			...s,
			canPlayFull: false,
			message: 'Full playback needs an active Apple Music subscription.'
		}));
		return false;
	}
}

export async function togglePlayPause() {
	if (!music) return;
	const status = get(nowPlaying).status;
	if (status === 'playing') await music.pause();
	else await music.play();
}

export async function skipNext() {
	if (music && typeof music.skipToNextItem === 'function') await music.skipToNextItem();
}

export async function skipPrev() {
	if (music && typeof music.skipToPreviousItem === 'function') await music.skipToPreviousItem();
}

export function stopFull() {
	if (music && typeof music.stop === 'function') music.stop();
	nowPlaying.set({ albumId: null, title: '', status: 'idle' });
	playbackProgress.set({ time: 0, duration: 0 });
}
