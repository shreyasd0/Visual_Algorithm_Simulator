import { useMemo, useState } from 'react';
import CanvasGrid from '../components/CanvasGrid.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import StepControls from '../components/StepControls.jsx';
import CalculationPanel from '../components/CalculationPanel.jsx';
import AlgorithmTable from '../components/AlgorithmTable.jsx';
import { generateMidpointCircle } from '../algorithms/midpointCircle.js';

const defaults = { cx: 0, cy: 0, radius: 6 };

export default function CircleDrawing() {
  const [form, setForm] = useState(defaults);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const points = useMemo(() => {
    if (!result) return [];
    return result.points.flatMap((entry) => entry.points.map((point) => ({ x: point.x, y: point.y })));
  }, [result]);

  const visibleCircle = useMemo(() => {
    if (!result) return [];
    const selected = result.points.slice(0, stepIndex + 1);
    return selected.flatMap((entry) => entry.points.map((point) => ({ x: point.x, y: point.y })));
  }, [result, stepIndex]);

  const runAlgorithm = () => {
    const data = generateMidpointCircle(
      Number(form.cx),
      Number(form.cy),
      Number(form.radius),
    );
    setResult(data);
    setStepIndex(0);
  };

  const currentStep = result?.points?.[stepIndex] ?? null;

  const tableRows = result?.points?.map((item) => ({
    key: item.step,
    step: item.step,
    x: item.x,
    y: item.y,
    decision: Number(item.decision).toFixed(2),
  })) ?? [];

  return (
    <div className="page algorithm-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Rasterization Algorithms</p>
          <h1>Circle Drawing</h1>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel
            title="Circle Parameters"
            actions={<button type="button" className="primary-btn" onClick={runAlgorithm}>Run</button>}
          >
            <label>
              <span>Center X</span>
              <input type="number" value={form.cx} onChange={(e) => setForm((prev) => ({ ...prev, cx: e.target.value }))} />
            </label>
            <label>
              <span>Center Y</span>
              <input type="number" value={form.cy} onChange={(e) => setForm((prev) => ({ ...prev, cy: e.target.value }))} />
            </label>
            <label>
              <span>Radius</span>
              <input type="number" value={form.radius} onChange={(e) => setForm((prev) => ({ ...prev, radius: e.target.value }))} />
            </label>
          </ControlPanel>

          <CalculationPanel
            title="Decision Parameter"
            formula="d = d + 2x + 3 or d + 2(x - y) + 5"
            values={
              currentStep
                ? [
                    { label: 'Step', value: currentStep.step },
                    { label: 'x', value: currentStep.x },
                    { label: 'y', value: currentStep.y },
                    { label: 'd', value: Number(currentStep.decision).toFixed(2) },
                  ]
                : [
                    { label: 'Step', value: '—' },
                    { label: 'x', value: '—' },
                    { label: 'y', value: '—' },
                    { label: 'd', value: '—' },
                  ]
            }
          />
        </div>

        <div className="right-column">
          <section className="panel canvas-panel">
            <div className="panel-header-row">
              <h3>Visualization</h3>
              <span className="small-tag">MIDPOINT</span>
            </div>
            <CanvasGrid
              points={visibleCircle.length > 0 ? visibleCircle : points}
              currentIndex={Math.max(0, visibleCircle.length - 1)}
              lines={[visibleCircle]}
            />
            <StepControls
              currentStep={stepIndex}
              totalSteps={result?.points?.length ?? 1}
              playKey={result}
              onPrev={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setStepIndex((prev) => Math.min((result?.points?.length ?? 1) - 1, prev + 1))}
              onReset={() => setStepIndex(0)}
            />
          </section>

          <AlgorithmTable
            columns={[{ key: 'step', label: 'Step' }, { key: 'x', label: 'X' }, { key: 'y', label: 'Y' }, { key: 'decision', label: 'Decision' }]}
            rows={tableRows}
          />
        </div>
      </div>
    </div>
  );
}
