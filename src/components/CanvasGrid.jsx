import React from 'react';

function toCanvas(point, width, height) {
  const x = Number(point.x ?? 0);
  const y = Number(point.y ?? 0);
  return { x: width / 2 + x * 22, y: height / 2 - y * 22 };
}

function colorChannels(color = '#ffffff') {
  if (color.startsWith('rgba')) {
    const [r, g, b, a = 1] = color.match(/[\d.]+/g).map(Number);
    return [r / 255, g / 255, b / 255, a];
  }
  if (color.startsWith('rgb')) {
    const [r, g, b] = color.match(/[\d.]+/g).map(Number);
    return [r / 255, g / 255, b / 255, 1];
  }
  const hex = color.replace('#', '');
  const expanded = hex.length === 3 ? hex.split('').map((part) => part + part).join('') : hex;
  const value = Number.parseInt(expanded, 16);
  return [(value >> 16 & 255) / 255, (value >> 8 & 255) / 255, (value & 255) / 255, 1];
}

function makeShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'WebGL shader compilation failed');
  }
  return shader;
}

function addVertex(target, point, color, width, height) {
  const projected = toCanvas(point, width, height);
  target.push(projected.x, projected.y, ...colorChannels(color));
}

function addLine(target, start, end, color, width, height) {
  addVertex(target, start, color, width, height);
  addVertex(target, end, color, width, height);
}

function addCircle(target, point, radius, color, width, height, segments = 20) {
  const center = toCanvas(point, width, height);
  for (let index = 0; index < segments; index += 1) {
    const a = (index / segments) * Math.PI * 2;
    const b = ((index + 1) / segments) * Math.PI * 2;
    // Use screen-space vertices so markers remain round at every zoom/projection.
    const screenTriangle = [center.x, center.y, center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius, center.x + Math.cos(b) * radius, center.y + Math.sin(b) * radius];
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const offset = vertex * 2;
      target.push(screenTriangle[offset], screenTriangle[offset + 1], ...colorChannels(color));
    }
  }
}

const vertexSource = `
  attribute vec2 a_position;
  attribute vec4 a_color;
  uniform vec2 u_resolution;
  varying vec4 v_color;
  void main() {
    vec2 clip = (a_position / u_resolution) * 2.0 - 1.0;
    gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
    gl_PointSize = 1.0;
    v_color = a_color;
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec4 v_color;
  void main() { gl_FragColor = v_color; }
`;

export default function CanvasGrid({
  width = 540,
  height = 420,
  points = [],
  currentIndex = 0,
  activeColor = '#8b5cf6',
  lines = [],
  polygons = [],
  cells = [],
  handles = [],
  onHandleChange,
}) {
  const canvasRef = React.useRef(null);
  const draggingRef = React.useRef(null);
  const [selectedPoint, setSelectedPoint] = React.useState(null);
  const [size, setSize] = React.useState(50);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl', { antialias: true, alpha: false });
    if (!gl) return;

    let program;
    try {
      const vertexShader = makeShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = makeShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      console.error('Unable to initialize WebGL renderer:', error);
      return;
    }

    gl.viewport(0, 0, width, height);
    gl.clearColor(11 / 255, 18 / 255, 32 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const colorLocation = gl.getAttribLocation(program, 'a_color');
    const resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, width, height);
    gl.enableVertexAttribArray(positionLocation);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 24, 0);
    gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 24, 8);

    const draw = (mode, vertices) => {
      if (!vertices.length) return;
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
      gl.drawArrays(mode, 0, vertices.length / 6);
    };

    const grid = [];
    for (let coordinate = -10; coordinate <= 10; coordinate += 1) {
      addLine(grid, { x: coordinate, y: -10 }, { x: coordinate, y: 10 }, 'rgba(148, 163, 184, 0.22)', width, height);
      addLine(grid, { x: -10, y: coordinate }, { x: 10, y: coordinate }, 'rgba(148, 163, 184, 0.22)', width, height);
    }
    addLine(grid, { x: -12, y: 0 }, { x: 12, y: 0 }, '#dfe7f3', width, height);
    addLine(grid, { x: 0, y: -12 }, { x: 0, y: 12 }, '#dfe7f3', width, height);
    draw(gl.LINES, grid);

    const cellVertices = [];
    cells.forEach((cell) => addCircle(cellVertices, cell, 8, cell.color || '#1e293b', width, height, 14));
    draw(gl.TRIANGLES, cellVertices);

    polygons.forEach((polygon) => {
      const vertices = polygon.points || [];
      if (vertices.length < 2) return;
      if (polygon.fill && vertices.length >= 3) {
        const fillVertices = [];
        for (let index = 1; index < vertices.length - 1; index += 1) {
          addVertex(fillVertices, vertices[0], polygon.fill, width, height);
          addVertex(fillVertices, vertices[index], polygon.fill, width, height);
          addVertex(fillVertices, vertices[index + 1], polygon.fill, width, height);
        }
        draw(gl.TRIANGLES, fillVertices);
      }
      const outline = [];
      for (let index = 0; index < vertices.length; index += 1) {
        addLine(outline, vertices[index], vertices[(index + 1) % vertices.length], polygon.stroke || '#7dd3fc', width, height);
      }
      draw(gl.LINES, outline);
    });

    lines.forEach((line) => {
      if (!line || line.length < 2) return;
      const lineVertices = [];
      for (let index = 1; index < line.length; index += 1) {
        addLine(lineVertices, line[index - 1], line[index], '#a78bfa', width, height);
      }
      draw(gl.LINES, lineVertices);
    });

    const visiblePoints = points.slice(0, Math.max(1, currentIndex + 1));
    const pointVertices = [];
    visiblePoints.forEach((point, index) => addCircle(pointVertices, point, 5, index === visiblePoints.length - 1 ? activeColor : '#7dd3fc', width, height));
    draw(gl.TRIANGLES, pointVertices);

    const handleVertices = [];
    handles.forEach((handle) => {
      addCircle(handleVertices, handle, 9, '#fbbf24', width, height);
      addCircle(handleVertices, handle, 5, '#fff7ed', width, height);
    });
    draw(gl.TRIANGLES, handleVertices);

    if (selectedPoint) {
      const selectionVertices = [];
      addCircle(selectionVertices, selectedPoint, 9, '#fbbf24', width, height);
      addCircle(selectionVertices, selectedPoint, 5, '#ffffff', width, height);
      draw(gl.TRIANGLES, selectionVertices);
    }

    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  }, [points, currentIndex, width, height, activeColor, lines, polygons, cells, handles, selectedPoint]);

  const canvasPoint = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * width / rect.width, y: (event.clientY - rect.top) * height / rect.height };
  };

  const handlePointerDown = (event) => {
    const pointer = canvasPoint(event);
    const nearestHandle = onHandleChange && handles.reduce((best, handle) => {
      const projected = toCanvas(handle, width, height);
      const distance = Math.hypot(pointer.x - projected.x, pointer.y - projected.y);
      return distance < best.distance ? { id: handle.id, distance } : best;
    }, { id: null, distance: 19 });
    if (nearestHandle?.id != null) {
      const handle = handles.find((item) => item.id === nearestHandle.id);
      draggingRef.current = nearestHandle.id;
      setSelectedPoint({ x: handle.x, y: handle.y, label: 'Endpoint' });
      event.currentTarget.setPointerCapture(event.pointerId);
      event.currentTarget.style.cursor = 'grabbing';
      return;
    }

    const visiblePoints = points.slice(0, Math.max(1, currentIndex + 1));
    const candidates = [
      ...visiblePoints.map((point, index) => ({ ...point, label: `Point ${index + 1}` })),
      ...cells.map((cell, index) => ({ ...cell, label: `Cell ${index + 1}` })),
      ...polygons.flatMap((polygon) => polygon.points || []).map((point, index) => ({ ...point, label: `Vertex ${index + 1}` })),
    ];
    const nearestPoint = candidates.reduce((best, point) => {
      const projected = toCanvas(point, width, height);
      const distance = Math.hypot(pointer.x - projected.x, pointer.y - projected.y);
      return distance < best.distance ? { point, distance } : best;
    }, { point: null, distance: 16 });
    if (nearestPoint.point) {
      setSelectedPoint({ ...nearestPoint.point });
      return;
    }

    setSelectedPoint({
      x: Math.round((pointer.x - width / 2) / 22),
      y: Math.round((height / 2 - pointer.y) / 22),
      label: 'Grid coordinate',
    });
  };

  const moveHandle = (event) => {
    if (draggingRef.current == null || !onHandleChange) return;
    const pointer = canvasPoint(event);
    const x = Math.round((pointer.x - width / 2) / 22);
    const y = Math.round((height / 2 - pointer.y) / 22);
    onHandleChange(draggingRef.current, x, y);
    setSelectedPoint({ x, y, label: 'Endpoint' });
  };

  const endDrag = (event) => {
    draggingRef.current = null;
    event.currentTarget.style.cursor = handles.length ? 'grab' : 'default';
  };

  return (
    <div className="canvas-stage">
      <label className="canvas-size-control">
        <span>Size</span>
        <input
          type="range"
          min="50"
          max="100"
          step="5"
          value={size}
          aria-label="Visualization size"
          onChange={(event) => setSize(Number(event.target.value))}
        />
        <output>{size}%</output>
      </label>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="algorithm-canvas"
        aria-label="Interactive WebGL grid. Touch or click anywhere to inspect the nearest grid coordinate or plotted point."
        onPointerDown={handlePointerDown}
        onPointerMove={moveHandle}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ width: `${size}%`, touchAction: 'none', cursor: handles.length ? 'grab' : 'crosshair' }}
      />
      <output className="canvas-point-readout" aria-live="polite">
        {selectedPoint
          ? `${selectedPoint.label || 'Selected point'}: X ${Number(selectedPoint.x).toFixed(2)}, Y ${Number(selectedPoint.y).toFixed(2)}${selectedPoint.z != null ? `, Z ${Number(selectedPoint.z).toFixed(2)}` : ''}`
          : 'Touch or click anywhere on the grid to inspect its coordinates'}
      </output>
    </div>
  );
}