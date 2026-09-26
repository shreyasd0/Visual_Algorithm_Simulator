import { useEffect, useMemo, useState } from 'react';
import AlgorithmScene3D from '../components/AlgorithmScene3D.jsx';
import { generate3DDDA } from '../algorithms/dda3d.js';
import { generate3DBresenham } from '../algorithms/bresenham3d.js';
import { cubeEdges3D, cubeVertices3D, generateTransform3D } from '../algorithms/transform3d.js';
import { clipCohenSutherland3D } from '../algorithms/clip3d.js';

const initialLineStart = { x: -5, y: -2, z: -4 };
const initialLineEnd = { x: 5, y: 4, z: 4 };
const initialTransform = { tx: 2, ty: 1, tz: 1, rx: 20, ry: 30, rz: 0, sx: 1.3, sy: 0.85, sz: 1.1 };
const initialClipStart = { x: -5, y: 0, z: 0 };
const initialClipEnd = { x: 5, y: 2, z: 1 };
const initialBounds = { xmin: -2, xmax: 2, ymin: -2, ymax: 2, zmin: -2, zmax: 2 };
const coordinateAxes = ['x', 'y', 'z'];
const algorithms = [
  { id: 'dda', label: '3D DDA Line', group: '3D line rasterization', formula: 'steps = ceil(max(|Δx|, |Δy|, |Δz|)); voxelₖ = round(P₀ + k · ΔP / steps)', complexity: 'O(max(|dx|, |dy|, |dz|))' },
  { id: 'bresenham', label: '3D Bresenham Line', group: '3D line rasterization', formula: 'Major-axis stepping with two integer error accumulators.', complexity: 'O(max(dx, dy, dz))' },
  { id: 'transform', label: '3D Transformations', group: '3D geometric transforms', formula: 'P′ = T · Rz · Ry · Rx · S · P using homogeneous coordinates.', complexity: 'O(n) for n vertices' },
  { id: 'clip', label: '3D Cohen–Sutherland', group: '3D volume clipping', formula: 'Six-plane outcodes and repeated boundary intersections.', complexity: 'Based on clipping iterations' },
];

const format = (value) => Number(value).toFixed(3).replace(/\.?0+$/, '');

function CoordinateInputs({ title, value, onChange, min = -8, max = 8 }) {
  return <div className="endpoint-block"><div className="endpoint-title">{title}</div><div className="endpoint-inputs">
    {coordinateAxes.map((axis) => <label className="endpoint-input" key={`${title}-${axis}`}><span className={`axis-name axis-${axis}`}>{axis.toUpperCase()}</span><input type="number" value={value[axis]} min={min} max={max} step="0.1" onChange={(event) => onChange(axis, event.target.value)} /></label>)}
  </div></div>;
}

export default function SceneLab({ onShow2D }) {
  const [algorithm, setAlgorithm] = useState('dda');
  const [lineStart, setLineStart] = useState(initialLineStart);
  const [lineEnd, setLineEnd] = useState(initialLineEnd);
  const [transformOptions, setTransformOptions] = useState(initialTransform);
  const [clipStart, setClipStart] = useState(initialClipStart);
  const [clipEnd, setClipEnd] = useState(initialClipEnd);
  const [clipBounds, setClipBounds] = useState(initialBounds);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(480);
  const [selectedPoint, setSelectedPoint] = useState(null);

  const result = useMemo(() => {
    try {
      if (algorithm === 'dda') return generate3DDDA(lineStart, lineEnd);
      if (algorithm === 'bresenham') return generate3DBresenham(lineStart, lineEnd);
      if (algorithm === 'transform') return generateTransform3D(transformOptions);
      return clipCohenSutherland3D(clipStart, clipEnd, clipBounds);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Invalid algorithm parameters.' };
    }
  }, [algorithm, lineStart, lineEnd, transformOptions, clipStart, clipEnd, clipBounds]);

  const steps = result.error ? [] : algorithm === 'dda' || algorithm === 'bresenham' ? result.points : result.steps;
  const totalSteps = Math.max(1, steps.length);
  const safeStepIndex = Math.max(0, Math.min(stepIndex, totalSteps - 1));
  const current = steps[safeStepIndex];
  const lastStep = Math.max(0, steps.length - 1);
  const mode = algorithm === 'dda' || algorithm === 'bresenham' ? 'line' : algorithm;
  const selectedAlgorithm = algorithms.find((item) => item.id === algorithm);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return undefined;
    if (safeStepIndex >= steps.length - 1) {
      const timer = window.setTimeout(() => setIsPlaying(false), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setStepIndex((index) => index + 1), playSpeed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, safeStepIndex, steps.length, playSpeed]);

  const pauseAtStart = () => { setStepIndex(0); setIsPlaying(false); };
  const chooseAlgorithm = (id) => { setAlgorithm(id); setSelectedPoint(null); pauseAtStart(); };
  const updatePoint = (setter, point, axis, rawValue) => {
    const parsed = Number(rawValue);
    const coordinate = Number.isFinite(parsed) ? (algorithm === 'bresenham' ? Math.round(parsed) : Math.max(-8, Math.min(8, parsed))) : 0;
    setter({ ...point, [axis]: coordinate });
    pauseAtStart();
  };
  const updateTransform = (key, rawValue) => {
    const value = Number(rawValue);
    setTransformOptions((currentOptions) => ({ ...currentOptions, [key]: Number.isFinite(value) ? value : 0 }));
    pauseAtStart();
  };
  const updateBound = (key, rawValue) => {
    const value = Number(rawValue);
    setClipBounds((bounds) => ({ ...bounds, [key]: Number.isFinite(value) ? value : 0 }));
    pauseAtStart();
  };
  const run = () => { if (result.error || !steps.length) return; setStepIndex(0); setIsPlaying(true); };
  const reset = () => {
    setLineStart(initialLineStart); setLineEnd(initialLineEnd); setTransformOptions(initialTransform);
    setClipStart(initialClipStart); setClipEnd(initialClipEnd); setClipBounds(initialBounds);
    setSelectedPoint(null); pauseAtStart();
  };
  const togglePlayback = () => {
    if (!steps.length || result.error) return;
    if (safeStepIndex >= steps.length - 1) setStepIndex(0);
    setIsPlaying((playing) => !playing);
  };
  const stepBy = (delta) => { setIsPlaying(false); setStepIndex((index) => Math.max(0, Math.min(lastStep, index + delta))); };

  const transformedVertices = algorithm === 'transform' && !result.error ? result.transformed.map((vertex) => vertex.transformed) : [];
  const voxelPoints = algorithm === 'dda' || algorithm === 'bresenham' ? result.points || [] : [];
  const transformSegments = algorithm === 'transform' ? cubeEdges3D.filter(([a, b]) => a <= safeStepIndex && b <= safeStepIndex).map(([a, b]) => [transformedVertices[a], transformedVertices[b]]) : [];
  const originalSegments = algorithm === 'transform' ? cubeEdges3D.map(([a, b]) => [cubeVertices3D[a], cubeVertices3D[b]]) : [];
  let renderStart = algorithm === 'bresenham' && !result.error ? result.start : lineStart;
  let renderEnd = algorithm === 'bresenham' && !result.error ? result.end : lineEnd;
  if (algorithm === 'transform') {
    renderStart = { x: transformOptions.tx - 1, y: transformOptions.ty - 1, z: transformOptions.tz - 1 };
    renderEnd = { x: transformOptions.tx + 1, y: transformOptions.ty + 1, z: transformOptions.tz + 1 };
  } else if (algorithm === 'clip') { renderStart = clipStart; renderEnd = clipEnd; }

  const clipCurrentLine = algorithm === 'clip' && current ? { a: current.a, b: current.b } : null;
  const clipOriginalLine = algorithm === 'clip' ? { a: clipStart, b: clipEnd } : null;

  const renderCurrentValues = () => {
    if (!current) return <span>Run the algorithm to generate its step trace.</span>;
    if (algorithm === 'dda') return <><span>Voxel ({current.voxel.x}, {current.voxel.y}, {current.voxel.z}) · Step {current.step}/{steps.length}</span><span>Sample ({format(current.sample.x)}, {format(current.sample.y)}, {format(current.sample.z)})</span><span>Increment ({format(result.increment.x)}, {format(result.increment.y)}, {format(result.increment.z)})</span></>;
    if (algorithm === 'bresenham') return <><span>Major axis {current.majorAxis} · Step {current.step}/{steps.length}</span><span>Voxel ({current.voxel.x}, {current.voxel.y}, {current.voxel.z}) → ({current.nextVoxel.x}, {current.nextVoxel.y}, {current.nextVoxel.z})</span><span>Errors ({current.error1}, {current.error2}) → ({current.nextError1}, {current.nextError2})</span></>;
    if (algorithm === 'transform') return <><span>Vertex {safeStepIndex + 1}/{steps.length}: ({current.original.x}, {current.original.y}, {current.original.z})</span><span>→ ({current.transformed.x}, {current.transformed.y}, {current.transformed.z})</span></>;
    return <><span>{current.status.toUpperCase()} · A {current.codeA.toString(2).padStart(6, '0')} {current.codeAName} · B {current.codeB.toString(2).padStart(6, '0')} {current.codeBName}</span><span>A AND B = {current.andCode.toString(2).padStart(6, '0')} · {current.decision}</span><span>{current.selectedBoundary ? `${current.updatedEndpoint} → ${current.selectedBoundary} at (${format(current.intersection.x)}, ${format(current.intersection.y)}, ${format(current.intersection.z)})` : 'No intersection required'}</span></>;
  };

  const renderAlgorithmInputs = () => {
    if (algorithm === 'dda' || algorithm === 'bresenham') return <>
      <CoordinateInputs title="Start vertex P₀" value={lineStart} onChange={(axis, value) => updatePoint(setLineStart, lineStart, axis, value)} />
      <CoordinateInputs title="End vertex P₁" value={lineEnd} onChange={(axis, value) => updatePoint(setLineEnd, lineEnd, axis, value)} />
    </>;
    if (algorithm === 'transform') return <div className="transform-input-grid">{[
      ['tx', 'Translate X'], ['ty', 'Translate Y'], ['tz', 'Translate Z'], ['rx', 'Rotate X°'], ['ry', 'Rotate Y°'], ['rz', 'Rotate Z°'], ['sx', 'Scale X'], ['sy', 'Scale Y'], ['sz', 'Scale Z'],
    ].map(([key, label]) => <label className="transform-input" key={key}><span>{label}</span><input type="number" value={transformOptions[key]} step="0.1" onChange={(event) => updateTransform(key, event.target.value)} /></label>)}</div>;
    return <>
      <CoordinateInputs title="Line start A" value={clipStart} onChange={(axis, value) => updatePoint(setClipStart, clipStart, axis, value)} />
      <CoordinateInputs title="Line end B" value={clipEnd} onChange={(axis, value) => updatePoint(setClipEnd, clipEnd, axis, value)} />
      <div className="bounds-inputs">{[['xmin', 'X min'], ['xmax', 'X max'], ['ymin', 'Y min'], ['ymax', 'Y max'], ['zmin', 'Z min'], ['zmax', 'Z max']].map(([key, label]) => <label className="transform-input" key={key}><span>{label}</span><input type="number" value={clipBounds[key]} onChange={(event) => updateBound(key, event.target.value)} /></label>)}</div>
    </>;
  };

  return <main className="scene-app">
    <header className="studio-header"><div className="studio-brand"><div className="studio-logo" aria-hidden="true">CG</div><div><p className="studio-eyebrow">Computer graphics · real-time 3D rendering</p><h1>{selectedAlgorithm.label} Simulator</h1></div></div>
      <div className="studio-header-tools"><button type="button" className="open-2d-button" onClick={onShow2D}>2D calculations</button><label className="algorithm-select-label"><span>3D ALGORITHM</span><select value={algorithm} onChange={(event) => chooseAlgorithm(event.target.value)}>{algorithms.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><div className="renderer-status"><span className="live-dot" /> WEBGL · 3D VIEWPORT</div></div>
    </header>

    <div className="studio-workspace dda-workspace">
      <aside className="studio-inspector">
        <section className="studio-card"><div className="studio-section-heading"><div><span className="section-kicker">ALGORITHM INPUT</span><h2>{selectedAlgorithm.group}</h2></div><span className="object-index">3D</span></div>
          {renderAlgorithmInputs()}{result.error && <p className="validation-message" role="alert">{result.error}</p>}
          <button type="button" className="run-dda-button" onClick={run} disabled={Boolean(result.error)}><span>▶</span> Run {selectedAlgorithm.label}</button>
        </section>

        <section className="studio-card algorithm-info-card"><div className="studio-section-heading compact-heading"><div><span className="section-kicker">COMPUTATION</span><h2>{selectedAlgorithm.label}</h2></div></div><div className="dda-equation">{selectedAlgorithm.formula}</div><p className="complexity-note">Time complexity: {selectedAlgorithm.complexity}</p>
          {(algorithm === 'dda' || algorithm === 'bresenham') && !result.error && <div className="dda-stats"><div><span>Δx / Δy / Δz</span><strong>{result.dx} / {result.dy} / {result.dz}</strong></div><div><span>Major axis / steps</span><strong>{algorithm === 'dda' ? `${result.majorAxis.toUpperCase()} / ${result.steps}` : `${result.majorAxis} / ${result.steps}`}</strong></div><div><span>Voxels</span><strong>{result.points.length}</strong></div>{algorithm === 'dda' && <div><span>x/y/z increments</span><strong>{format(result.increment.x)}, {format(result.increment.y)}, {format(result.increment.z)}</strong></div>}</div>}
          {algorithm === 'transform' && !result.error && <><div className="dda-equation">Matrix order: {result.order}</div><div className="matrix4-grid" aria-label="3D homogeneous transformation matrix">{result.matrix.flatMap((row, rowIndex) => row.map((value, columnIndex) => <span key={`${rowIndex}-${columnIndex}`}>{format(value)}</span>))}</div></>}
          {algorithm === 'clip' && !result.error && <div className="dda-stats"><div><span>Result</span><strong>{result.visible ? 'Accepted inside volume' : 'Rejected'}</strong></div><div><span>Clip iterations</span><strong>{result.steps.length}</strong></div></div>}
        </section>

        <section className="studio-card current-voxel-card"><div className="studio-section-heading compact-heading"><div><span className="section-kicker">LIVE STEP VALUES</span><h2>Step {current?.step ?? 0} / {steps.length}</h2></div><span className="voxel-status">{isPlaying ? 'RUNNING' : 'PAUSED'}</span></div><div className="live-values">{renderCurrentValues()}</div>
          <div className="selected-3d-point" aria-live="polite"><span>{selectedPoint ? `SELECTED · ${selectedPoint.label.toUpperCase()}` : 'POINT INSPECTOR · CLICK A POINT'}</span><strong>{selectedPoint ? `X ${format(selectedPoint.x)} · Y ${format(selectedPoint.y)} · Z ${format(selectedPoint.z)}` : 'Select a visible algorithm point in the viewport'}</strong>{selectedPoint?.step != null && <small>Algorithm point {selectedPoint.step}</small>}</div>
        </section>
      </aside>

      <section className="viewport-column"><div className="viewport-frame dda-viewport-frame">
        <div className="viewport-toolbar"><div className="viewport-title"><span className="viewport-icon">⌗</span><div><h2>Perspective algorithm viewport</h2><p>Drag to orbit <span>·</span> Scroll to zoom</p></div></div><div className="viewport-actions"><span className="viewport-resolution">WEBGL</span></div></div>
        <div className="scene-canvas-wrap dda-scene-wrap"><AlgorithmScene3D mode={mode} start={renderStart} end={renderEnd} voxelPoints={voxelPoints} currentIndex={safeStepIndex} transformOriginalSegments={originalSegments} transformSegments={transformSegments} transformedVertices={transformedVertices} clipBounds={algorithm === 'clip' ? clipBounds : null} clipLine={clipCurrentLine} clipOriginalLine={clipOriginalLine} selectedPoint={selectedPoint} onSelectPoint={setSelectedPoint} />
          <div className="viewport-overlay top-left"><span className="axis-gizmo"><i>X</i><i>Y</i><i>Z</i></span>WORLD COORDINATES</div><div className="viewport-overlay bottom-left">PERSPECTIVE <span>·</span> DEPTH TEST <span>·</span> {selectedAlgorithm.label.toUpperCase()}</div><div className="voxel-legend"><span className="legend-swatch completed-swatch" /> computed <span className="legend-swatch active-swatch" /> current <span className="legend-swatch target-swatch" /> reference</div>
        </div>
        <div className="dda-playback-bar"><div className="dda-progress-info"><strong>Step {steps.length ? safeStepIndex + 1 : 0} <span>/</span> {steps.length}</strong><div className="dda-progress-track"><div style={{ width: `${steps.length ? ((safeStepIndex + 1) / steps.length) * 100 : 0}%` }} /></div></div>
          <div className="dda-playback-controls"><button type="button" className="reset-control" onClick={reset}>Reset</button><button type="button" className="dda-step-button" onClick={() => stepBy(-1)} disabled={safeStepIndex === 0 || !steps.length}>←</button><button type="button" className="play-control" onClick={togglePlayback} disabled={!steps.length}><span>{isPlaying ? 'Ⅱ' : '▶'}</span>{isPlaying ? 'Pause' : safeStepIndex === steps.length - 1 ? 'Replay' : 'Play'}</button><button type="button" className="dda-step-button" onClick={() => stepBy(1)} disabled={safeStepIndex >= steps.length - 1 || !steps.length}>→</button><button type="button" className="reset-control" onClick={() => { setIsPlaying(false); setStepIndex(lastStep); }} disabled={!steps.length || safeStepIndex >= lastStep}>Complete</button><label className="scene-speed-control"><span>Speed</span><select value={playSpeed} onChange={(event) => setPlaySpeed(Number(event.target.value))}><option value="850">Slow</option><option value="480">Normal</option><option value="180">Fast</option></select></label></div>
        </div>
      </div><div className="rendering-note"><span className="note-mark">✦</span><p><strong>Step-by-step 3D visualization</strong> — algorithm output is mapped to depth-tested WebGL geometry; use the controls to inspect each iteration.</p></div></section>
    </div>
  </main>;
}