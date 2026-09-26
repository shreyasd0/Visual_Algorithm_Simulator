const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;
const NEAR = 16;
const FAR = 32;

function outCode(point, bounds) {
  let code = 0;
  if (point.x < bounds.xmin) code |= LEFT;
  else if (point.x > bounds.xmax) code |= RIGHT;
  if (point.y < bounds.ymin) code |= BOTTOM;
  else if (point.y > bounds.ymax) code |= TOP;
  if (point.z < bounds.zmin) code |= NEAR;
  else if (point.z > bounds.zmax) code |= FAR;
  return code;
}

function planeIntersection(a, b, bit, bounds) {
  const delta = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  let axis;
  let boundary;
  if (bit === LEFT) { axis = 'x'; boundary = bounds.xmin; }
  else if (bit === RIGHT) { axis = 'x'; boundary = bounds.xmax; }
  else if (bit === BOTTOM) { axis = 'y'; boundary = bounds.ymin; }
  else if (bit === TOP) { axis = 'y'; boundary = bounds.ymax; }
  else if (bit === NEAR) { axis = 'z'; boundary = bounds.zmin; }
  else { axis = 'z'; boundary = bounds.zmax; }

  if (delta[axis] === 0) return null;
  const t = (boundary - a[axis]) / delta[axis];
  return {
    x: Number((a.x + t * delta.x).toFixed(4)),
    y: Number((a.y + t * delta.y).toFixed(4)),
    z: Number((a.z + t * delta.z).toFixed(4)),
  };
}

export function clipCohenSutherland3D(start, end, bounds) {
  let a = { ...start };
  let b = { ...end };
  let codeA = outCode(a, bounds);
  let codeB = outCode(b, bounds);
  const steps = [];

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const shared = codeA & codeB;
    if (shared !== 0) {
      steps.push({ step: steps.length + 1, a, b, codeA, codeB, status: 'rejected' });
      return { visible: false, steps, clipped: null };
    }
    if (codeA === 0 && codeB === 0) {
      steps.push({ step: steps.length + 1, a, b, codeA, codeB, status: 'accepted' });
      return { visible: true, steps, clipped: { a, b } };
    }

    const outsideCode = codeA !== 0 ? codeA : codeB;
    const bit = [LEFT, RIGHT, BOTTOM, TOP, NEAR, FAR].find((candidate) => outsideCode & candidate);
    const intersection = planeIntersection(a, b, bit, bounds);
    if (!intersection) {
      steps.push({ step: steps.length + 1, a, b, codeA, codeB, status: 'rejected' });
      return { visible: false, steps, clipped: null };
    }

    if (outsideCode === codeA) {
      a = intersection;
      codeA = outCode(a, bounds);
    } else {
      b = intersection;
      codeB = outCode(b, bounds);
    }
    steps.push({ step: steps.length + 1, a, b, codeA, codeB, status: 'clipped', plane: bit });
  }

  return { visible: false, steps, clipped: null };
}
