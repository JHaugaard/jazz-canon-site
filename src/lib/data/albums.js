import albums from '$data/albums.json';

/**
 * Return the full canon album list, shape preserved.
 * The whole record is passed through (epistemic-bearing fields downstream,
 * apple_album_id, cover_art_url, etc.) so later phases need no loader change.
 * The return type is inferred from albums.json, so callers get real field types.
 */
export function getAlbums() {
	return albums;
}

/**
 * One album record, with its real field types inferred from albums.json.
 * Single source of truth for the album shape across components.
 * @typedef {ReturnType<typeof getAlbums>[number]} Album
 */

/**
 * @typedef {{ person_id: string, canonical_name: string, name_slug: string, instrument: string, epistemic: string }} Performer
 * @typedef {{ track_id: string, title: string, track_number: number, side: string | null, duration_text: string | null, apple_track_id: string | null, personnel: Performer[] }} Track
 * @typedef {Album & { recording_dates_text: string | null, description: string | null, studios: string[], personnel: Performer[], tracks: Track[] }} AlbumDetail
 */

// One lazy chunk per album detail file (loaded only when a Deep Dive opens).
// import.meta.glob needs a literal relative path (no $data alias); data/ is at
// the repo root, three levels up from src/lib/data/.
const albumModules = import.meta.glob('../../../data/album/*.json');

/**
 * Lazy-load a single album's full detail record by slug.
 * @param {string} slug
 * @returns {Promise<AlbumDetail>}
 */
export async function loadAlbum(slug) {
	const path = `../../../data/album/${slug}.json`;
	const importer = albumModules[path];
	if (!importer) {
		throw new Error(`Unknown album slug: ${slug}`);
	}
	const mod = /** @type {{ default: AlbumDetail }} */ (await importer());
	return mod.default;
}
