export function createCanvasPointMap({ width = 600, height = 420, gridSize = 20 }) {
  const cells = [];

  for (let y = 0; y < height; y += gridSize) {
    for (let x = 0; x < width; x += gridSize) {
      cells.push({ x, y });
    }
  }

  return { cells, width, height, gridSize };
}

export function getCanvasScale(width, height, padding = 30) {
  return {
    width: width - padding * 2,
    height: height - padding * 2,
    padding,
  };
}

export function drawAxes(ctx, width, height, padding = 30) {
  ctx.save();
  ctx.strokeStyle = '#27314a';
  ctx.lineWidth = 1;

  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  ctx.restore();
}

export function setCanvasSize(canvas, width, height) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}
