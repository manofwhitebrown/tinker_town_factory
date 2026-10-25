import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber, formatDuration } from '../src/core/format.js';

test('small numbers', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(7), '7');
  assert.equal(formatNumber(18), '18');
  assert.equal(formatNumber(999), '999');
  assert.equal(formatNumber(1.5), '1.5');
  assert.equal(formatNumber(0.04), '0');
});

test('suffixes', () => {
  assert.equal(formatNumber(1000), '1K');
  assert.equal(formatNumber(1234), '1.23K');
  assert.equal(formatNumber(12345), '12.3K');
  assert.equal(formatNumber(123456), '123K');
  assert.equal(formatNumber(1.5e6), '1.5M');
  assert.equal(formatNumber(5.6e12), '5.6T');
  assert.equal(formatNumber(1e33), '1Dc');
});

test('rounding never shows 1000 of a unit', () => {
  assert.equal(formatNumber(999999), '1M');
  assert.equal(formatNumber(999.96), '1K');
  assert.equal(formatNumber(999400), '999K');
});

test('scientific beyond the suffix table', () => {
  assert.equal(formatNumber(1e36), '1e36');
  assert.equal(formatNumber(2.5e100), '2.5e100');
});

test('negative, infinite and bad input', () => {
  assert.equal(formatNumber(-1500), '-1.5K');
  assert.equal(formatNumber(Infinity), '∞');
  assert.equal(formatNumber(NaN), '0');
  assert.equal(formatNumber(undefined), '0');
});

test('formatDuration', () => {
  assert.equal(formatDuration(0.6), '0.6s');
  assert.equal(formatDuration(2), '2s');
  assert.equal(formatDuration(45), '45s');
  assert.equal(formatDuration(75), '1m 15s');
  assert.equal(formatDuration(3700), '1h 1m');
  assert.equal(formatDuration(-5), '0s');
});
