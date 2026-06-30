import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { preview, brokenPreviews, toggle, stop, _setAudioFactory } from './preview.js';

// Minimal fake of an HTMLAudioElement we can drive from tests.
class FakeAudio {
	/** @param {string} url */
	constructor(url) {
		this.url = url;
		this.src = url;
		this.paused = true;
		/** @type {Record<string, Array<() => void>>} */
		this.handlers = {};
		this.playResolves = true;
	}
	/** @param {string} type @param {() => void} fn */
	addEventListener(type, fn) {
		(this.handlers[type] ??= []).push(fn);
	}
	/** @param {string} type */
	emit(type) {
		(this.handlers[type] ?? []).forEach((fn) => fn());
	}
	play() {
		this.paused = false;
		return this.playResolves ? Promise.resolve() : Promise.reject(new Error('blocked'));
	}
	pause() {
		this.paused = true;
	}
}

/** @type {FakeAudio[]} */
let created = [];

beforeEach(() => {
	created = [];
	_setAudioFactory((url) => {
		const a = new FakeAudio(url);
		created.push(a);
		return a;
	});
	stop();
	brokenPreviews.set(new Set());
});

describe('preview controller', () => {
	it('goes loading -> playing for the active track', () => {
		toggle('t1', 'http://x/1.m4a');
		expect(get(preview)).toEqual({ trackId: 't1', status: 'loading' });
		created[0].emit('playing');
		expect(get(preview)).toEqual({ trackId: 't1', status: 'playing' });
	});

	it('toggling the same track stops it', () => {
		toggle('t1', 'http://x/1.m4a');
		created[0].emit('playing');
		toggle('t1', 'http://x/1.m4a');
		expect(get(preview)).toEqual({ trackId: null, status: 'idle' });
		expect(created[0].paused).toBe(true);
	});

	it('only one preview plays at a time', () => {
		toggle('t1', 'http://x/1.m4a');
		created[0].emit('playing');
		toggle('t2', 'http://x/2.m4a');
		expect(created[0].paused).toBe(true); // first one stopped
		created[1].emit('playing');
		expect(get(preview)).toEqual({ trackId: 't2', status: 'playing' });
	});

	it('resets to idle when a clip ends', () => {
		toggle('t1', 'http://x/1.m4a');
		created[0].emit('playing');
		created[0].emit('ended');
		expect(get(preview)).toEqual({ trackId: null, status: 'idle' });
	});

	it('marks a track broken on an error event', () => {
		toggle('t1', 'http://x/1.m4a');
		created[0].emit('error');
		expect(get(preview).status).toBe('idle');
		expect(get(brokenPreviews).has('t1')).toBe(true);
	});

	it('marks a track broken when play() rejects', async () => {
		_setAudioFactory((url) => {
			const a = new FakeAudio(url);
			a.playResolves = false;
			created.push(a);
			return a;
		});
		toggle('t1', 'http://x/1.m4a');
		await Promise.resolve(); // let the rejected play() promise settle
		await Promise.resolve();
		expect(get(brokenPreviews).has('t1')).toBe(true);
		expect(get(preview).status).toBe('idle');
	});

	it('does nothing when there is no url', () => {
		toggle('t1', null);
		expect(get(preview)).toEqual({ trackId: null, status: 'idle' });
		expect(created.length).toBe(0);
	});
});
