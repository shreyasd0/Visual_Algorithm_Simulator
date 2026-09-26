export function generate3DDDA(start, end) {
  const coordinates = [start.x, start.y, start.z, end.x, end.y, end.z];
  if (!coordinates.every(Number.isFinite)) throw new RangeError('3D line coordinates must be finite numbers.');
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const steps = Math.ceil(Math.max(Math.abs(dx), Math.abs(dy), Math.abs(dz)));
  const increment = steps === 0
    ? { x: 0, y: 0, z: 0 }
    : { x: dx / steps, y: dy / steps, z: dz / steps };
  const points = [];
  for (let index = 0; index <= steps; index += 1) {
    const sampleIndex = index;
    const sample = {
      x: start.x + increment.x * sampleIndex,
      y: start.y + increment.y * sampleIndex,
      z: start.z + increment.z * sampleIndex,
    };
    points.push({
      step: index + 1,
      sample,
      voxel: { x: Math.round(sample.x), y: Math.round(sample.y), z: Math.round(sample.z) },
    });
  }

  const deltas = { x: Math.abs(dx), y: Math.abs(dy), z: Math.abs(dz) };
  const majorAxis = Object.keys(deltas).reduce((major, axis) => deltas[axis] > deltas[major] ? axis : major, 'x');
  return { dx, dy, dz, steps, majorAxis, increment, points, complexity: 'O(max(|dx|, |dy|, |dz|))' };
}
