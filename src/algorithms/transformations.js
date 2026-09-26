export function applyTransformations(points, options = {}) {
  const {
    tx = 0,
    ty = 0,
    sx = 1,
    sy = 1,
    angleDeg = 0,
    pivotX = 0,
    pivotY = 0,
  } = options;

  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);

  const transformed = points.map((point) => {
    const xShifted = point.x - pivotX;
    const yShifted = point.y - pivotY;

    const rotatedX = xShifted * cos - yShifted * sin;
    const rotatedY = xShifted * sin + yShifted * cos;

    const scaledX = rotatedX * sx;
    const scaledY = rotatedY * sy;

    return {
      originalX: point.x,
      originalY: point.y,
      x: Number((scaledX + pivotX + tx).toFixed(2)),
      y: Number((scaledY + pivotY + ty).toFixed(2)),
    };
  });

  return {
    transformed,
    matrix: {
      tx,
      ty,
      sx,
      sy,
      angleDeg,
      pivotX,
      pivotY,
      cos,
      sin,
    },
  };
}
