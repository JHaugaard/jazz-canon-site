import network from '$data/network.json';

/**
 * @typedef {{ album_id: string, epistemic: string }} AlbumRef
 * @typedef {{ person_id: string, canonical_name: string, name_slug: string, instruments: string[], album_ids: string[], album_refs?: AlbumRef[] }} NetMusician
 * @typedef {{ album_id: string, title: string, year: number }} NetAlbum
 */

/** The full pre-computed bipartite network (loaded once). */
export function getNetwork() {
	return network;
}

/**
 * @typedef {{ id: string, type: 'musician' | 'album', label: string, albumIds: string[], weight: number, isCenter?: boolean, instruments?: string[], year?: number }} GraphNode
 * @typedef {{ source: string, target: string, epistemic: string | null }} GraphLink
 * @typedef {{ nodes: GraphNode[], links: GraphLink[], center: GraphNode }} ScopedGraph
 */

/**
 * Build the spec §5.3 scoped sub-graph for one musician: the musician centered,
 * their canon albums as nodes, and the co-personnel who share those albums as
 * secondary nodes. Links are musician→album ("played on"). Pure function over the
 * loaded network — given the same slug it always returns the same graph.
 * @param {string} centerSlug
 * @returns {ScopedGraph}
 */
export function buildScopedGraph(centerSlug) {
	const musicians = /** @type {NetMusician[]} */ (network.musicians);
	const albums = /** @type {NetAlbum[]} */ (network.albums);

	const center = musicians.find((m) => m.name_slug === centerSlug);
	if (!center) {
		throw new Error(`Unknown musician slug: ${centerSlug}`);
	}

	const centerAlbumIds = new Set(center.album_ids);
	const albumById = new Map(albums.map((a) => [a.album_id, a]));

	// Per-musician map of album_id -> epistemic (their credit certainty on that album).
	// Used to style "played on" links. Falls back to null if album_refs is absent
	// (e.g. a pre-epistemic network export) so the graph still renders.
	/** @type {Map<string, Record<string, string>>} */
	const epiByMusician = new Map();

	// Musician nodes: the center plus everyone who shares >= 1 of the center's albums.
	const musicianNodes = musicians
		.filter((m) => m.name_slug === centerSlug || m.album_ids.some((a) => centerAlbumIds.has(a)))
		.map((m) => {
			// album_ids restricted to the scoped album set (the center's albums)
			const scopedAlbumIds = m.album_ids.filter((a) => centerAlbumIds.has(a));
			/** @type {Record<string, string>} */
			const epi = {};
			for (const r of m.album_refs ?? []) epi[r.album_id] = r.epistemic;
			epiByMusician.set(`m:${m.name_slug}`, epi);
			return {
				id: `m:${m.name_slug}`,
				type: /** @type {'musician'} */ ('musician'),
				label: m.canonical_name,
				isCenter: m.name_slug === centerSlug,
				instruments: m.instruments,
				albumIds: scopedAlbumIds,
				// secondary musician weight ∝ how many of the center's albums they share
				weight: m.name_slug === centerSlug ? scopedAlbumIds.length : scopedAlbumIds.length
			};
		});

	// Album nodes: the center's albums.
	const albumNodes = center.album_ids.map((albumId) => {
		const a = albumById.get(albumId);
		// album weight ∝ how many of the graph's musicians play on it
		const playerCount = musicianNodes.filter((mn) => mn.albumIds.includes(albumId)).length;
		return {
			id: `a:${albumId}`,
			type: /** @type {'album'} */ ('album'),
			label: a ? a.title : albumId,
			year: a ? a.year : undefined,
			albumIds: [albumId],
			weight: playerCount
		};
	});

	// Links: each musician node → each scoped album node they played on, carrying
	// that musician's epistemic for that album (drives solid/dashed/dotted edges).
	/** @type {GraphLink[]} */
	const links = [];
	for (const mn of musicianNodes) {
		const epi = epiByMusician.get(mn.id) ?? {};
		for (const albumId of mn.albumIds) {
			links.push({ source: mn.id, target: `a:${albumId}`, epistemic: epi[albumId] ?? null });
		}
	}

	const nodes = [...musicianNodes, ...albumNodes];
	const centerNode = /** @type {GraphNode} */ (musicianNodes.find((n) => n.isCenter));
	return { nodes, links, center: centerNode };
}
