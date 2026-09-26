import { useMemo, useState } from 'react';
import CanvasGrid from '../components/CanvasGrid.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import StepControls from '../components/StepControls.jsx';
import CalculationPanel from '../components/CalculationPanel.jsx';
import AlgorithmTable from '../components/AlgorithmTable.jsx';
import { generateDDA } from '../algorithms/dda.js';
import { generateBresenham } from '../algorithms/bresenham.js';

const inputDefaults = { x1: 0, y1: 0, x2: 8, y2: 5 };

export default function LineDrawing() {
  const [selectedAlgo, setSelectedAlgo] = useState('dda');
  const [form, setForm] = useState(inputDefaults);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const computedPoints = useMemo(() => {
    if (!result) return [];
    return result.points.map((point) => ({ x: point.plotX, y: point.plotY }));
  }, [result]);

  const visibleLine = useMemo(() => computedPoints.slice(0, stepIndex + 1), [computedPoints, stepIndex]);

  const runAlgorithm = () => {
    const payload = {
      x1: Number(form.x1),
      y1: Number(form.y1),
      x2: Number(form.x2),
      y2: Number(form.y2),
    };

    const data = selectedAlgo === 'dda'
      ? generateDDA(payload.x1, payload.y1, payload.x2, payload.y2)
      : generateBresenham(payload.x1, payload.y1, payload.x2, payload.y2);

    setResult(data);
    setStepIndex(0);
  };

  const moveEndpoint = (id, x, y) => {
    const endpoint = id === 'start' ? ['x1', 'y1'] : ['x2', 'y2'];
    const nextForm = { ...form, [endpoint[0]]: x, [endpoint[1]]: y };
    setForm(nextForm);
    const data = selectedAlgo === 'dda'
      ? generateDDA(Number(nextForm.x1), Number(nextForm.y1), Number(nextForm.x2), Number(nextForm.y2))
      : generateBresenham(Number(nextForm.x1), Number(nextForm.y1), Number(nextForm.x2), Number(nextForm.y2));
    setResult(data);
    setStepIndex(0);
  };

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const stepData = result?.points?.[stepIndex] ?? null;

  const tableRows = result?.points?.map((item) => ({
    key: `${item.step}-${item.x}-${item.y}`,
    step: item.step,
    x: item.x,
    y: item.y,
    'plot x': item.plotX ?? item.x,
    'plot y': item.plotY ?? item.y,
  })) ?? [];

  const columns = [
    { key: 'step', label: 'Step' },
    { key: 'x', label: 'X' },
    { key: 'y', label: 'Y' },
    { key: 'plot x', label: 'Plot X' },
    { key: 'plot y', label: 'Plot Y' },
  ];

  return (
    <div className="page algorithm-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Rendering Algorithms</p>
          <h1>Line Drawing</h1>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel
            title="Algorithm Inputs"
            actions={
              <button type="button" className="primary-btn" onClick={runAlgorithm}>Run</button>
            }
          >
            <label>
              <span>Algorithm</span>
              <select value={selectedAlgo} onChange={(e) => setSelectedAlgo(e.target.value)}>
                <option value="dda">DDA</option>
                <option value="bresenham">Bresenham</option>
              </select>
            </label>

            <label>
              <span>X1</span>
              <input type="number" value={form.x1} onChange={(e) => updateField('x1', e.target.value)} />
            </label>
            <label>
              <span>Y1</span>
              <input type="number" value={form.y1} onChange={(e) => updateField('y1', e.target.value)} />
            </label>
            <label>
              <span>X2</span>
              <input type="number" value={form.x2} onChange={(e) => updateField('x2', e.target.value)} />
            </label>
            <label>
              <span>Y2</span>
              <input type="number" value={form.y2} onChange={(e) => updateField('y2', e.target.value)} />
            </label>
          </ControlPanel>

          <CalculationPanel
            title="Current Calculation"
            formula={selectedAlgo === 'dda' ? 'x = x + dx / steps, y = y + dy / steps' : 'error = dx - dy, update x/y by decision parameter'}
            values={
              stepData
                ? [
                    { label: 'Step', value: stepData.step },
                    { label: 'X', value: stepData.x ?? '-' },
                    { label: 'Y', value: stepData.y ?? '-' },
                    { label: 'Error', value: stepData.error ?? '—' },
                  ]
                : [
                    { label: 'Step', value: '—' },
                    { label: 'X', value: '—' },
                    { label: 'Y', value: '—' },
                    { label: 'Error', value: '—' },
                  ]
            }
          />
        </div>

        <div className="right-column">
          <section className="panel canvas-panel">
            <div className="panel-header-row">
              <h3>Visualization</h3>
              <span className="small-tag">2D · {selectedAlgo.toUpperCase()}</span>
            </div>
            <CanvasGrid
              points={computedPoints}
              currentIndex={Math.max(0, stepIndex)}
              lines={[visibleLine]}
              handles={[
                { id: 'start', x: Number(form.x1), y: Number(form.y1) },
                { id: 'end', x: Number(form.x2), y: Number(form.y2) },
              ]}
              onHandleChange={moveEndpoint}
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

          <AlgorithmTable columns={columns} rows={tableRows} />
        </div>
      </div>
    </div>
  );
}
