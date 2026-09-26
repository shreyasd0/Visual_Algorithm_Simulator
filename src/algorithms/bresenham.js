export function generateBresenham(x1, y1, x2, y2) {
  [x1, y1, x2, y2].forEach((value) => {
    if (!Number.isFinite(value)) throw new RangeError('Line coordinates must be finite numbers.');
  });
  x1 = Math.round(x1);
  y1 = Math.round(y1);
  x2 = Math.round(x2);
  y2 = Math.round(y2);

  const points = [];
  let x = x1;
  let y = y1;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let error = dx - dy;

  while (true) {
    let nextX = x;
    let nextY = y;
    let nextError = error;
    const doubledError = 2 * error;
    if (doubledError > -dy) { nextError -= dy; nextX += sx; }
    if (doubledError < dx) { nextError += dx; nextY += sy; }
    points.push({
      step: points.length + 1,
      x,
      y,
      error,
      nextError,
      nextX,
      nextY,
      dx,
      dy,
    });
    if (x === x2 && y === y2) break;
    x = nextX;
    y = nextY;
    error = nextError;
  }

  return { points, dx, dy, totalSteps: points.length, start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, complexity: 'O(max(|dx|, |dy|))' };
}