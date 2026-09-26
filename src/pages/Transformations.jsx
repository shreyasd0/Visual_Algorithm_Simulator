import { useMemo, useState } from 'react';
import CanvasGrid from '../components/CanvasGrid.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import StepControls from '../components/StepControls.jsx';
import CalculationPanel from '../components/CalculationPanel.jsx';
import AlgorithmTable from '../components/AlgorithmTable.jsx';
import { applyTransformations } from '../algorithms/transformations.js';

const basePoints = [
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 3, y: 3 },
  { x: 1, y: 3 },
];

export default function Transformations() {
  const [form, setForm] = useState({ tx: 2, ty: 1, sx: 1.5, sy: 1.5, angleDeg: 45, pivotX: 0, pivotY: 0 });
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const transformed = useMemo(() => {
    if (!result) return [];
    return result.transformed;
  }, [result]);

  const transformedPolygon = useMemo(() => (transformed.length > 0 ? transformed : basePoints), [transformed]);

  const runAlgorithm = () => {
    const data = applyTransformations(basePoints, {
      tx: Number(form.tx),
      ty: Number(form.ty),
      sx: Number(form.sx),
      sy: Number(form.sy),
      angleDeg: Number(form.angleDeg),
      pivotX: Number(form.pivotX),
      pivotY: Number(form.pivotY),
    });
    setResult(data);
    setStepIndex(0);
  };

  const tableRows = transformed.map((point, index) => ({
    key: `${index}-${point.x}-${point.y}`,
    index: index + 1,
    'orig x': point.originalX,
    'orig y': point.originalY,
    'new x': point.x,
    'new y': point.y,
  }));

  return (
    <div className="page algorithm-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Geometric Transformations</p>
          <h1>2D Transformations</h1>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel
            title="Transform Parameters"
            actions={<button type="button" className="primary-btn" onClick={runAlgorithm}>Apply</button>}
          >
            <label><span>Translate X</span><input type="number" value={form.tx} onChange={(e) => setForm((prev) => ({ ...prev, tx: e.target.value }))} /></label>
            <label><span>Translate Y</span><input type="number" value={form.ty} onChange={(e) => setForm((prev) => ({ ...prev, ty: e.target.value }))} /></label>
            <label><span>Scale X</span><input type="number" value={form.sx} step="0.1" onChange={(e) => setForm((prev) => ({ ...prev, sx: e.target.value }))} /></label>
            <label><span>Scale Y</span><input type="number" value={form.sy} step="0.1" onChange={(e) => setForm((prev) => ({ ...prev, sy: e.target.value }))} /></label>
            <label><span>Rotate (deg)</span><input type="number" value={form.angleDeg} onChange={(e) => setForm((prev) => ({ ...prev, angleDeg: e.target.value }))} /></label>
            <label><span>Pivot X</span><input type="number" value={form.pivotX} onChange={(e) => setForm((prev) => ({ ...prev, pivotX: e.target.value }))} /></label>
            <label><span>Pivot Y</span><input type="number" value={form.pivotY} onChange={(e) => setForm((prev) => ({ ...prev, pivotY: e.target.value }))} /></label>
          </ControlPanel>

          <CalculationPanel
            title="Matrix Formula"
            formula="P' = T(tx, ty) × S(sx, sy) × R(θ) × P"
            values={
              result
                ? [
                    { label: 'TX', value: result.matrix.tx },
                    { label: 'TY', value: result.matrix.ty },
                    { label: 'SX', value: result.matrix.sx },
                    { label: 'SY', value: result.matrix.sy },
                  ]
                : [
                    { label: 'TX', value: '—' },
                    { label: 'TY', value: '—' },
                    { label: 'SX', value: '—' },
                    { label: 'SY', value: '—' },
                  ]
            }
          />
        </div>

        <div className="right-column">
          <section className="panel canvas-panel">
            <div className="panel-header-row">
              <h3>Visualization</h3>
              <span className="small-tag">2D</span>
            </div>
            <CanvasGrid
              points={transformed}
              currentIndex={Math.max(0, stepIndex)}
              activeColor="#34d399"
              polygons={[
                { points: basePoints, stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.12)', lineWidth: 2 },
                { points: result ? transformed.slice(0, stepIndex + 1) : transformedPolygon, stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.18)', lineWidth: 2 },
              ]}
            />
            <StepControls
              currentStep={stepIndex}
              totalSteps={Math.max(1, transformed.length)}
              playKey={result}
              onPrev={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setStepIndex((prev) => Math.min(Math.max(0, transformed.length - 1), prev + 1))}
              onReset={() => setStepIndex(0)}
            />
          </section>

          <AlgorithmTable
            columns={[{ key: 'index', label: 'Point' }, { key: 'orig x', label: 'X0' }, { key: 'orig y', label: 'Y0' }, { key: 'new x', label: 'X1' }, { key: 'new y', label: 'Y1' }]}
            rows={tableRows}
          />
        </div>
      </div>
    </div>
  );
}
