export function generateMidpointCircle3D(center, radius) {
  center = { x: Math.round(center.x), y: Math.round(center.y), z: Math.round(center.z) };
  radius = Math.max(0, Math.round(radius));
  const steps = [];
  let x = 0;
  let y = radius;
  let decision = 1 - radius;

  while (x <= y) {
    const candidates = [
      [center.x + x, center.y + y], [center.x - x, center.y + y],
      [center.x + x, center.y - y], [center.x - x, center.y - y],
      [center.x + y, center.y + x], [center.x - y, center.y + x],
      [center.x + y, center.y - x], [center.x - y, center.y - x],
    ];
    const unique = new Map(candidates.map(([px, py]) => [`${px},${py},${center.z}`, { x: px, y: py, z: center.z }]));
    steps.push({
      step: steps.length + 1,
      x,
      y,
      decision,
      voxels: [...unique.values()],
    });

    if (decision < 0) decision += 2 * x + 3;
    else {
      decision += 2 * (x - y) + 5;
      y -= 1;
    }
    x += 1;
  }

  return { center, radius, steps };
}
