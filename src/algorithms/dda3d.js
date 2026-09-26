export function generate3DDDA(start, end) {
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

  return { dx, dy, dz, steps, increment, points };
}
