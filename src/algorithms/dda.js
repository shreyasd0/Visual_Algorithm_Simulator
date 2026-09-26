export function generateDDA(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const stepsCount = Math.max(Math.abs(dx), Math.abs(dy));

  const xIncrement = stepsCount === 0 ? 0 : dx / stepsCount;
  const yIncrement = stepsCount === 0 ? 0 : dy / stepsCount;

  let x = x1;
  let y = y1;
  const points = [];

  for (let i = 0; i <= stepsCount; i += 1) {
    points.push({
      step: i + 1,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      plotX: Math.round(x),
      plotY: Math.round(y),
      dx,
      dy,
      xIncrement,
      yIncrement,
    });

    x += xIncrement;
    y += yIncrement;
  }

  return {
    points,
    dx,
    dy,
    stepsCount,
    xIncrement,
    yIncrement,
  };
}
