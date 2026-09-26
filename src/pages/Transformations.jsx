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

const defaults = {
  tx: 2, ty: 1, sx: 1.5, sy: 1.5, angleDeg: 45,
  pivotX: 0, pivotY: 0, reflection: 'none', shearX: 0, shearY: 0,
};

const fields = [
  ['tx', 'Translate X (tx)', '0.1'], ['ty', 'Translate Y (ty)', '0.1'],
  ['sx', 'Scale X (sx)', '0.1'], ['sy', 'Scale Y (sy)', '0.1'],
  ['angleDeg', 'Rotation angle (°)', '1'],
  ['pivotX', 'Pivot X', '0.1'], ['pivotY', 'Pivot Y', '0.1'],
  ['shearX', 'X shear (shx)', '0.1'], ['shearY', 'Y shear (shy)', '0.1'],
];

function format(value) {
  return Number(value).toFixed(3).replace(/\.?(0+)$/, '');
}

export default function Transformations() {
  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState('');

  const transformed = useMemo(() => result?.transformed ?? [], [result]);
  const currentPoint = transformed[stepIndex] ?? null;
  const previewPoints = result ? transformed.map((point) => ({ x: point.x, y: point.y })) : basePoints;
  const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const runAlgorithm = () => {
    const numericValues = Object.fromEntries(fields.map(([key]) => [key, Number(form[key])]));
    if (Object.values(numericValues).some((value) => !Number.isFinite(value))) {
      setError('Enter a valid finite number in each transformation field.');
      return;
    }

    const reflection = form.reflection;
    try {
      const data = applyTransformations(basePoints, {
        ...numericValues,
        reflectX: reflection === 'x' || reflection === 'origin',
        reflectY: reflection === 'y' || reflection === 'origin',
      });
      setResult(data);
      setStepIndex(0);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to apply these transformation values.');
    }
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
        <div><p className="eyebrow">Homogeneous-coordinate pipeline</p><h1>2D Transformations</h1></div>
        <span className="small-tag">3 × 3 MATRIX</span>
      </header>

      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel
            title="Transformation Parameters"
            actions={<button type="button" className="primary-btn" onClick={runAlgorithm}>Apply transform</button>}
          >
            <div className="transform-form-grid">
              {fields.map(([key, label, step]) => (
                <label key={key}><span>{label}</span><input type="number" step={step} value={form[key]} onChange={(event) => updateField(key, event.target.value)} /></label>
              ))}
              <label className="reflection-control">
                <span>Reflection</span>
                <select value={form.reflection} onChange={(event) => updateField('reflection', event.target.value)}>
                  <option value="none">None</option>
                  <option value="x">About X-axis</option>
                  <option value="y">About Y-axis</option>
                  <option value="origin">About origin</option>
                </select>
              </label>
            </div>
            {error && <p className="validation-message" role="alert">{error}</p>}
          </ControlPanel>

          <CalculationPanel
            title="Active homogeneous matrix"
            formula={result?.order ?? 'T(tx,ty) · T(pivot) · R(θ) · S · Reflection · Shy · Shx · T(−pivot)'}
            values={result
              ? result.matrix.flatMap((row, index) => row.map((value, column) => ({ label: `M${index + 1}${column + 1}`, value: format(value) })))
              : [
                  { label: 'M11', value: '—' }, { label: 'M12', value: '—' }, { label: 'M13', value: '—' },
                  { label: 'M21', value: '—' }, { label: 'M22', value: '—' }, { label: 'M23', value: '—' },
                  { label: 'M31', value: '—' }, { label: 'M32', value: '—' }, { label: 'M33', value: '—' },
                ]}
          />

          <section className="panel transform-trace-panel">
            <div className="panel-header-row"><h3>Point transformation trace</h3><span className="small-tag">ORDERED OPERATIONS</span></div>
            {currentPoint ? (
              <>
                <div className="transform-vector-flow">
                  <div><span>ORIGINAL POINT</span><strong>P = ({format(currentPoint.originalX)}, {format(currentPoint.originalY)}, 1)</strong></div>
                  <span className="flow-arrow">↓</span>
                  <div><span>ACTIVE MATRIX</span><strong>Multiply M · P</strong></div>
                  <span className="flow-arrow">↓</span>
                  <div><span>TRANSFORMED POINT</span><strong>P′ = ({format(currentPoint.x)}, {format(currentPoint.y)}, 1)</strong></div>
                </div>
                <div className="transform-stage-list">
                  {currentPoint.stages.map((stage, index) => <div key={`${stage.name}-${index}`}><span>{stage.name}</span><strong>({format(stage.x)}, {format(stage.y)})</strong></div>)}
                </div>
              </>
            ) : <p className="empty-state">Apply a transform to see the per-operation coordinates.</p>}
            <p className="complexity-note">Complexity: O(n) for n polygon vertices.</p>
          </section>
        </div>

        <div className="right-column">
          <section className="panel canvas-panel">
            <div className="panel-header-row"><h3>Transformation preview</h3><span className="small-tag">XY PLANE</span></div>
            <CanvasGrid
              points={previewPoints}
              currentIndex={stepIndex}
              activeColor="#34d399"
              polygons={[
                { points: basePoints, stroke: '#60a5fa', fill: 'rgba(96, 165, 250, 0.12)', lineWidth: 2 },
                { points: previewPoints, stroke: '#34d399', fill: 'rgba(52, 211, 153, 0.15)', lineWidth: 2 },
              ]}
            />
            <StepControls
              currentStep={stepIndex}
              totalSteps={Math.max(1, transformed.length)}
              playKey={result}
              onPrev={() => setStepIndex((previous) => Math.max(0, previous - 1))}
              onNext={() => setStepIndex((previous) => Math.min(Math.max(0, transformed.length - 1), previous + 1))}
              onReset={() => { setStepIndex(0); setResult(null); setError(''); }}
              onComplete={() => setStepIndex(Math.max(0, transformed.length - 1))}
            />
          </section>

          <AlgorithmTable
            columns={[{ key: 'index', label: 'Point' }, { key: 'orig x', label: 'Original X' }, { key: 'orig y', label: 'Original Y' }, { key: 'new x', label: 'Transformed X' }, { key: 'new y', label: 'Transformed Y' }]}
            rows={tableRows}
          />
        </div>
      </div>
    </div>
  );
}