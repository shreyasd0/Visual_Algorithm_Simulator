import { useEffect, useRef } from 'react';

const VS = `
attribute vec3 a_position; attribute vec3 a_normal;
uniform mat4 u_viewProjection; uniform mat4 u_model; uniform mat3 u_normalMatrix; uniform vec3 u_color;
varying vec3 v_color; varying float v_light;
void main(){ vec3 n=normalize(u_normalMatrix*a_normal); vec3 l=normalize(vec3(-0.45,0.82,0.58));
v_light=0.25+max(dot(n,l),0.0)*0.85; v_color=u_color; gl_Position=u_viewProjection*u_model*vec4(a_position,1.0); }
`;
const FS = `precision mediump float; varying vec3 v_color; varying float v_light; void main(){gl_FragColor=vec4(v_color*v_light,1.0);}`;

function shader(gl, type, source) {
  const result = gl.createShader(type);
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(result));
  return result;
}

function cubeData() {
  const faces = [
    [[0, 0, 1], [[-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]],
    [[0, 0, -1], [[1, -1, -1], [-1, -1, -1], [-1, 1, -1], [1, 1, -1]]],
    [[1, 0, 0], [[1, -1, 1], [1, -1, -1], [1, 1, -1], [1, 1, 1]]],
    [[-1, 0, 0], [[-1, -1, -1], [-1, -1, 1], [-1, 1, 1], [-1, 1, -1]]],
    [[0, 1, 0], [[-1, 1, 1], [1, 1, 1], [1, 1, -1], [-1, 1, -1]]],
    [[0, -1, 0], [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1]]],
  ];
  const data = [];
  faces.forEach(([normal, corners]) => [0, 1, 2, 0, 2, 3].forEach((index) => data.push(...corners[index], ...normal)));
  return new Float32Array(data);
}

function sphereData(latitudes = 12, longitudes = 16) {
  const data = [];
  const point = (v, u) => {
    const theta = v * Math.PI;
    const phi = u * Math.PI * 2;
    const x = -Math.cos(phi) * Math.sin(theta);
    const y = Math.cos(theta);
    const z = Math.sin(phi) * Math.sin(theta);
    return [x, y, z, x, y, z];
  };
  for (let lat = 0; lat < latitudes; lat += 1) {
    for (let lon = 0; lon < longitudes; lon += 1) {
      const a = point(lat / latitudes, lon / longitudes);
      const b = point((lat + 1) / latitudes, lon / longitudes);
      const c = point((lat + 1) / latitudes, (lon + 1) / longitudes);
      const d = point(lat / latitudes, (lon + 1) / longitudes);
      data.push(...a, ...b, ...d, ...b, ...c, ...d);
    }
  }
  return new Float32Array(data);
}

function lineData(a, b) {
  return new Float32Array([a.x, a.y, a.z, 0, 1, 0, b.x, b.y, b.z, 0, 1, 0]);
}

function segmentsData(segments = []) {
  return new Float32Array(segments.flatMap(([a, b]) => [a.x, a.y, a.z, 0, 1, 0, b.x, b.y, b.z, 0, 1, 0]));
}

function boxData(bounds) {
  if (!bounds) return new Float32Array();
  const c = [
    { x: bounds.xmin, y: bounds.ymin, z: bounds.zmin }, { x: bounds.xmax, y: bounds.ymin, z: bounds.zmin },
    { x: bounds.xmax, y: bounds.ymax, z: bounds.zmin }, { x: bounds.xmin, y: bounds.ymax, z: bounds.zmin },
    { x: bounds.xmin, y: bounds.ymin, z: bounds.zmax }, { x: bounds.xmax, y: bounds.ymin, z: bounds.zmax },
    { x: bounds.xmax, y: bounds.ymax, z: bounds.zmax }, { x: bounds.xmin, y: bounds.ymax, z: bounds.zmax },
  ];
  return segmentsData([[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].map(([a, b]) => [c[a], c[b]]));
}

function gridData(range, y) {
  const data = [];
  for (let i = -range; i <= range; i += 1) {
    data.push(i, y, -range, 0, 1, 0, i, y, range, 0, 1, 0);
    data.push(-range, y, i, 0, 1, 0, range, y, i, 0, 1, 0);
  }
  return new Float32Array(data);
}

function identity() { return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]); }
function translatedScaled(point, scale) { return new Float32Array([scale, 0, 0, 0, 0, scale, 0, 0, 0, 0, scale, 0, point.x, point.y, point.z, 1]); }
function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c += 1) for (let r = 0; r < 4; r += 1) for (let k = 0; k < 4; k += 1) out[c * 4 + r] += a[k * 4 + r] * b[c * 4 + k];
  return out;
}
function normalize(v) { const n = Math.hypot(...v) || 1; return v.map((x) => x / n); }
function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
function dot(a, b) { return a.reduce((sum, x, i) => sum + x * b[i], 0); }
function lookAt(eye, target) {
  const z = normalize(eye.map((v, i) => v - target[i]));
  const x = normalize(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}
function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const range = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (near + far) * range, -1, 0, 0, near * far * 2 * range, 0]);
}

export default function AlgorithmScene3D({
  mode,
  start,
  end,
  voxelPoints = [],
  currentIndex = 0,
  transformOriginalSegments = [],
  transformSegments = [],
  transformedVertices = [],
  clipBounds,
  clipLine,
  clipOriginalLine,
  selectedPoint,
  onSelectPoint,
}) {
  const canvasRef = useRef(null);
  const cameraRef = useRef({ yaw: 0.72, pitch: 0.42, distance: 13, dragging: false, lastX: 0, lastY: 0 });
  const onSelectPointRef = useRef(onSelectPoint);

  useEffect(() => {
    onSelectPointRef.current = onSelectPoint;
  }, [onSelectPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return undefined;

    let program;
    try {
      const vs = shader(gl, gl.VERTEX_SHADER, VS);
      const fs = shader(gl, gl.FRAGMENT_SHADER, FS);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      console.error('3D WebGL scene failed to initialize:', error);
      return undefined;
    }

    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);
    const attribute = { position: gl.getAttribLocation(program, 'a_position'), normal: gl.getAttribLocation(program, 'a_normal') };
    const uniform = {
      viewProjection: gl.getUniformLocation(program, 'u_viewProjection'),
      model: gl.getUniformLocation(program, 'u_model'),
      normalMatrix: gl.getUniformLocation(program, 'u_normalMatrix'),
      color: gl.getUniformLocation(program, 'u_color'),
    };
    const createBuffer = (data) => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return { buffer, count: data.length / 6 };
    };
    const center = mode === 'transform' ? end : { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2, z: (start.z + end.z) / 2 };
    const floorY = mode === 'clip' && clipBounds ? clipBounds.ymin - 1.2 : Math.min(start.y, end.y, -1) - 1.5;
    const meshes = {
      cube: createBuffer(cubeData()),
      sphere: createBuffer(sphereData()),
      grid: createBuffer(gridData(10, floorY)),
      targetLine: createBuffer(lineData(start, end)),
      bounds: createBuffer(boxData(clipBounds)),
      originalSegments: createBuffer(segmentsData(transformOriginalSegments)),
      transformSegments: createBuffer(segmentsData(transformSegments)),
      clipOriginal: createBuffer(clipOriginalLine ? lineData(clipOriginalLine.a, clipOriginalLine.b) : new Float32Array()),
      clipCurrent: createBuffer(clipLine ? lineData(clipLine.a, clipLine.b) : new Float32Array()),
      axes: [
        createBuffer(lineData({ x: -10, y: floorY, z: 0 }, { x: 10, y: floorY, z: 0 })),
        createBuffer(lineData({ x: 0, y: floorY - 0.2, z: 0 }, { x: 0, y: floorY + 3, z: 0 })),
        createBuffer(lineData({ x: 0, y: floorY, z: -10 }, { x: 0, y: floorY, z: 10 })),
      ],
    };

    const bind = (mesh) => {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.buffer);
      gl.enableVertexAttribArray(attribute.position);
      gl.enableVertexAttribArray(attribute.normal);
      gl.vertexAttribPointer(attribute.position, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(attribute.normal, 3, gl.FLOAT, false, 24, 12);
    };
    const draw = (mesh, model, color, primitive = gl.TRIANGLES) => {
      if (!mesh.count) return;
      bind(mesh);
      gl.uniformMatrix4fv(uniform.model, false, model);
      gl.uniformMatrix3fv(uniform.normalMatrix, false, new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1]));
      gl.uniform3fv(uniform.color, color);
      gl.drawArrays(primitive, 0, mesh.count);
    };
    const drawVoxel = (voxel, color, size = 0.41) => draw(meshes.cube, translatedScaled(voxel, size), color);
    const target = [center.x, center.y, center.z];

    let lastViewProjection = null;
    const render = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
      gl.viewport(0, 0, width, height);
      gl.clearColor(0.025, 0.045, 0.085, 1);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      const camera = cameraRef.current;
      const eye = [
        target[0] + camera.distance * Math.cos(camera.pitch) * Math.sin(camera.yaw),
        target[1] + camera.distance * Math.sin(camera.pitch),
        target[2] + camera.distance * Math.cos(camera.pitch) * Math.cos(camera.yaw),
      ];
      const viewProjection = multiply(perspective(Math.PI / 4, width / height, 0.1, 100), lookAt(eye, target));
      lastViewProjection = viewProjection;
      gl.uniformMatrix4fv(uniform.viewProjection, false, viewProjection);
      draw(meshes.grid, identity(), [0.14, 0.22, 0.34], gl.LINES);
      draw(meshes.axes[0], identity(), [0.89, 0.3, 0.39], gl.LINES);
      draw(meshes.axes[1], identity(), [0.22, 0.76, 0.51], gl.LINES);
      draw(meshes.axes[2], identity(), [0.27, 0.48, 0.88], gl.LINES);

      if (mode === 'line') {
        draw(meshes.targetLine, identity(), [0.42, 0.74, 0.92], gl.LINES);
        voxelPoints.slice(0, currentIndex + 1).forEach((item, index, visible) => {
          drawVoxel(item.voxel || item, index === visible.length - 1 ? [1, 0.68, 0.26] : [0.11, 0.72, 0.9]);
        });
        draw(meshes.sphere, translatedScaled(start, 0.18), [1, 0.31, 0.4]);
        draw(meshes.sphere, translatedScaled(end, 0.18), [0.28, 0.94, 0.63]);
      } else if (mode === 'transform') {
        draw(meshes.originalSegments, identity(), [0.22, 0.49, 0.74], gl.LINES);
        draw(meshes.transformSegments, identity(), [0.56, 0.4, 0.98], gl.LINES);
        transformedVertices.slice(0, currentIndex + 1).forEach((point, index, visible) => {
          draw(meshes.sphere, translatedScaled(point, 0.09), index === visible.length - 1 ? [1, 0.68, 0.26] : [0.78, 0.63, 1]);
        });
      } else if (mode === 'clip') {
        draw(meshes.bounds, identity(), [0.24, 0.78, 0.62], gl.LINES);
        draw(meshes.clipOriginal, identity(), [0.33, 0.42, 0.54], gl.LINES);
        draw(meshes.clipCurrent, identity(), [1, 0.68, 0.26], gl.LINES);
        if (clipLine) {
          draw(meshes.sphere, translatedScaled(clipLine.a, 0.14), [1, 0.45, 0.39]);
          draw(meshes.sphere, translatedScaled(clipLine.b, 0.14), [0.3, 0.89, 0.67]);
        }
      }

      if (selectedPoint) draw(meshes.sphere, translatedScaled(selectedPoint, 0.2), [1, 0.84, 0.34]);
    };

    const candidates = [];
    const addCandidate = (point, label, step) => {
      if (point && [point.x, point.y, point.z].every(Number.isFinite)) candidates.push({ point, label, step });
    };
    if (mode === 'line') {
      voxelPoints.slice(0, currentIndex + 1).forEach((item, index) => addCandidate(item.voxel || item, 'Raster point', index + 1));
      addCandidate(start, 'Start endpoint', 1);
      addCandidate(end, 'End endpoint', voxelPoints.length);
    } else if (mode === 'transform') {
      transformedVertices.slice(0, currentIndex + 1).forEach((point, index) => addCandidate(point, 'Transformed vertex', index + 1));
    } else if (mode === 'clip' && clipLine) {
      addCandidate(clipLine.a, 'Clipped endpoint A', currentIndex + 1);
      addCandidate(clipLine.b, 'Clipped endpoint B', currentIndex + 1);
    }

    const hitTest = (event) => {
      if (!lastViewProjection || candidates.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const pointerX = event.clientX - rect.left;
      const pointerY = event.clientY - rect.top;
      const matrix = lastViewProjection;
      const nearest = candidates.reduce((best, candidate) => {
        const { x, y, z } = candidate.point;
        const clipX = matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12];
        const clipY = matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13];
        const clipW = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15];
        if (clipW <= 0) return best;
        const screenX = (clipX / clipW + 1) * rect.width / 2;
        const screenY = (1 - clipY / clipW) * rect.height / 2;
        const distance = Math.hypot(pointerX - screenX, pointerY - screenY);
        return distance < best.distance ? { ...candidate, distance } : best;
      }, { distance: 26 });
      if (nearest.point) onSelectPointRef.current?.({ ...nearest.point, label: nearest.label, step: nearest.step });
    };

    render();
    const onPointerDown = (event) => {
      const camera = cameraRef.current;
      camera.dragging = true;
      camera.lastX = event.clientX;
      camera.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
      canvas.style.cursor = 'grabbing';
    };
    const onPointerMove = (event) => {
      const camera = cameraRef.current;
      if (!camera.dragging) return;
      camera.yaw -= (event.clientX - camera.lastX) * 0.008;
      camera.pitch = Math.min(1.38, Math.max(-0.18, camera.pitch + (event.clientY - camera.lastY) * 0.006));
      camera.lastX = event.clientX;
      camera.lastY = event.clientY;
      render();
    };
    const onPointerUp = () => { cameraRef.current.dragging = false; canvas.style.cursor = 'grab'; };
    const onClick = (event) => {
      if (!cameraRef.current.dragging) hitTest(event);
    };
    const onWheel = (event) => {
      event.preventDefault();
      cameraRef.current.distance = Math.max(4, Math.min(32, cameraRef.current.distance + event.deltaY * 0.008));
      render();
    };
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('wheel', onWheel, { passive: false });

    return () => {
      observer.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('wheel', onWheel);
      [meshes.cube, meshes.sphere, meshes.grid, meshes.targetLine, meshes.bounds, meshes.originalSegments, meshes.transformSegments, meshes.clipOriginal, meshes.clipCurrent, ...meshes.axes].forEach(({ buffer }) => gl.deleteBuffer(buffer));
      gl.deleteProgram(program);
    };
  }, [mode, start, end, voxelPoints, currentIndex, transformOriginalSegments, transformSegments, transformedVertices, clipBounds, clipLine, clipOriginalLine, selectedPoint]);

  return <canvas ref={canvasRef} className="scene3d-canvas" aria-label="Interactive 3D computer graphics algorithm visualization. Drag to orbit; scroll to zoom." />;
}
