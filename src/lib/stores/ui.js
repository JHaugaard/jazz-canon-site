// Selection state for the app's coordinated panels.
// Phase 2 only sets selectedAlbumId on card click; the Deep Dive panel that
// consumes it arrives in Phase 3, and the musician selection in Phase 4.
import { writable } from 'svelte/store';

/** @type {import('svelte/store').Writable<string | null>} */
export const selectedAlbumId = writable(null);

/** Musician selected for the Personnel Network (consumer arrives in Phase 4). */
/** @type {import('svelte/store').Writable<string | null>} */
export const selectedMusician = writable(null);

/** @param {string} id */
export function selectAlbum(id) {
	selectedAlbumId.set(id);
}

/** Dismiss the Deep Dive panel, returning to the timeline. */
export function clearSelection() {
	selectedAlbumId.set(null);
}

/**
 * Record a musician selection — opens / re-scopes the Personnel Network.
 * @param {string} nameSlug
 */
export function selectMusician(nameSlug) {
	selectedMusician.set(nameSlug);
}

/** Dismiss the Personnel Network, returning to the timeline (or open Deep Dive). */
export function clearMusician() {
	selectedMusician.set(null);
}
