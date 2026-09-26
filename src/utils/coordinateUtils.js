export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeToGrid(point, gridSize = 20, offset = 30) {
  return {
    x: point.x * gridSize + offset,
    y: point.y * gridSize + offset,
  };
}

export function createPolygon(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}
