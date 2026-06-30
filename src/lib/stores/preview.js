// 30-second Apple Music preview playback — a single shared audio element so
// only ONE preview can play at a time. The UI binds to `preview` for the
// active track + status, and to `brokenPreviews` so a track whose clip fails
// at runtime can remove its own button (graceful failure: never a dead button).
import { writable } from 'svelte/store';

/**
 * @typedef {{ trackId: string | null, status: 'idle' | 'loading' | 'playing' }} PreviewState
 */

/** @type {import('svelte/store').Writable<PreviewState>} */
export const preview = writable({ trackId: null, status: 'idle' });

/** Track ids whose preview_url failed to load/play — their buttons hide. */
/** @type {import('svelte/store').Writable<Set<string>>} */
export const brokenPreviews = writable(new Set());

/** @type {HTMLAudioElement | null} */
let audio = null; // the one shared HTMLAudioElement
/** @type {string | null} */
let currentId = null;

// Test seam: overridable factory so the controller is unit-testable without
// a real browser Audio element.
let makeAudio = (/** @type {string} */ url) => new Audio(url);

/** @param {(url: string) => any} fn */
export function _setAudioFactory(fn) {
	makeAudio = fn;
}

function reset() {
	currentId = null;
	preview.set({ trackId: null, status: 'idle' });
}

/**
 * Mark a track's preview as unavailable so the UI stops offering it.
 * @param {string} trackId
 */
function markBroken(trackId) {
	brokenPreviews.update((s) => {
		const next = new Set(s);
		next.add(trackId);
		return next;
	});
}

/** Stop and release any current preview. */
export function stop() {
	if (audio) {
		audio.pause();
		audio.src = '';
		audio = null;
	}
	reset();
}

/**
 * Toggle a track's preview: clicking the active track stops it; clicking a
 * different track stops the old one and starts the new one.
 * @param {string} trackId
 * @param {string | null | undefined} url
 */
export function toggle(trackId, url) {
	if (!url) return; // nothing to play — caller shouldn't render a button
	if (currentId === trackId) {
		stop();
		return;
	}
	stop();
	currentId = trackId;
	preview.set({ trackId, status: 'loading' });

	const a = makeAudio(url);
	audio = a;
	const fail = () => {
		if (audio === a) {
			stop();
			markBroken(trackId);
		}
	};
	a.addEventListener('playing', () => {
		if (audio === a) preview.set({ trackId, status: 'playing' });
	});
	a.addEventListener('ended', () => {
		if (audio === a) stop();
	});
	a.addEventListener('error', fail);

	const p = a.play();
	if (p && typeof p.catch === 'function') p.catch(fail);
}
