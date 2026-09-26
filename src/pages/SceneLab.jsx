import { useEffect, useMemo, useState } from 'react';
import AlgorithmScene3D from '../components/AlgorithmScene3D.jsx';
import { generate3DDDA } from '../algorithms/dda3d.js';
import { generate3DBresenham } from '../algorithms/bresenham3d.js';
import { generateMidpointCircle3D } from '../algorithms/midpointCircle3d.js';
import { cubeEdges3D, cubeVertices3D, generateTransform3D } from '../algorithms/transform3d.js';
import { clipCohenSutherland3D } from '../algorithms/clip3d.js';
import { generateFloodFill3D } from '../algorithms/floodFill3d.js';

const initialLineStart = { x: -5, y: -2, z: -4 };
const initialLineEnd = { x: 5, y: 4, z: 4 };
const initialCenter = { x: 0, y: 0, z: 0 };
const initialTransform = { tx: 2, ty: 1, tz: 1, rx: 20, ry: 30, rz: 0, sx: 1.3, sy: 0.85, sz: 1.1 };
const initialClipStart = { x: -5, y: 0, z: 0 };
const initialClipEnd = { x: 5, y: 2, z: 1 };
const initialBounds = { xmin: -2, xmax: 2, ymin: -2, ymax: 2, zmin: -2, zmax: 2 };
const coordinateAxes = ['x', 'y', 'z'];

const algorithms = [
  { id: 'dda', label: '3D DDA Line', group: 'Line rasterization', formula: 'steps = max(|Δx|, |Δy|, |Δz|); Pₖ = round(P₀ + k · ΔP / steps)' },
  { id: 'bresenham', label: '3D Bresenham Line', group: 'Line rasterization', formula: 'Two integer error accumulators choose the next 3D voxel.' },
  { id: 'circle', label: 'Midpoint Circle (3D)', group: 'Circle rasterization', formula: 'd = 1 − r; use eight-way symmetry in the XY plane.' },
  { id: 'transform', label: '3D Transformations', group: 'Geometric transforms', formula: 'P′ = T · Rz · Ry · Rx · S · P (homogeneous coordinates).' },
  { id: 'clip', label: '3D Cohen–Sutherland', group: 'Volume clipping', formula: 'Classify six clipping planes; intersect the selected plane until accepted or rejected.' },
  { id: 'fill', label: '3D Flood Fill', group: 'Voxel filling', formula: 'Visit each unfilled voxel and enqueue its six axis-adjacent neighbors.' },
];

function CoordinateInputs({ title, value, onChange, min = -8, max = 8 }) {
  return (
    <div className="endpoint-block">
      <div className="endpoint-title">{title}</div>
      <div className="endpoint-inputs">
        {coordinateAxes.map((axis) => (
          <label className="endpoint-input" key={`${title}-${axis}`}>
            <span className={`axis-name axis-${axis}`}>{axis.toUpperCase()}</span>
            <input type="number" value={value[axis]} min={min} max={max} step="1" onChange={(event) => onChange(axis, event.target.value)} />
          </label>
        ))}
      </div>
    </div>
  );
}

export default function SceneLab({ onShow2D }) {
  const [algorithm, setAlgorithm] = useState('dda');
  const [lineStart, setLineStart] = useState(initialLineStart);
  const [lineEnd, setLineEnd] = useState(initialLineEnd);
  const [circleCenter, setCircleCenter] = useState(initialCenter);
  const [radius, setRadius] = useState(5);
  const [transformOptions, setTransformOptions] = useState(initialTransform);
  const [clipStart, setClipStart] = useState(initialClipStart);
  const [clipEnd, setClipEnd] = useState(initialClipEnd);
  const [clipBounds, setClipBounds] = useState(initialBounds);
  const [fillSeed, setFillSeed] = useState({ x: 0, y: 0, z: 0 });
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const result = useMemo(() => {
    if (algorithm === 'dda') return generate3DDDA(lineStart, lineEnd);
    if (algorithm === 'bresenham') return generate3DBresenham(lineStart, lineEnd);
    if (algorithm === 'circle') return generateMidpointCircle3D(circleCenter, radius);
    if (algorithm === 'transform') return generateTransform3D(transformOptions);
    if (algorithm === 'clip') return clipCohenSutherland3D(clipStart, clipEnd, clipBounds);
    return generateFloodFill3D(3, fillSeed);
  }, [algorithm, lineStart, lineEnd, circleCenter, radius, transformOptions, clipStart, clipEnd, clipBounds, fillSeed]);

  const steps = algorithm === 'dda' || algorithm === 'bresenham' ? result.points : result.steps;
  const safeStepIndex = Math.max(0, Math.min(stepIndex, Math.max(0, steps.length - 1)));
  const current = steps[safeStepIndex];
  const mode = algorithm === 'dda' || algorithm === 'bresenham' ? 'line' : algorithm;
  const selectedAlgorithm = algorithms.find((item) => item.id === algorithm);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (safeStepIndex >= steps.length - 1) {
      const timer = window.setTimeout(() => setIsPlaying(false), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStepIndex((index) => index + 1), 480);
    return () => window.clearTimeout(timer);
  }, [isPlaying, safeStepIndex, steps.length]);

  const pauseAtStart = () => {
    setStepIndex(0);
    setIsPlaying(false);
  };

  const chooseAlgorithm = (id) => {
    setAlgorithm(id);
    setSelectedPoint(null);
    pauseAtStart();
  };

  const updatePoint = (setter, point, axis, value) => {
    let coordinate = Number(value) || 0;
    if (algorithm === 'circle' || algorithm === 'fill' || algorithm === 'bresenham') coordinate = Math.round(coordinate);
    if (algorithm === 'fill') coordinate = Math.max(-1, Math.min(1, coordinate));
    setter({ ...point, [axis]: coordinate });
    pauseAtStart();
  };

  const updateTransform = (key, value) => {
    setTransformOptions((currentOptions) => ({ ...currentOptions, [key]: Number(value) || 0 }));
    pauseAtStart();
  };

  const updateBound = (key, value) => {
    setClipBounds((currentBounds) => ({ ...currentBounds, [key]: Number(value) || 0 }));
    pauseAtStart();
  };

  const run = () => {
    setStepIndex(0);
    setIsPlaying(true);
  };

  const reset = () => {
    setLineStart(initialLineStart);
    setLineEnd(initialLineEnd);
    setCircleCenter(initialCenter);
    setRadius(5);
    setTransformOptions(initialTransform);
    setClipStart(initialClipStart);
    setClipEnd(initialClipEnd);
    setClipBounds(initialBounds);
    setFillSeed({ x: 0, y: 0, z: 0 });
    pauseAtStart();
  };

  const togglePlayback = () => {
    if (safeStepIndex >= steps.length - 1) setStepIndex(0);
    setIsPlaying((playing) => !playing);
  };

  const stepBy = (delta) => {
    setIsPlaying(false);
    setStepIndex((index) => Math.max(0, Math.min(steps.length - 1, index + delta)));
  };

  const transformedVertices = algorithm === 'transform' ? result.transformed.map((vertex) => vertex.transformed) : [];
  const visibleCirclePoints = algorithm === 'circle'
    ? [...new Map(result.steps.slice(0, safeStepIndex + 1).flatMap((step) => step.voxels).map((point) => [`${point.x},${point.y},${point.z}`, point])).values()].map((voxel) => ({ voxel }))
    : [];
  const voxelPoints = algorithm === 'circle' ? visibleCirclePoints : algorithm === 'dda' || algorithm === 'bresenham' ? result.points : [];
  const transformSegments = algorithm === 'transform'
    ? cubeEdges3D.filter(([a, b]) => a <= safeStepIndex && b <= safeStepIndex).map(([a, b]) => [transformedVertices[a], transformedVertices[b]])
    : [];
  const originalSegments = algorithm === 'transform' ? cubeEdges3D.map(([a, b]) => [cubeVertices3D[a], cubeVertices3D[b]]) : [];
  const filledCells = algorithm === 'fill' ? result.steps.slice(0, safeStepIndex + 1).map((step) => step.voxel) : [];

  let renderStart = lineStart;
  let renderEnd = lineEnd;
  if (algorithm === 'bresenham') {
    renderStart = result.start;
    renderEnd = result.end;
  }
  if (algorithm === 'circle') {
    renderStart = { x: result.center.x - result.radius, y: result.center.y, z: result.center.z };
    renderEnd = { x: result.center.x + result.radius, y: result.center.y, z: result.center.z };
  } else if (algorithm === 'transform') {
    renderStart = { x: transformOptions.tx - 1, y: transformOptions.ty - 1, z: transformOptions.tz - 1 };
    renderEnd = { x: transformOptions.tx + 1, y: transformOptions.ty + 1, z: transformOptions.tz + 1 };
  } else if (algorithm === 'clip') {
    renderStart = clipStart;
    renderEnd = clipEnd;
  } else if (algorithm === 'fill') {
    renderStart = { x: -1, y: -1, z: -1 };
    renderEnd = { x: 1, y: 1, z: 1 };
  }

  const clipCurrentLine = algorithm === 'clip' && current ? { a: current.a, b: current.b } : null;
  const clipOriginalLine = algorithm === 'clip' ? { a: clipStart, b: clipEnd } : null;

  const renderCurrentValues = () => {
    if (algorithm === 'dda' || algorithm === 'bresenham') {
      const voxel = current.voxel;
      return <><span>Voxel ({voxel.x}, {voxel.y}, {voxel.z})</span><span>{algorithm === 'dda' ? `Sample ${current.sample.x.toFixed(2)}, ${current.sample.y.toFixed(2)}, ${current.sample.z.toFixed(2)}` : `Error ${current.error1}, ${current.error2}`}</span></>;
    }
    if (algorithm === 'circle') return <><span>Octant point ({current.x}, {current.y})</span><span>Decision d = {current.decision}</span></>;
    if (algorithm === 'transform') return <><span>Vertex {safeStepIndex + 1}: ({current.original.x}, {current.original.y}, {current.original.z})</span><span>→ ({current.transformed.x}, {current.transformed.y}, {current.transformed.z})</span></>;
    if (algorithm === 'clip') return <><span>{current.status.toUpperCase()} · outcodes {current.codeA.toString(2).padStart(6, '0')} / {current.codeB.toString(2).padStart(6, '0')}</span><span>Segment A ({current.a.x.toFixed(2)}, {current.a.y.toFixed(2)}, {current.a.z.toFixed(2)})</span></>;
    return <><span>Filled voxel ({current.voxel.x}, {current.voxel.y}, {current.voxel.z})</span><span>6-connected BFS · visit {current.step}</span></>;
  };

  const renderAlgorithmInputs = () => {
    if (algorithm === 'dda' || algorithm === 'bresenham') return <>
      <CoordinateInputs title="Start vertex P₀" value={lineStart} onChange={(axis, value) => updatePoint(setLineStart, lineStart, axis, value)} />
      <CoordinateInputs title="End vertex P₁" value={lineEnd} onChange={(axis, value) => updatePoint(setLineEnd, lineEnd, axis, value)} />
    </>;
    if (algorithm === 'circle') return <>
      <CoordinateInputs title="Circle center C" value={circleCenter} onChange={(axis, value) => updatePoint(setCircleCenter, circleCenter, axis, value)} />
      <label className="endpoint-input radius-control"><span>Radius r</span><input type="number" value={radius} min="1" max="8" step="1" onChange={(event) => { setRadius(Math.max(1, Math.min(8, Math.round(Number(event.target.value) || 1)))); pauseAtStart(); }} /></label>
    </>;
    if (algorithm === 'transform') return <div className="transform-input-grid">
      {[
        ['tx', 'Translate X'], ['ty', 'Translate Y'], ['tz', 'Translate Z'],
        ['rx', 'Rotate X°'], ['ry', 'Rotate Y°'], ['rz', 'Rotate Z°'],
        ['sx', 'Scale X'], ['sy', 'Scale Y'], ['sz', 'Scale Z'],
      ].map(([key, label]) => <label className="transform-input" key={key}><span>{label}</span><input type="number" value={transformOptions[key]} step="0.1" onChange={(event) => updateTransform(key, event.target.value)} /></label>)}
    </div>;
    if (algorithm === 'clip') return <>
      <CoordinateInputs title="Line start A" value={clipStart} onChange={(axis, value) => updatePoint(setClipStart, clipStart, axis, value)} />
      <CoordinateInputs title="Line end B" value={clipEnd} onChange={(axis, value) => updatePoint(setClipEnd, clipEnd, axis, value)} />
      <div className="bounds-inputs">{[['xmin', 'X min'], ['xmax', 'X max'], ['ymin', 'Y min'], ['ymax', 'Y max'], ['zmin', 'Z min'], ['zmax', 'Z max']].map(([key, label]) => <label className="transform-input" key={key}><span>{label}</span><input type="number" value={clipBounds[key]} onChange={(event) => updateBound(key, event.target.value)} /></label>)}</div>
    </>;
    return <>
      <CoordinateInputs title="Seed voxel" value={fillSeed} min={-1} max={1} onChange={(axis, value) => updatePoint(setFillSeed, fillSeed, axis, value)} />
      <div className="dda-equation">3 × 3 × 3 voxel volume · 6 face-connected neighbors</div>
    </>;
  };

  return (
    <main className="scene-app">
      <header className="studio-header">
        <div className="studio-brand">
          <div className="studio-logo" aria-hidden="true">CG</div>
          <div><p className="studio-eyebrow">Computer graphics · real-time 3D rendering</p><h1>{selectedAlgorithm.label} Simulator</h1></div>
        </div>
        <div className="studio-header-tools">
          <button type="button" className="open-2d-button" onClick={onShow2D}>2D calculations</button>
          <label className="algorithm-select-label"><span>3D ALGORITHM</span><select value={algorithm} onChange={(event) => chooseAlgorithm(event.target.value)}>{algorithms.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
          <div className="renderer-status"><span className="live-dot" /> WEBGL · 3D VOXEL VIEW</div>
        </div>
      </header>

      <div className="studio-workspace dda-workspace">
        <aside className="studio-inspector">
          <section className="studio-card">
            <div className="studio-section-heading"><div><span className="section-kicker">ALGORITHM INPUT</span><h2>{selectedAlgorithm.group}</h2></div><span className="object-index">3D</span></div>
            {renderAlgorithmInputs()}
            <button type="button" className="run-dda-button" onClick={run}><span>▶</span> Run {selectedAlgorithm.label}</button>
          </section>

          <section className="studio-card algorithm-info-card">
            <div className="studio-section-heading compact-heading"><div><span className="section-kicker">COMPUTATION</span><h2>{selectedAlgorithm.label}</h2></div></div>
            <div className="dda-equation">{selectedAlgorithm.formula}</div>
            {(algorithm === 'dda' || algorithm === 'bresenham') && <div className="dda-stats">
              <div><span>Δx / Δy / Δz</span><strong>{result.dx} / {result.dy} / {result.dz}</strong></div>
              <div><span>Major axis steps</span><strong>{result.steps}</strong></div>
              <div><span>Voxels plotted</span><strong>{result.points.length}</strong></div>
              {algorithm === 'dda' && <div><span>Increments</span><strong>{result.increment.x.toFixed(2)}, {result.increment.y.toFixed(2)}, {result.increment.z.toFixed(2)}</strong></div>}
            </div>}
            {algorithm === 'clip' && <div className="dda-stats"><div><span>Result</span><strong>{result.visible ? 'Visible inside volume' : 'Rejected'}</strong></div><div><span>Clip iterations</span><strong>{result.steps.length}</strong></div></div>}
            {algorithm === 'fill' && <div className="dda-stats"><div><span>Volume voxels</span><strong>{result.volume.length}</strong></div><div><span>Reachable / filled</span><strong>{result.visitedCount ?? 0}</strong></div></div>}
          </section>

          <section className="studio-card current-voxel-card">
            <div className="studio-section-heading compact-heading"><div><span className="section-kicker">LIVE STEP VALUES</span><h2>Step {current?.step ?? 0}</h2></div><span className="voxel-status">{isPlaying ? 'RUNNING' : 'PAUSED'}</span></div>
            <div className="live-values">{current ? renderCurrentValues() : <span>No steps generated for this input.</span>}</div>
            <div className="selected-3d-point" aria-live="polite">
              <span>{selectedPoint ? `SELECTED · ${selectedPoint.label.toUpperCase()}` : 'POINT INSPECTOR · CLICK A POINT'}</span>
              <strong>{selectedPoint ? `X ${selectedPoint.x}  ·  Y ${selectedPoint.y}  ·  Z ${selectedPoint.z}` : 'Select any visible algorithm point in the 3D viewport'}</strong>
              {selectedPoint?.step != null && <small>Algorithm point {selectedPoint.step}</small>}
            </div>
          </section>
        </aside>

        <section className="viewport-column">
          <div className="viewport-frame dda-viewport-frame">
            <div className="viewport-toolbar"><div className="viewport-title"><span className="viewport-icon">⌗</span><div><h2>Perspective algorithm viewport</h2><p>Drag to orbit <span>·</span> Scroll to zoom</p></div></div><div className="viewport-actions"><span className="viewport-resolution">WEBGL</span></div></div>
            <div className="scene-canvas-wrap dda-scene-wrap">
              <AlgorithmScene3D
                mode={mode}
                start={renderStart}
                end={renderEnd}
                voxelPoints={voxelPoints}
                currentIndex={algorithm === 'circle' ? voxelPoints.length - 1 : safeStepIndex}
                circleCenter={algorithm === 'circle' ? result.center : initialCenter}
                radius={algorithm === 'circle' ? result.radius : 1}
                transformOriginalSegments={originalSegments}
                transformSegments={transformSegments}
                transformedVertices={transformedVertices}
                clipBounds={algorithm === 'clip' ? clipBounds : null}
                clipLine={clipCurrentLine}
                clipOriginalLine={clipOriginalLine}
                volumeCells={algorithm === 'fill' ? result.volume : []}
                filledCells={filledCells}
                selectedPoint={selectedPoint}
                onSelectPoint={setSelectedPoint}
              />
              <div className="viewport-overlay top-left"><span className="axis-gizmo"><i>X</i><i>Y</i><i>Z</i></span>WORLD COORDINATES</div>
              <div className="viewport-overlay bottom-left">PERSPECTIVE <span>·</span> DEPTH TEST <span>·</span> {selectedAlgorithm.label.toUpperCase()}</div>
              <div className="voxel-legend"><span className="legend-swatch completed-swatch" /> computed <span className="legend-swatch active-swatch" /> current <span className="legend-swatch target-swatch" /> reference</div>
            </div>
            <div className="dda-playback-bar">
              <div className="dda-progress-info"><strong>Step {safeStepIndex + 1} <span>/</span> {steps.length}</strong><div className="dda-progress-track"><div style={{ width: `${((safeStepIndex + 1) / steps.length) * 100}%` }} /></div></div>
              <div className="dda-playback-controls">
                <button type="button" className="reset-control" onClick={reset}>Reset</button>
                <button type="button" className="dda-step-button" onClick={() => stepBy(-1)} disabled={safeStepIndex === 0}>←</button>
                <button type="button" className="play-control" onClick={togglePlayback}><span>{isPlaying ? 'Ⅱ' : '▶'}</span>{isPlaying ? 'Pause' : safeStepIndex === steps.length - 1 ? 'Replay' : 'Play'}</button>
                <button type="button" className="dda-step-button" onClick={() => stepBy(1)} disabled={safeStepIndex >= steps.length - 1}>→</button>
              </div>
            </div>
          </div>
          <div className="rendering-note"><span className="note-mark">✦</span><p><strong>Step-by-step 3D visualization</strong> — algorithm output is mapped to depth-tested WebGL geometry; use the controls to inspect each iteration.</p></div>
        </section>
      </div>
    </main>
  );
}