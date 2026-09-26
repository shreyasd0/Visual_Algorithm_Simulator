export function generate3DBresenham(start, end) {
  if (![start.x, start.y, start.z, end.x, end.y, end.z].every(Number.isFinite)) throw new RangeError('3D line coordinates must be finite numbers.');
  start = { x: Math.round(start.x), y: Math.round(start.y), z: Math.round(start.z) };
  end = { x: Math.round(end.x), y: Math.round(end.y), z: Math.round(end.z) };
  let x = start.x;
  let y = start.y;
  let z = start.z;
  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const dz = Math.abs(end.z - start.z);
  const sx = start.x < end.x ? 1 : start.x > end.x ? -1 : 0;
  const sy = start.y < end.y ? 1 : start.y > end.y ? -1 : 0;
  const sz = start.z < end.z ? 1 : start.z > end.z ? -1 : 0;
  const points = [];
  const majorAxis = dx >= dy && dx >= dz ? 'X' : dy >= dx && dy >= dz ? 'Y' : 'Z';
  const pushPoint = (error1, error2, nextVoxel = { x, y, z }, nextError1 = error1, nextError2 = error2) => points.push({
    step: points.length + 1, voxel: { x, y, z }, nextVoxel, error1, error2, nextError1, nextError2, majorAxis,
  });

  if (dx >= dy && dx >= dz) {
    let errorY = 2 * dy - dx;
    let errorZ = 2 * dz - dx;
    while (x !== end.x) {
      const currentX = x; const currentY = y; const currentZ = z;
      const currentErrorY = errorY; const currentErrorZ = errorZ;
      x += sx;
      if (errorY >= 0) { y += sy; errorY -= 2 * dx; }
      if (errorZ >= 0) { z += sz; errorZ -= 2 * dx; }
      errorY += 2 * dy;
      errorZ += 2 * dz;
      pushPoint(currentErrorY, currentErrorZ, { x, y, z }, errorY, errorZ);
      points[points.length - 1].voxel = { x: currentX, y: currentY, z: currentZ };
    }
  } else if (dy >= dx && dy >= dz) {
    let errorX = 2 * dx - dy;
    let errorZ = 2 * dz - dy;
    while (y !== end.y) {
      const currentX = x; const currentY = y; const currentZ = z;
      const currentErrorX = errorX; const currentErrorZ = errorZ;
      y += sy;
      if (errorX >= 0) { x += sx; errorX -= 2 * dy; }
      if (errorZ >= 0) { z += sz; errorZ -= 2 * dy; }
      errorX += 2 * dx;
      errorZ += 2 * dz;
      pushPoint(currentErrorX, currentErrorZ, { x, y, z }, errorX, errorZ);
      points[points.length - 1].voxel = { x: currentX, y: currentY, z: currentZ };
    }
  } else {
    let errorX = 2 * dx - dz;
    let errorY = 2 * dy - dz;
    while (z !== end.z) {
      const currentX = x; const currentY = y; const currentZ = z;
      const currentErrorX = errorX; const currentErrorY = errorY;
      z += sz;
      if (errorX >= 0) { x += sx; errorX -= 2 * dz; }
      if (errorY >= 0) { y += sy; errorY -= 2 * dz; }
      errorX += 2 * dx;
      errorY += 2 * dy;
      pushPoint(currentErrorX, currentErrorY, { x, y, z }, errorX, errorY);
      points[points.length - 1].voxel = { x: currentX, y: currentY, z: currentZ };
    }
  }
  pushPoint(0, 0);

  return { points, dx, dy, dz, start, end, majorAxis, steps: points.length - 1, complexity: 'O(max(dx, dy, dz))' };
}
