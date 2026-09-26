export function generateBresenham(x1, y1, x2, y2) {
  const points = [];

  let x = x1;
  let y = y1;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let error = dx - dy;

  let step = 1;

  while (true) {
    points.push({
      step,
      x,
      y,
      error,
      dx,
      dy,
    });

    if (x === x2 && y === y2) {
      break;
    }

    const e2 = 2 * error;

    if (e2 > -dy) {
      error -= dy;
      x += sx;
    }

    if (e2 < dx) {
      error += dx;
      y += sy;
    }

    step += 1;
  }

  return {
    points,
    dx,
    dy,
    totalSteps: step,
  };
}
