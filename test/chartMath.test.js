import test from 'node:test';
import assert from 'node:assert/strict';
import { donutSegments, gaugeAngle } from '../src/components/charts/chartMath.js';

test('donutSegments produces degrees summing to 360', () => {
  const segments = donutSegments([
    { allocation: 38, color: '#54d6b5' },
    { allocation: 34, color: '#7aa7ff' },
    { allocation: 28, color: '#f5b65b' },
  ]);
  assert.equal(segments.length, 3);
  const total = segments.reduce((sum, s) => sum + (s.endAngle - s.startAngle), 0);
  assert.ok(Math.abs(total - 360) < 0.01);
  assert.equal(segments[0].startAngle, 0);
  assert.equal(segments[0].color, '#54d6b5');
});

test('gaugeAngle maps 0-100 score to -90..90 degrees', () => {
  assert.equal(gaugeAngle(0), -90);
  assert.equal(gaugeAngle(50), 0);
  assert.equal(gaugeAngle(100), 90);
  assert.equal(gaugeAngle(null), null);
});
