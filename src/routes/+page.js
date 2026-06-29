import { getAlbums } from '$lib/data/albums.js';

// Universal load (not +page.server.js): this is a static prerendered site with
// no runtime server. The load runs at build time and bakes the data into HTML.
export function load() {
	return { albums: getAlbums() };
}
