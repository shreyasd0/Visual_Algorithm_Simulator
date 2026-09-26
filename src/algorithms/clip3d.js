const LEFT = 1;
const RIGHT = 2;
const BOTTOM = 4;
const TOP = 8;
const NEAR = 16;
const FAR = 32;

function describe3DOutCode(code) {
  if (code === 0) return 'INSIDE';
  return [[TOP, 'TOP'], [BOTTOM, 'BOTTOM'], [RIGHT, 'RIGHT'], [LEFT, 'LEFT'], [FAR, 'FAR'], [NEAR, 'NEAR']]
    .filter(([bit]) => code & bit).map(([, name]) => name).join(' | ');
}

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
  const point = {
    x: Number((a.x + t * delta.x).toFixed(4)),
    y: Number((a.y + t * delta.y).toFixed(4)),
    z: Number((a.z + t * delta.z).toFixed(4)),
  };
  return { point, calculation: `${axis} = ${a[axis]} + ${t.toFixed(4)} × ${delta[axis]}` };
}

export function clipCohenSutherland3D(start, end, bounds) {
  if (![start.x, start.y, start.z, end.x, end.y, end.z, bounds.xmin, bounds.xmax, bounds.ymin, bounds.ymax, bounds.zmin, bounds.zmax].every(Number.isFinite)) {
    throw new RangeError('3D line and volume coordinates must be finite numbers.');
  }
  if (bounds.xmin >= bounds.xmax) throw new RangeError('Xmin must be smaller than Xmax.');
  if (bounds.ymin >= bounds.ymax) throw new RangeError('Ymin must be smaller than Ymax.');
  if (bounds.zmin >= bounds.zmax) throw new RangeError('Zmin must be smaller than Zmax.');
  let a = { ...start };
  let b = { ...end };
  let codeA = outCode(a, bounds);
  let codeB = outCode(b, bounds);
  const steps = [];

  for (let iteration = 0; iteration < 32; iteration += 1) {
    const shared = codeA & codeB;
    if (shared !== 0) {
      steps.push({ step: steps.length + 1, a: { ...a }, b: { ...b }, codeA, codeB, codeAName: describe3DOutCode(codeA), codeBName: describe3DOutCode(codeB), andCode: shared, status: 'rejected', decision: `CodeA & CodeB = ${shared} ≠ 0: trivially rejected` });
      return { visible: false, steps, clipped: null };
    }
    if (codeA === 0 && codeB === 0) {
      steps.push({ step: steps.length + 1, a: { ...a }, b: { ...b }, codeA, codeB, codeAName: 'INSIDE', codeBName: 'INSIDE', andCode: 0, status: 'accepted', decision: 'CodeA = 0 and CodeB = 0: accepted' });
      return { visible: true, steps, clipped: { a, b } };
    }

    const outsideCode = codeA !== 0 ? codeA : codeB;
    const bit = [LEFT, RIGHT, BOTTOM, TOP, NEAR, FAR].find((candidate) => outsideCode & candidate);
    const outsideEndpoint = codeA !== 0 ? 'A' : 'B';
    const outside = outsideEndpoint === 'A' ? a : b;
    const intersection = planeIntersection(outside, outsideEndpoint === 'A' ? b : a, bit, bounds);
    if (!intersection) {
      steps.push({ step: steps.length + 1, a: { ...a }, b: { ...b }, codeA, codeB, codeAName: describe3DOutCode(codeA), codeBName: describe3DOutCode(codeB), andCode: 0, status: 'rejected', plane: bit, decision: 'Parallel to selected plane: rejected' });
      return { visible: false, steps, clipped: null };
    }

    if (outsideEndpoint === 'A') {
      a = intersection.point;
      codeA = outCode(a, bounds);
    } else {
      b = intersection.point;
      codeB = outCode(b, bounds);
    }
    const updatedCode = outsideEndpoint === 'A' ? codeA : codeB;
    steps.push({
      step: steps.length + 1, a: { ...a }, b: { ...b }, codeA, codeB,
      codeAName: describe3DOutCode(codeA), codeBName: describe3DOutCode(codeB),
      andCode: codeA & codeB, status: 'clipped', plane: bit,
      selectedBoundary: bit === LEFT ? 'LEFT' : bit === RIGHT ? 'RIGHT' : bit === BOTTOM ? 'BOTTOM' : bit === TOP ? 'TOP' : bit === NEAR ? 'NEAR' : 'FAR',
      updatedEndpoint: outsideEndpoint, intersection: intersection.point,
      calculation: intersection.calculation, newOutcode: updatedCode, newOutcodeName: describe3DOutCode(updatedCode),
      decision: `CodeA & CodeB = 0: clip endpoint ${outsideEndpoint} at selected volume plane`,
    });
  }

  return { visible: false, steps, clipped: null };
}
