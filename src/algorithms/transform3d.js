export const cubeVertices3D = [
  { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
  { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
  { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
  { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 },
];

export const cubeEdges3D = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

function multiply4(left, right) {
  return Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, column) => (
    left[row].reduce((sum, value, index) => sum + value * right[index][column], 0)
  )));
}

export function createTransformMatrix3D(options) {
  const { tx, ty, tz, rx, ry, rz, sx, sy, sz } = options;
  const values = [tx, ty, tz, rx, ry, rz, sx, sy, sz];
  if (!values.every(Number.isFinite)) throw new RangeError('3D transform parameters must be finite numbers.');
  const x = rx * Math.PI / 180;
  const y = ry * Math.PI / 180;
  const z = rz * Math.PI / 180;
  const scale = [[sx, 0, 0, 0], [0, sy, 0, 0], [0, 0, sz, 0], [0, 0, 0, 1]];
  const rotateX = [[1, 0, 0, 0], [0, Math.cos(x), -Math.sin(x), 0], [0, Math.sin(x), Math.cos(x), 0], [0, 0, 0, 1]];
  const rotateY = [[Math.cos(y), 0, Math.sin(y), 0], [0, 1, 0, 0], [-Math.sin(y), 0, Math.cos(y), 0], [0, 0, 0, 1]];
  const rotateZ = [[Math.cos(z), -Math.sin(z), 0, 0], [Math.sin(z), Math.cos(z), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]];
  const translate = [[1, 0, 0, tx], [0, 1, 0, ty], [0, 0, 1, tz], [0, 0, 0, 1]];
  return multiply4(translate, multiply4(rotateZ, multiply4(rotateY, multiply4(rotateX, scale))));
}

export function transformPoint3D(point, options) {
  const scaled = { x: point.x * options.sx, y: point.y * options.sy, z: point.z * options.sz };
  const rx = options.rx * Math.PI / 180;
  const ry = options.ry * Math.PI / 180;
  const rz = options.rz * Math.PI / 180;

  const afterX = {
    x: scaled.x,
    y: scaled.y * Math.cos(rx) - scaled.z * Math.sin(rx),
    z: scaled.y * Math.sin(rx) + scaled.z * Math.cos(rx),
  };
  const afterY = {
    x: afterX.x * Math.cos(ry) + afterX.z * Math.sin(ry),
    y: afterX.y,
    z: -afterX.x * Math.sin(ry) + afterX.z * Math.cos(ry),
  };
  const afterZ = {
    x: afterY.x * Math.cos(rz) - afterY.y * Math.sin(rz),
    y: afterY.x * Math.sin(rz) + afterY.y * Math.cos(rz),
    z: afterY.z,
  };
  return {
    x: Number((afterZ.x + options.tx).toFixed(3)),
    y: Number((afterZ.y + options.ty).toFixed(3)),
    z: Number((afterZ.z + options.tz).toFixed(3)),
  };
}

export function generateTransform3D(options) {
  const matrix = createTransformMatrix3D(options);
  const transformed = cubeVertices3D.map((original) => ({
    original,
    transformed: transformPoint3D(original, options),
  }));
  return { transformed, steps: transformed, matrix, order: 'T · Rz · Ry · Rx · S' };
}
