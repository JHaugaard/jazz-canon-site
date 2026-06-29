import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force';

/**
 * Radius for a graph node. Shared by the collision force and the renderer so
 * circles never overlap their collision bounds. Center largest; album nodes
 * larger than musicians; secondary musicians grow with shared-album count.
 * @param {{ type: string, isCenter?: boolean, weight?: number }} n
 * @returns {number}
 */
export function nodeRadius(n) {
	if (n.type === 'album') return 12 + (n.weight || 0) * 1.3;
	if (n.isCenter) return 22;
	return 7 + (n.weight || 0) * 2.2;
}

/**
 * Configure a force simulation over the scoped graph. The caller owns the tick
 * handler and lifecycle (D3 stays fenced inside the network component).
 * @param {any[]} nodes
 * @param {any[]} links
 * @param {number} width
 * @param {number} height
 */
export function createForceSim(nodes, links, width, height) {
	return forceSimulation(nodes)
		.force(
			'link',
			/** @type {any} */ (forceLink(links))
				.id((/** @type {any} */ d) => d.id)
				.distance(70)
		)
		.force('charge', forceManyBody().strength(-220))
		.force('center', forceCenter(width / 2, height / 2))
		.force(
			'collide',
			forceCollide().radius((/** @type {any} */ n) => nodeRadius(n) + 6)
		);
}
