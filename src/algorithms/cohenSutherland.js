function computeOutCode(x, y, xmin, ymin, xmax, ymax) {
  let code = 0;

  if (x < xmin) code |= 1;
  else if (x > xmax) code |= 2;

  if (y < ymin) code |= 4;
  else if (y > ymax) code |= 8;

  return code;
}

function intersection(x1, y1, x2, y2, edge, xmin, ymin, xmax, ymax) {
  const dx = x2 - x1;
  const dy = y2 - y1;

  if (edge === 'left') {
    return { x: xmin, y: y1 + ((y2 - y1) * (xmin - x1)) / dx };
  }
  if (edge === 'right') {
    return { x: xmax, y: y1 + ((y2 - y1) * (xmax - x1)) / dx };
  }
  if (edge === 'bottom') {
    return { x: x1 + ((x2 - x1) * (ymin - y1)) / dy, y: ymin };
  }
  return { x: x1 + ((x2 - x1) * (ymax - y1)) / dy, y: ymax };
}

export function clipCohenSutherland(x1, y1, x2, y2, xmin, ymin, xmax, ymax) {
  let xA = x1;
  let yA = y1;
  let xB = x2;
  let yB = y2;

  const steps = [];
  let codeA = computeOutCode(xA, yA, xmin, ymin, xmax, ymax);
  let codeB = computeOutCode(xB, yB, xmin, ymin, xmax, ymax);

  while (true) {
    steps.push({
      step: steps.length + 1,
      codeA,
      codeB,
      xA,
      yA,
      xB,
      yB,
      status: codeA === 0 && codeB === 0 ? 'inside' : 'checking',
    });

    if ((codeA & codeB) !== 0) {
      return {
        visible: false,
        clipped: null,
        steps,
        reason: 'Trivial reject: both endpoints are outside the same region',
      };
    }

    if (codeA === 0 && codeB === 0) {
      return {
        visible: true,
        clipped: { x1: xA, y1: yA, x2: xB, y2: yB },
        steps,
        reason: 'Accepted: entire segment is within the clipping window',
      };
    }

    const codeOut = codeA !== 0 ? codeA : codeB;

    let edge = 'left';
    if (codeOut & 8) edge = 'top';
    else if (codeOut & 4) edge = 'bottom';
    else if (codeOut & 2) edge = 'right';
    else if (codeOut & 1) edge = 'left';

    const intersectionPoint = intersection(xA, yA, xB, yB, edge, xmin, ymin, xmax, ymax);

    if (codeA !== 0) {
      xA = intersectionPoint.x;
      yA = intersectionPoint.y;
      codeA = computeOutCode(xA, yA, xmin, ymin, xmax, ymax);
    } else {
      xB = intersectionPoint.x;
      yB = intersectionPoint.y;
      codeB = computeOutCode(xB, yB, xmin, ymin, xmax, ymax);
    }

    steps.push({
      step: steps.length + 1,
      codeA,
      codeB,
      xA,
      yA,
      xB,
      yB,
      status: 'intersection',
      edge,
      intersection: intersectionPoint,
    });
  }
}
