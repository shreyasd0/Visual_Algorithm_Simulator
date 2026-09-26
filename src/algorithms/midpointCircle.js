export function generateMidpointCircle(cx, cy, radius) {
  if (![cx, cy, radius].every(Number.isFinite)) throw new RangeError('Circle center and radius must be finite numbers.');
  if (radius <= 0) throw new RangeError('Radius must be greater than 0.');
  if (radius > 1000) throw new RangeError('Radius must not exceed 1000 pixels.');
  cx = Math.round(cx);
  cy = Math.round(cy);
  radius = Math.round(radius);
  if (radius < 1) throw new RangeError('Radius must round to at least 1 pixel.');
  const points = [];
  let x = 0;
  let y = radius;
  let decision = 1 - radius;
  const plotted = new Set();

  while (x <= y) {
    const set = [
      { x: cx + x, y: cy + y },
      { x: cx - x, y: cy + y },
      { x: cx + x, y: cy - y },
      { x: cx - x, y: cy - y },
      { x: cx + y, y: cy + x },
      { x: cx - y, y: cy + x },
      { x: cx + y, y: cy - x },
      { x: cx - y, y: cy - x },
    ];

    const pixels = [...new Map(set.map((point) => [`${point.x},${point.y}`, point])).values()];
    const decisionBefore = decision;
    const nextX = x + 1;
    let nextY = y;
    let nextDecision = decision;
    if (decision < 0) nextDecision += 2 * x + 3;
    else {
      nextDecision += 2 * (x - y) + 5;
      nextY -= 1;
    }
    pixels.forEach((point) => plotted.add(`${point.x},${point.y}`));
    points.push({
      step: points.length + 1,
      x,
      y,
      decision: decisionBefore,
      nextDecision,
      nextX,
      nextY,
      points: pixels,
      totalPlottedPoints: plotted.size,
    });

    if (decision < 0) {
      decision += 2 * x + 3;
    } else {
      decision += 2 * (x - y) + 5;
      y -= 1;
    }

    x += 1;
  }

  return {
    points,
    radius,
    cx,
    cy,
  };
}
