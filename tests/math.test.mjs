import test from 'node:test';
import assert from 'node:assert/strict';
import { sineMetrics, threePoint, mergedRms } from '../docs/math.js';

function close(actual, expected, tolerance = 1e-10) {
  assert.equal(typeof actual, 'number');
  assert.ok(Number.isFinite(actual), `Expected a finite number, got ${actual}`);
  assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `Expected ${actual} to be close to ${expected}`);
}

test('sineMetrics uses full-cycle RMS and phase-sensitive real power', () => {
  const result = sineMetrics(100, 2, 60);
  close(result.vrms, 70.71067811865476);
  close(result.irms, 1.4142135623730951);
  close(result.p, 50);
  close(result.s, 100);
  close(result.pf, 0.5);
  close(result.cf, 1.4142135623730951);
});

test('sineMetrics preserves negative real power and power factor', () => {
  const result = sineMetrics(10, 20, 120);
  close(result.p, -50);
  close(result.s, 100);
  close(result.pf, -0.5);
});

test('sineMetrics accepts signed phases and whole-cycle offsets', () => {
  close(sineMetrics(10, 20, -60).p, 50);
  close(sineMetrics(10, 20, 420).p, 50);
  close(sineMetrics(10, 20, 180).pf, -1);
  close(sineMetrics(10, 20, 90).p, 0);
});

test('sineMetrics reduces very large finite angles before converting to radians', () => {
  const result = sineMetrics(10, 20, Number.MAX_VALUE);
  assert.ok(Number.isFinite(result.p));
  assert.ok(Number.isFinite(result.pf));
  assert.ok(result.pf >= -1 && result.pf <= 1);
});

test('sineMetrics makes ratios unavailable at zero without producing NaN', () => {
  const noCurrent = sineMetrics(100, 0, 30);
  close(noCurrent.irms, 0);
  close(noCurrent.p, 0);
  close(noCurrent.s, 0);
  assert.equal(noCurrent.pf, null);
  assert.equal(noCurrent.cf, null);
  const noVoltage = sineMetrics(0, 2, 0);
  assert.equal(noVoltage.pf, null);
  close(noVoltage.cf, 1.4142135623730951);
});

test('sineMetrics guards ratios when denominators are near zero', () => {
  assert.equal(sineMetrics(1e-6, 1e-6, 0).pf, null);
  assert.equal(sineMetrics(1, 1e-12, 0).cf, null);
  close(sineMetrics(1, 3e-12, 0).pf, 1);
  close(sineMetrics(1, 3e-12, 0).cf, 1.4142135623730951);
});

test('sineMetrics rejects negative amplitudes and all nonfinite or nonnumeric inputs', () => {
  for (const args of [
    [-1, 2, 0], [1, -2, 0], [NaN, 2, 0], [1, Infinity, 0],
    [1, 2, -Infinity], [1, 2, NaN], ['1', 2, 0], [1, null, 0], [1, 2, '60'],
  ]) assert.throws(() => sineMetrics(...args), RangeError);
});

const points = Object.freeze({ rNeg: -2, r0: 2, rPos: 8, yNeg: -6, y0: 10, yPos: 22 });

test('threePoint uses separate gains around a nonzero raw and reference center', () => {
  assert.deepEqual(threePoint(0, points), { value: 2, gain: 4, side: 'negative' });
  assert.deepEqual(threePoint(5, points), { value: 16, gain: 2, side: 'positive' });
});

test('threePoint reproduces all calibration anchors and assigns center to positive side', () => {
  assert.deepEqual(threePoint(-2, points), { value: -6, gain: 4, side: 'negative' });
  assert.deepEqual(threePoint(2, points), { value: 10, gain: 2, side: 'positive' });
  assert.deepEqual(threePoint(8, points), { value: 22, gain: 2, side: 'positive' });
});

test('threePoint is continuous at its center and extends each outer line', () => {
  close(threePoint(1.999999, points).value, 9.999996);
  close(threePoint(2.000001, points).value, 10.000002);
  assert.equal(threePoint(-3, points).value, -10);
  assert.equal(threePoint(9, points).value, 24);
});

test('threePoint allows decreasing references when raw anchors are ordered', () => {
  const inverted = { rNeg: -1, r0: 0, rPos: 1, yNeg: 4, y0: 2, yPos: 0 };
  assert.deepEqual(threePoint(-0.5, inverted), { value: 3, gain: -2, side: 'negative' });
});

test('threePoint rejects duplicate and reversed raw anchors', () => {
  for (const change of [{ rNeg: 2 }, { rNeg: 3 }, { rPos: 2 }, { rPos: 1 }]) {
    assert.throws(() => threePoint(0, { ...points, ...change }), RangeError);
  }
});

test('threePoint validates raw and every calibration value', () => {
  for (const raw of [NaN, Infinity, -Infinity, '0', null]) {
    assert.throws(() => threePoint(raw, points), RangeError);
  }
  for (const key of Object.keys(points)) {
    for (const invalid of [NaN, Infinity, undefined, '1']) {
      assert.throws(() => threePoint(0, { ...points, [key]: invalid }), RangeError);
    }
  }
  assert.throws(() => threePoint(0, null), RangeError);
  assert.throws(() => threePoint(0, {}), RangeError);
});

test('mergedRms weights squared RMS by sample count, not by window count', () => {
  close(mergedRms([{ rms: 3, n: 1 }, { rms: 5, n: 3 }]), 4.58257569495584);
});

test('mergedRms handles equal counts, a single window, and all-zero signals', () => {
  close(mergedRms([{ rms: 3, n: 2 }, { rms: 4, n: 2 }]), 3.5355339059327378);
  close(mergedRms([{ rms: 7, n: 123 }]), 7);
  close(mergedRms([{ rms: 0, n: 2 }, { rms: 0, n: 3 }]), 0);
});

test('mergedRms rejects empty or malformed window collections', () => {
  for (const windows of [[], null, {}, [null], [{}]]) {
    assert.throws(() => mergedRms(windows), RangeError);
  }
});

test('mergedRms rejects negative or nonfinite RMS and nonpositive or fractional counts', () => {
  for (const rms of [-1, NaN, Infinity, '2']) {
    assert.throws(() => mergedRms([{ rms, n: 1 }]), RangeError);
  }
  for (const n of [0, -1, 0.5, NaN, Infinity, '1', null]) {
    assert.throws(() => mergedRms([{ rms: 2, n }]), RangeError);
  }
});
