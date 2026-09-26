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
  const transformed = cubeVertices3D.map((original) => ({
    original,
    transformed: transformPoint3D(original, options),
  }));
  return { transformed, steps: transformed };
}
