import { describe, it, expect } from 'vitest';
import { getAlbums } from './albums.js';

describe('getAlbums', () => {
	const albums = getAlbums();

	it('returns all 100 canon albums', () => {
		expect(albums).toHaveLength(100);
	});

	it('preserves the full album shape (no field-stripping)', () => {
		// Phases 2–4 depend on these surviving the loader untouched.
		for (const key of ['id', 'title', 'artist_name', 'year', 'apple_album_id']) {
			expect(albums[0]).toHaveProperty(key);
		}
	});

	it('every album has a non-empty title and a numeric year', () => {
		for (const a of albums) {
			expect(typeof a.title).toBe('string');
			expect(a.title.length).toBeGreaterThan(0);
			expect(typeof a.year).toBe('number');
		}
	});
});
