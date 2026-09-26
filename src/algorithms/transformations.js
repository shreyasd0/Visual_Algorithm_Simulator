const IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

function multiplyMatrices(left, right) {
  return left.map((row) => row.map((_, columnIndex) => (
    row.reduce((sum, value, index) => sum + value * right[index][columnIndex], 0)
  )));
}

function applyMatrix(matrix, point) {
  const [x, y, w] = [0, 1, 2].map((row) => (
    matrix[row][0] * point.x + matrix[row][1] * point.y + matrix[row][2]
  ));
  return { x: x / w, y: y / w };
}

function translation(tx, ty) {
  return [[1, 0, tx], [0, 1, ty], [0, 0, 1]];
}

export function applyTransformations(points, options = {}) {
  const values = {
    tx: 0, ty: 0, sx: 1, sy: 1, angleDeg: 0, pivotX: 0, pivotY: 0,
    reflectX: false, reflectY: false, shearX: 0, shearY: 0,
    ...options,
  };
  const numericKeys = ['tx', 'ty', 'sx', 'sy', 'angleDeg', 'pivotX', 'pivotY', 'shearX', 'shearY'];
  const invalidKey = numericKeys.find((key) => !Number.isFinite(Number(values[key])));
  if (invalidKey) throw new RangeError(`${invalidKey} must be a finite number.`);
  if (!Array.isArray(points) || points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    throw new TypeError('Every point must have finite x and y coordinates.');
  }

  const angle = Number(values.angleDeg) * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const operations = [
    { name: 'Translate to pivot origin', matrix: translation(-Number(values.pivotX), -Number(values.pivotY)) },
    { name: 'X shear', matrix: [[1, Number(values.shearX), 0], [0, 1, 0], [0, 0, 1]] },
    { name: 'Y shear', matrix: [[1, 0, 0], [Number(values.shearY), 1, 0], [0, 0, 1]] },
    { name: 'Reflection', matrix: [[values.reflectY ? -1 : 1, 0, 0], [0, values.reflectX ? -1 : 1, 0], [0, 0, 1]] },
    { name: 'Scale', matrix: [[Number(values.sx), 0, 0], [0, Number(values.sy), 0], [0, 0, 1]] },
    { name: 'Rotate', matrix: [[cos, -sin, 0], [sin, cos, 0], [0, 0, 1]] },
    { name: 'Translate from pivot', matrix: translation(Number(values.pivotX), Number(values.pivotY)) },
    { name: 'Translation', matrix: translation(Number(values.tx), Number(values.ty)) },
  ];

  let matrix = IDENTITY.map((row) => [...row]);
  operations.forEach((operation) => { matrix = multiplyMatrices(operation.matrix, matrix); });

  const transformed = points.map((point) => {
    let current = { x: point.x, y: point.y };
    const stages = [{ name: 'Original', x: current.x, y: current.y }];
    operations.forEach((operation) => {
      current = applyMatrix(operation.matrix, current);
      stages.push({ name: operation.name, x: current.x, y: current.y });
    });
    return {
      originalX: point.x,
      originalY: point.y,
      x: Number(current.x.toFixed(4)),
      y: Number(current.y.toFixed(4)),
      stages: stages.map((stage) => ({ ...stage, x: Number(stage.x.toFixed(4)), y: Number(stage.y.toFixed(4)) })),
    };
  });

  return {
    transformed,
    matrix,
    operations,
    order: 'T(tx,ty) · T(pivot) · R(θ) · S · Reflection · Shy · Shx · T(−pivot)',
    parameters: values,
    cos,
    sin,
  };
}

export { multiplyMatrices };