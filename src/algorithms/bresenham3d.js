export function generate3DBresenham(start, end) {
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
  const pushPoint = (error1 = 0, error2 = 0) => points.push({
    step: points.length + 1,
    voxel: { x, y, z },
    error1,
    error2,
  });

  if (dx >= dy && dx >= dz) {
    let errorY = 2 * dy - dx;
    let errorZ = 2 * dz - dx;
    while (x !== end.x) {
      pushPoint(errorY, errorZ);
      x += sx;
      if (errorY >= 0) { y += sy; errorY -= 2 * dx; }
      if (errorZ >= 0) { z += sz; errorZ -= 2 * dx; }
      errorY += 2 * dy;
      errorZ += 2 * dz;
    }
  } else if (dy >= dx && dy >= dz) {
    let errorX = 2 * dx - dy;
    let errorZ = 2 * dz - dy;
    while (y !== end.y) {
      pushPoint(errorX, errorZ);
      y += sy;
      if (errorX >= 0) { x += sx; errorX -= 2 * dy; }
      if (errorZ >= 0) { z += sz; errorZ -= 2 * dy; }
      errorX += 2 * dx;
      errorZ += 2 * dz;
    }
  } else {
    let errorX = 2 * dx - dz;
    let errorY = 2 * dy - dz;
    while (z !== end.z) {
      pushPoint(errorX, errorY);
      z += sz;
      if (errorX >= 0) { x += sx; errorX -= 2 * dz; }
      if (errorY >= 0) { y += sy; errorY -= 2 * dz; }
      errorX += 2 * dx;
      errorY += 2 * dy;
    }
  }
  pushPoint();

  return { points, dx, dy, dz, start, end, steps: points.length - 1 };
}
