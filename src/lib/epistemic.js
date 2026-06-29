// Single source of truth for the epistemic treatment (spec §3).
// Two categories of information must never look the same; this is the one place
// the obs/inf/unk distinction is defined, so it can't drift across the app.

/**
 * @typedef {{ code: 'obs' | 'inf' | 'unk', short: string, title: string, cls: string }} EpistemicMeta
 */

/**
 * Map an epistemic code to its display metadata. Unrecognized codes fall back
 * to the most cautious treatment (unk) — never silently present as fact.
 * @param {string} code
 * @returns {EpistemicMeta}
 */
export function epistemicMeta(code) {
	switch (code) {
		case 'obs':
			return {
				code: 'obs',
				short: 'obs',
				title: 'Observed — from liner notes or a primary source',
				cls: 'epi-obs'
			};
		case 'inf':
			return {
				code: 'inf',
				short: 'inf',
				title: 'Inferred — from session lists or cross-references',
				cls: 'epi-inf'
			};
		case 'unk':
		default:
			return {
				code: 'unk',
				short: 'unk?',
				title: 'Uncertain — not confirmed by a reliable source',
				cls: 'epi-unk'
			};
	}
}
