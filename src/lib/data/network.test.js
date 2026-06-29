import { describe, it, expect } from 'vitest';
import { buildScopedGraph } from './network.js';

describe('buildScopedGraph', () => {
	const g = buildScopedGraph('paul-chambers');

	it('has exactly one center node, and it is the requested musician', () => {
		const centers = g.nodes.filter((n) => n.isCenter);
		expect(centers).toHaveLength(1);
		expect(centers[0].id).toBe('m:paul-chambers');
		expect(centers[0].type).toBe('musician');
	});

	it("includes one album node per the center's albums (Paul Chambers: 13)", () => {
		const albums = g.nodes.filter((n) => n.type === 'album');
		expect(albums).toHaveLength(13);
	});

	it('includes at least one secondary musician', () => {
		const secondary = g.nodes.filter((n) => n.type === 'musician' && !n.isCenter);
		expect(secondary.length).toBeGreaterThan(0);
	});

	it('only links musicians to albums (never musician↔musician or album↔album)', () => {
		const typeOf = Object.fromEntries(g.nodes.map((n) => [n.id, n.type]));
		for (const l of g.links) {
			const pair = [typeOf[l.source], typeOf[l.target]].sort();
			expect(pair).toEqual(['album', 'musician']);
		}
	});

	it('only links a musician to albums that musician actually played on', () => {
		const albumIdsByMusician = new Map(g.nodes.filter((n) => n.type === 'musician').map((n) => [n.id, new Set(n.albumIds)]));
		for (const l of g.links) {
			const musicianId = albumIdsByMusician.has(l.source) ? l.source : l.target;
			const albumNodeId = musicianId === l.source ? l.target : l.source;
			const albumId = albumNodeId.replace(/^a:/, '');
			expect(albumIdsByMusician.get(musicianId)?.has(albumId)).toBe(true);
		}
	});

	it('every secondary musician shares >= 1 album with the center', () => {
		const centerAlbums = new Set(g.center.albumIds);
		for (const m of g.nodes.filter((n) => n.type === 'musician' && !n.isCenter)) {
			const shares = m.albumIds.some((a) => centerAlbums.has(a));
			expect(shares).toBe(true);
		}
	});

	it('carries a valid epistemic label on every link (for edge styling)', () => {
		for (const l of g.links) {
			expect(['obs', 'inf', 'unk', null]).toContain(l.epistemic);
		}
	});

	it('has at least some observed (obs) links for Paul Chambers', () => {
		// album_refs is populated in the current export, so links should be labelled.
		expect(g.links.some((l) => l.epistemic === 'obs')).toBe(true);
	});

	it('throws on an unknown musician slug', () => {
		expect(() => buildScopedGraph('not-a-real-musician')).toThrow();
	});
});
