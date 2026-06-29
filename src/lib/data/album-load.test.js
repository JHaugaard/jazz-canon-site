import { describe, it, expect } from 'vitest';
import { loadAlbum } from './albums.js';

describe('loadAlbum', () => {
	it('lazy-loads a full album detail by slug', async () => {
		const a = await loadAlbum('miles-davis-kind-of-blue-1959');
		expect(a.title).toBe('Kind of Blue');
		expect(a.tracks.length).toBeGreaterThan(0);
		expect(a.tracks[0].personnel.length).toBeGreaterThan(0);
	});

	it('rejects an unknown slug', async () => {
		await expect(loadAlbum('does-not-exist')).rejects.toThrow();
	});
});
