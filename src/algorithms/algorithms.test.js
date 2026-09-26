import assert from 'node:assert/strict';
import test from 'node:test';
import { generateBresenham } from './bresenham.js';
import { generate3DBresenham } from './bresenham3d.js';
import { clipCohenSutherland } from './cohenSutherland.js';
import { clipCohenSutherland3D } from './clip3d.js';
import { generateDDA } from './dda.js';
import { generate3DDDA } from './dda3d.js';
import { generateMidpointCircle } from './midpointCircle.js';
import { applyTransformations } from './transformations.js';
import { generateTransform3D } from './transform3d.js';

test('DDA plots endpoints for horizontal, vertical, positive, negative, and reversed lines', () => {
  const cases = [
    [[0, 0], [5, 0]], [[0, 0], [0, 5]], [[0, 0], [5, 3]],
    [[0, 0], [5, -3]], [[5, 3], [0, 0]],
  ];

  for (const [start, end] of cases) {
    const { points } = generateDDA(...start, ...end);
    assert.deepEqual([points[0].plotX, points[0].plotY].map((value) => value || 0), start);
    assert.deepEqual([points.at(-1).plotX, points.at(-1).plotY].map((value) => value || 0), end);
  }
});

test('Bresenham plots endpoints across octants and reversed directions', () => {
  const cases = [
    [[0, 0], [5, 0]], [[0, 0], [0, 5]], [[0, 0], [5, 3]],
    [[0, 0], [5, -3]], [[0, 0], [3, 7]], [[5, 3], [0, 0]],
  ];

  for (const [start, end] of cases) {
    const { points } = generateBresenham(...start, ...end);
    assert.deepEqual([points[0].x, points[0].y], start);
    assert.deepEqual([points.at(-1).x, points.at(-1).y], end);
  }
});

test('midpoint circle produces pixels for representative radii and rejects zero', () => {
  for (const radius of [1, 5, 10]) {
    const result = generateMidpointCircle(0, 0, radius);
    assert.ok(result.points.length > 0);
    assert.ok(result.points.every((step) => step.points.length > 0));
  }
  assert.throws(() => generateMidpointCircle(0, 0, 0), /Radius must be greater than 0/);
});

test('2D homogeneous transforms apply every control and pivot rotation', () => {
  const point = [{ x: 2, y: 1 }];
  const result = (options) => applyTransformations(point, options).transformed[0];
  assert.deepEqual([result({ tx: 3, ty: -2 }).x, result({ tx: 3, ty: -2 }).y], [5, -1]);
  assert.deepEqual([result({ sx: 2, sy: 3 }).x, result({ sx: 2, sy: 3 }).y], [4, 3]);
  assert.deepEqual([result({ angleDeg: 90 }).x, result({ angleDeg: 90 }).y], [-1, 2]);
  assert.deepEqual([result({ reflectX: true }).x, result({ reflectX: true }).y], [2, -1]);
  assert.deepEqual([result({ reflectY: true }).x, result({ reflectY: true }).y], [-2, 1]);
  assert.deepEqual([result({ shearX: 2 }).x, result({ shearX: 2 }).y], [4, 1]);
  assert.deepEqual([result({ shearY: 2 }).x, result({ shearY: 2 }).y], [2, 5]);

  const pivoted = applyTransformations([{ x: 3, y: 1 }], {
    angleDeg: 90, pivotX: 2, pivotY: 1,
  }).transformed[0];
  assert.deepEqual([pivoted.x, pivoted.y], [2, 2]);
  assert.throws(() => applyTransformations(point, { angleDeg: Number.NaN }), /finite number/);
});

test('Cohen-Sutherland accepts, rejects, and clips each 2D boundary', () => {
  const clip = (line) => clipCohenSutherland(...line, 0, 0, 10, 10);
  assert.equal(clip([2, 2, 8, 8]).visible, true);
  assert.equal(clip([-5, 12, -1, 15]).visible, false);
  for (const line of [[-5, 5, 5, 5], [5, 5, 15, 5], [5, 15, 5, 5], [5, -5, 5, 5]]) {
    const result = clip(line);
    assert.equal(result.visible, true);
    assert.ok(result.steps.some((step) => step.selectedBoundary));
  }
  assert.throws(() => clipCohenSutherland(0, 0, 1, 1, 5, 0, 1, 2), /Xmin must be smaller/);
});

test('3D line rasterizers reach endpoints in different directions', () => {
  const start = { x: 0, y: 0, z: 0 };
  const end = { x: 4, y: -2, z: 3 };
  const dda = generate3DDDA(start, end);
  assert.equal(dda.steps, 4);
  assert.deepEqual(dda.points.at(-1).voxel, end);
  const bresenham = generate3DBresenham(start, end);
  assert.deepEqual(bresenham.points.at(-1).voxel, end);
  assert.equal(generate3DBresenham(end, start).points.at(-1).voxel.x, start.x);
});

test('3D transforms and volume clipping return valid results', () => {
  const transformed = generateTransform3D({
    tx: 1, ty: 2, tz: 3, rx: 0, ry: 0, rz: 0, sx: 1, sy: 1, sz: 1,
  });
  assert.deepEqual(transformed.transformed[0].transformed, { x: 0, y: 1, z: 2 });

  const bounds = { xmin: -2, xmax: 2, ymin: -2, ymax: 2, zmin: -2, zmax: 2 };
  const clipped = clipCohenSutherland3D({ x: -4, y: 0, z: 0 }, { x: 4, y: 0, z: 1 }, bounds);
  assert.equal(clipped.visible, true);
  assert.deepEqual(clipped.clipped.a, { x: -2, y: 0, z: 0.25 });
  assert.throws(() => clipCohenSutherland3D({ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, {
    ...bounds, zmin: 2,
  }), /Zmin must be smaller/);
});