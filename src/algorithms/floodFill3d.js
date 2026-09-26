export function generateFloodFill3D(size = 3, seed = { x: 0, y: 0, z: 0 }) {
  seed = { x: Math.round(seed.x), y: Math.round(seed.y), z: Math.round(seed.z) };
  const low = -Math.floor(size / 2);
  const high = low + size - 1;
  const volume = [];
  for (let x = low; x <= high; x += 1) {
    for (let y = low; y <= high; y += 1) {
      for (let z = low; z <= high; z += 1) volume.push({ x, y, z });
    }
  }

  const inBounds = (point) => point.x >= low && point.x <= high
    && point.y >= low && point.y <= high
    && point.z >= low && point.z <= high;
  if (!inBounds(seed)) return { volume, steps: [], size, seed, reason: 'Seed is outside the voxel volume.' };

  const keyOf = (point) => `${point.x},${point.y},${point.z}`;
  const visited = new Set([keyOf(seed)]);
  const queue = [{ ...seed }];
  const steps = [];
  const offsets = [
    { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
    { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 },
  ];

  for (let head = 0; head < queue.length; head += 1) {
    const voxel = queue[head];
    steps.push({ step: steps.length + 1, voxel });
    offsets.forEach((offset) => {
      const next = { x: voxel.x + offset.x, y: voxel.y + offset.y, z: voxel.z + offset.z };
      const key = keyOf(next);
      if (inBounds(next) && !visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    });
  }

  return { volume, steps, size, seed, visitedCount: visited.size };
}
