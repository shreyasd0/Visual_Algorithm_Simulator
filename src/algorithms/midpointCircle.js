export function generateMidpointCircle(cx, cy, radius) {
  const points = [];
  let x = 0;
  let y = radius;
  let decision = 1 - radius;

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

    points.push({
      step: points.length + 1,
      x,
      y,
      decision,
      points: set,
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
