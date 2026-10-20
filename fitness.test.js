import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, expect, it } from 'vitest';
const core = createRequire(import.meta.url)('./training-core.js');
let dom;
afterEach(() => dom?.window.close());
const exercise = { name: '坐姿划船', group: '背', equipment: '滑輪', setCount: 3, weight: 45, reps: 10 };
const history = [{ id: 'real', date: '2026-10-01T12:00:00', exercises: [{ ...exercise, sets: [{ weight: 50, reps: 8, done: true }, { weight: 55, reps: 6, done: true }] }] }];

it('reuses the replacement exercise history and keeps completed original sets', () => {
  const old = { name: '滑輪下拉', sets: [{ weight: 60, reps: 10, done: true }, { weight: 60, reps: 10, done: false }, { weight: 60, reps: 10, done: false }] };
  const result = core.replace([old], 0, exercise, history);
  expect(result.activeExercise).toBe(1);
  expect(result.workout[0].sets).toHaveLength(1);
  expect(result.workout[1].sets.map(set => [set.weight, set.reps, set.done])).toEqual([[55, 6, true], [55, 6, true]]);
  expect(core.volume(result.workout)).toBe(1260);
  expect(core.prescription(exercise, history).sets[0].weight).toBe(55);
});

it('aggregates actual sets in calendar weeks, months and years, excludes demo data and future periods', () => {
  const entries = [
    ...history,
    { ...history[0], id: 'earlier', date: '2026-09-30T12:00:00' },
    { ...history[0], id: 'old-year', date: '2025-10-01T12:00:00' },
    { ...history[0], id: 'sample-push', date: '2026-10-02T12:00:00' },
  ];
  expect(core.stats(entries, 'week', new Date(2026, 9, 2))).toMatchObject({ count: 2, volume: 1460, sets: 4, muscles: { 背: 4 } });
  expect(core.stats(entries, 'month', new Date(2026, 9, 2))).toMatchObject({ count: 1, volume: 730 });
  expect(core.stats(entries, 'year', new Date(2026, 9, 2))).toMatchObject({ count: 2, volume: 1460 });
  expect(core.stats(entries, 'month', new Date(2026, 10, 2)).volume).toBe(0);
  expect(core.shift('month', new Date(2026, 0, 31), 1).getMonth()).toBe(1);
  expect(core.stats([{ ...history[0], exercises: [{ ...exercise, sets: [{ weight: 40, reps: 8 }] }] }], 'year', new Date(2026, 9, 2)).volume).toBe(320);
  expect(core.validSet({ weight: null, reps: 8 })).toBe(false);
});

it('only merges a continuing set across an analysis boundary, not separate sets in the same clip', () => {
  const set = { exercise: '深蹲', startSec: 28, endSec: 30, reps: 2, weightKg: null, confidence: .9 };
  const merged = core.mergeObservations([{ startSec: 0, endSec: 30, sets: [set] }, { startSec: 30, endSec: 60, sets: [{ ...set, startSec: 30, endSec: 40, reps: 5 }] }]);
  expect(merged).toHaveLength(1); expect(merged[0].reps).toBe(7); expect(merged[0].weightKg).toBeNull();
  expect(core.mergeObservations([{ startSec: 0, endSec: 30, sets: [set, { ...set, startSec: 31, endSec: 40 }] }])).toHaveLength(2);
});

it('stores original videos independently of training statistics and survives a reload', async () => {
  dom = new JSDOM('', { url: 'https://fitness.test', runScripts: 'outside-only' });
  dom.window.indexedDB = new IDBFactory();
  dom.window.eval(readFileSync('./storage.js', 'utf8'));
  const api = dom.window.FitnessStore;
  await api.saveVideo({ id: 'clip-1', name: 'workout.mp4', blob: 'private-original', createdAt: '2026-10-02', observations: [] });
  await api.addHistory(history[0]);
  expect((await api.getVideo('clip-1')).blob).toBe('private-original');
  expect((await api.listVideos())[0]).not.toHaveProperty('blob');
  await api.removeVideo('clip-1');
  expect(await api.getVideo('clip-1')).toBeUndefined();
  expect(await api.listHistory()).toHaveLength(1);
});

it('starts without fabricated training history and lets a library action actually join the workout', async () => {
  dom = new JSDOM(readFileSync('./index.html', 'utf8'), { url: 'https://fitness.test', runScripts: 'outside-only' });
  const { window } = dom;
  for (const dialog of window.document.querySelectorAll('dialog')) {
    dialog.showModal = () => { dialog.open = true; }; dialog.close = () => { dialog.open = false; };
  }
  window.FitnessJournal = { init() {} };
  window.FitnessDemos = { attach(host) { host.append(window.document.createElement('canvas')); } };
  window.eval(readFileSync('./training-core.js', 'utf8'));
  window.eval(readFileSync('./app.js', 'utf8'));
  expect(window.FitnessV4.snapshot().history).toHaveLength(0);
  // Prescriptions are templates; they are not saved training history.
  expect(window.FitnessV4.snapshot().startedAt).toBeNull();
  expect(window.document.querySelectorAll('#today-exercises canvas')).toHaveLength(3);
  const originalCount = window.FitnessV4.snapshot().workout.length;
  window.document.querySelectorAll('.today-exercise')[1].click();
  expect(window.document.querySelector('#today-edit-title').textContent).toBe('羅馬尼亞硬舉');
  expect(window.document.querySelector('#today-exercise-editor').open).toBe(true);
  expect(window.FitnessV4.snapshot().history).toHaveLength(0);
  window.document.querySelector('#today-edit-save').click();
  expect(window.document.querySelector('#today-exercise-editor').open).toBe(false);
  window.document.querySelector('#browse-exercises').click();
  expect(window.document.querySelector('#exercise-dialog').open).toBe(true);
  window.document.querySelector('#exercise-dialog').close();
  window.document.querySelector('#add-workout-exercise').click();
  window.document.querySelector('[data-filter="手臂"]').click();
  window.document.querySelector('[data-equipment="啞鈴"]').click();
  const before = window.FitnessV4.snapshot().workout.length;
  window.document.querySelector('.exercise-result').click();
  expect(window.FitnessV4.snapshot().workout).toHaveLength(before + 1);
  expect(window.document.querySelector('#active-exercise-name').textContent).toBe('啞鈴彎舉');
  expect(window.document.querySelectorAll('.today-exercise')).toHaveLength(before + 1);
  expect(window.document.querySelector('#today-plan-detail').textContent).toContain(`${before + 1} 個動作`);
});
