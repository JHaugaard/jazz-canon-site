import { describe, it, expect } from 'vitest';
import {
	buildLayout,
	bandExtent,
	eraLanes,
	COLS_MAX,
	EMPTY_YEAR_W,
	AXIS_MIN,
	AXIS_MAX
} from './timeline-layout.js';

const sample = [
	{ id: 'a', year: 1950 },
	{ id: 'b', year: 1950 },
	// 1951 empty
	...Array.from({ length: 11 }, (_, i) => ({ id: `c${i}`, year: 1964 }))
];

describe('buildLayout', () => {
	const { blocks, totalWidth } = buildLayout(sample);

	it('produces one block per year across the axis range', () => {
		expect(blocks).toHaveLength(AXIS_MAX - AXIS_MIN + 1);
		expect(blocks[0].year).toBe(AXIS_MIN);
		expect(blocks[blocks.length - 1].year).toBe(AXIS_MAX);
	});

	it('caps columns at COLS_MAX and stacks overflow into rows (1964: 11 albums)', () => {
		const y1964 = blocks.find((b) => b.year === 1964);
		expect(y1964?.count).toBe(11);
		expect(y1964?.cols).toBe(COLS_MAX);
		expect(y1964?.rows).toBe(Math.ceil(11 / COLS_MAX));
	});

	it('gives empty years a thin non-zero width and no rows', () => {
		const y1951 = blocks.find((b) => b.year === 1951);
		expect(y1951?.count).toBe(0);
		expect(y1951?.width).toBe(EMPTY_YEAR_W);
		expect(y1951?.rows).toBe(0);
	});

	it('lays blocks left-to-right with strictly increasing x', () => {
		for (let i = 1; i < blocks.length; i++) {
			expect(blocks[i].x).toBeGreaterThan(blocks[i - 1].x);
		}
		expect(totalWidth).toBeGreaterThan(0);
	});
});

describe('bandExtent / eraLanes', () => {
	const { blocks } = buildLayout(sample);

	it('spans from the first year in range to the end of the last', () => {
		const ext = bandExtent(blocks, 1950, 1964);
		const b1950 = blocks.find((b) => b.year === 1950);
		expect(ext.x).toBe(b1950?.x);
		expect(ext.width).toBeGreaterThan(0);
	});

	it('returns the four era lanes, each with a positive width', () => {
		const lanes = eraLanes(blocks);
		expect(lanes.map((l) => l.name)).toEqual(['Cool Jazz', 'Hard Bop', 'Modal Jazz', 'Post-Bop']);
		for (const l of lanes) expect(l.width).toBeGreaterThan(0);
	});
});

