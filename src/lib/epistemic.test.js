import { describe, it, expect } from 'vitest';
import { epistemicMeta } from './epistemic.js';

describe('epistemicMeta', () => {
	it('gives each known code a distinct css class', () => {
		const classes = ['obs', 'inf', 'unk'].map((c) => epistemicMeta(c).cls);
		expect(new Set(classes).size).toBe(3);
	});

	it('gives every known code a non-empty human title', () => {
		for (const c of ['obs', 'inf', 'unk']) {
			expect(epistemicMeta(c).title.length).toBeGreaterThan(0);
		}
	});

	it('marks unk with a visible question marker', () => {
		expect(epistemicMeta('unk').short).toContain('?');
	});

	it('falls back to the unk treatment for an unrecognized code', () => {
		expect(epistemicMeta('garbage').cls).toBe(epistemicMeta('unk').cls);
	});
});
