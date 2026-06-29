// The shared coordinate system for the redesigned timeline. Pure + testable.
// A year's horizontal width = its own card-grid width (1–4 columns by album count,
// capped at 4; overflow rows stack vertically). Empty years get a thin gap so the
// axis reads continuously. Every layer (era bands, year axis, card grid) aligns to
// the per-year x/width computed here.

export const CARD_W = 216; // one card's horizontal footprint (cover ~200 + gap)
export const COLS_MAX = 4; // cards per row
export const EMPTY_YEAR_W = 44; // width of a year with no albums (never zero)
export const YEAR_GAP = 28; // gap between adjacent year blocks
export const AXIS_MIN = 1949;
export const AXIS_MAX = 1972;

/**
 * @typedef {{ year: number, albums: any[], count: number, cols: number, rows: number, width: number, x: number, centerX: number }} YearBlock
 * @typedef {{ blocks: YearBlock[], totalWidth: number }} TimelineLayout
 */

/**
 * Compute the density-proportional year-block layout from the album list.
 * @param {Array<{ year: number }>} albums
 * @returns {TimelineLayout}
 */
export function buildLayout(albums) {
	/** @type {Map<number, any[]>} */
	const byYear = new Map();
	for (const a of albums) {
		if (!byYear.has(a.year)) byYear.set(a.year, []);
		byYear.get(a.year)?.push(a);
	}

	/** @type {YearBlock[]} */
	const blocks = [];
	let x = 0;
	for (let year = AXIS_MIN; year <= AXIS_MAX; year++) {
		const list = byYear.get(year) ?? [];
		const count = list.length;
		const cols = Math.min(count, COLS_MAX);
		const width = count > 0 ? cols * CARD_W : EMPTY_YEAR_W;
		const rows = count > 0 ? Math.ceil(count / COLS_MAX) : 0;
		blocks.push({ year, albums: list, count, cols, rows, width, x, centerX: x + width / 2 });
		x += width + YEAR_GAP;
	}
	const totalWidth = Math.max(0, x - YEAR_GAP); // drop trailing gap
	return { blocks, totalWidth };
}

/**
 * Pixel extent [x, width] spanning a year range — used to place an era band.
 * @param {YearBlock[]} blocks
 * @param {number} startYear
 * @param {number} endYear
 * @returns {{ x: number, width: number }}
 */
export function bandExtent(blocks, startYear, endYear) {
	const inRange = blocks.filter((b) => b.year >= startYear && b.year <= endYear);
	if (inRange.length === 0) return { x: 0, width: 0 };
	const first = inRange[0];
	const last = inRange[inRange.length - 1];
	return { x: first.x, width: last.x + last.width - first.x };
}

/**
 * The four canonical era bands (spec §5.1), positioned via bandExtent.
 * @param {YearBlock[]} blocks
 */
export function eraLanes(blocks) {
	return [
		{ name: 'Cool Jazz', start: 1949, end: 1958, color: 'var(--era-cool)' },
		{ name: 'Hard Bop', start: 1955, end: 1965, color: 'var(--era-hardbop)' },
		{ name: 'Modal Jazz', start: 1958, end: 1972, color: 'var(--era-modal)' },
		{ name: 'Post-Bop', start: 1962, end: 1968, color: 'var(--era-postbop)' }
	].map((e) => ({ ...e, ...bandExtent(blocks, e.start, e.end) }));
}

/**
 * Focus opacity for a block given the currently-centered year (spec: center 1.0,
 * ±1 0.85, ±2 0.6, ±3 0.35, beyond floored so the strip stays continuous).
 * @param {number} blockYear
 * @param {number} centerYear
 * @returns {number}
 */
export function focusOpacity(blockYear, centerYear) {
	const d = Math.abs(blockYear - centerYear);
	if (d === 0) return 1;
	if (d === 1) return 0.85;
	if (d === 2) return 0.6;
	if (d === 3) return 0.35;
	return 0.2;
}
