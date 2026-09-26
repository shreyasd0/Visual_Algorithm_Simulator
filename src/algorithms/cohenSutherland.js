export const OUTCODE = { LEFT: 1, RIGHT: 2, BOTTOM: 4, TOP: 8 };

export function computeOutCode(x, y, xmin, ymin, xmax, ymax) {
  let code = 0;
  if (x < xmin) code |= OUTCODE.LEFT;
  else if (x > xmax) code |= OUTCODE.RIGHT;
  if (y < ymin) code |= OUTCODE.BOTTOM;
  else if (y > ymax) code |= OUTCODE.TOP;
  return code;
}

export function describeOutCode(code) {
  if (code === 0) return 'INSIDE';
  return [
    [OUTCODE.TOP, 'TOP'], [OUTCODE.BOTTOM, 'BOTTOM'],
    [OUTCODE.RIGHT, 'RIGHT'], [OUTCODE.LEFT, 'LEFT'],
  ].filter(([bit]) => code & bit).map(([, name]) => name).join(' | ');
}

function intersect(a, b, edge, bounds) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (edge === 'LEFT' || edge === 'RIGHT') {
    const x = edge === 'LEFT' ? bounds.xmin : bounds.xmax;
    if (dx === 0) return null;
    const t = (x - a.x) / dx;
    return { point: { x, y: a.y + t * dy }, calculation: `y = ${a.y} + (${dy} × (${x} − ${a.x})) / ${dx}` };
  }
  const y = edge === 'BOTTOM' ? bounds.ymin : bounds.ymax;
  if (dy === 0) return null;
  const t = (y - a.y) / dy;
  return { point: { x: a.x + t * dx, y }, calculation: `x = ${a.x} + (${dx} × (${y} − ${a.y})) / ${dy}` };
}

export function clipCohenSutherland(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  const values = [x1, y1, x2, y2, xmin, ymin, xmax, ymax];
  if (!values.every(Number.isFinite)) throw new RangeError('Line and clipping-window coordinates must be finite numbers.');
  if (xmin >= xmax) throw new RangeError('Xmin must be smaller than Xmax.');
  if (ymin >= ymax) throw new RangeError('Ymin must be smaller than Ymax.');

  let a = { x: x1, y: y1 };
  let b = { x: x2, y: y2 };
  const steps = [];
  const maximumIterations = 16;

  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    const codeA = computeOutCode(a.x, a.y, xmin, ymin, xmax, ymax);
    const codeB = computeOutCode(b.x, b.y, xmin, ymin, xmax, ymax);
    const andCode = codeA & codeB;
    const common = { codeA, codeB, codeAName: describeOutCode(codeA), codeBName: describeOutCode(codeB), andCode };

    if (andCode !== 0) {
      steps.push({ step: steps.length + 1, a: { ...a }, b: { ...b }, ...common, status: 'rejected', decision: `CodeA & CodeB = ${andCode} ≠ 0: trivially rejected` });
      return { visible: false, clipped: null, steps, reason: 'Trivial reject: both endpoints share an outside region.' };
    }
    if (codeA === 0 && codeB === 0) {
      steps.push({ step: steps.length + 1, a: { ...a }, b: { ...b }, ...common, status: 'accepted', decision: 'CodeA = 0 and CodeB = 0: accepted' });
      return { visible: true, clipped: { x1: a.x, y1: a.y, x2: b.x, y2: b.y }, steps, reason: 'Accepted: both endpoints are inside the clipping window.' };
    }

    const outsideCode = codeA !== 0 ? codeA : codeB;
    const edge = [[OUTCODE.TOP, 'TOP'], [OUTCODE.BOTTOM, 'BOTTOM'], [OUTCODE.RIGHT, 'RIGHT'], [OUTCODE.LEFT, 'LEFT']].find(([bit]) => outsideCode & bit)?.[1];
    const outsideEndpoint = codeA !== 0 ? 'A' : 'B';
    const start = outsideEndpoint === 'A' ? a : b;
    const intersection = intersect(start, outsideEndpoint === 'A' ? b : a, edge, { xmin, ymin, xmax, ymax });
    if (!intersection) {
      steps.push({ step: steps.length + 1, a: { ...a }, b: { ...b }, ...common, status: 'rejected', edge, decision: `Cannot intersect ${edge} boundary for this parallel segment` });
      return { visible: false, clipped: null, steps, reason: 'Rejected: parallel segment cannot intersect selected boundary.' };
    }

    const oldPoint = { ...start };
    if (outsideEndpoint === 'A') a = intersection.point;
    else b = intersection.point;
    const updatedPoint = outsideEndpoint === 'A' ? a : b;
    const updatedCode = computeOutCode(updatedPoint.x, updatedPoint.y, xmin, ymin, xmax, ymax);
    steps.push({
      step: steps.length + 1,
      a: { ...a }, b: { ...b }, ...common,
      status: 'clipping-required',
      decision: 'CodeA & CodeB = 0, but an endpoint is outside: clip this endpoint',
      edge,
      selectedBoundary: edge,
      updatedEndpoint: outsideEndpoint,
      oldPoint,
      intersection: intersection.point,
      calculation: intersection.calculation,
      newOutcode: updatedCode,
      newOutcodeName: describeOutCode(updatedCode),
    });
  }

  return { visible: false, clipped: null, steps, reason: 'Stopped after the clipping iteration safety limit.' };
}