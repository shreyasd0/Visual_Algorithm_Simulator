import { useState } from 'react';
import CanvasGrid from '../components/CanvasGrid.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import StepControls from '../components/StepControls.jsx';
import CalculationPanel from '../components/CalculationPanel.jsx';
import AlgorithmTable from '../components/AlgorithmTable.jsx';
import { clipCohenSutherland } from '../algorithms/cohenSutherland.js';

export default function Clipping() {
  const [form, setForm] = useState({ x1: 1, y1: 1, x2: 12, y2: 8, xmin: 4, ymin: 3, xmax: 9, ymax: 7 });
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const runAlgorithm = () => {
    const data = clipCohenSutherland(
      Number(form.x1),
      Number(form.y1),
      Number(form.x2),
      Number(form.y2),
      Number(form.xmin),
      Number(form.ymin),
      Number(form.xmax),
      Number(form.ymax),
    );
    setResult(data);
    setStepIndex(0);
    setErrorMessage('');
  };

  const runValidated = () => {
    try { runAlgorithm(); }
    catch (error) {
      setResult(null);
      setErrorMessage(error instanceof Error ? error.message : 'Enter valid line and window coordinates.');
    }
  };

  const tableRows = result?.steps?.map((item, index) => ({
    key: `step-${index}`,
    step: item.step,
    codeA: item.codeA,
    regionA: item.codeAName,
    codeB: item.codeB,
    regionB: item.codeBName,
    and: item.andCode,
    status: item.status,
    edge: item.edge ?? '—',
    calculation: item.calculation ?? item.decision,
  })) ?? [];

  const currentStep = result?.steps?.[stepIndex] ?? null;
  const points = [
    { x: Number(form.x1), y: Number(form.y1) },
    { x: Number(form.x2), y: Number(form.y2) },
    ...(result?.clipped ? [{ x: result.clipped.x1, y: result.clipped.y1 }, { x: result.clipped.x2, y: result.clipped.y2 }] : []),
  ];

  const clipWindow = [
    { x: Number(form.xmin), y: Number(form.ymin) },
    { x: Number(form.xmax), y: Number(form.ymin) },
    { x: Number(form.xmax), y: Number(form.ymax) },
    { x: Number(form.xmin), y: Number(form.ymax) },
  ];

  const linePath = currentStep
    ? [currentStep.a, currentStep.b]
    : [{ x: Number(form.x1), y: Number(form.y1) }, { x: Number(form.x2), y: Number(form.y2) }];

  return (
    <div className="page algorithm-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Windowing Algorithms</p>
          <h1>Clipping</h1>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel
            title="Clip Window"
            actions={<button type="button" className="primary-btn" onClick={runValidated}>Run clipping</button>}
          >
            <label><span>X1</span><input type="number" value={form.x1} onChange={(e) => setForm((prev) => ({ ...prev, x1: e.target.value }))} /></label>
            <label><span>Y1</span><input type="number" value={form.y1} onChange={(e) => setForm((prev) => ({ ...prev, y1: e.target.value }))} /></label>
            <label><span>X2</span><input type="number" value={form.x2} onChange={(e) => setForm((prev) => ({ ...prev, x2: e.target.value }))} /></label>
            <label><span>Y2</span><input type="number" value={form.y2} onChange={(e) => setForm((prev) => ({ ...prev, y2: e.target.value }))} /></label>
            <label><span>Xmin</span><input type="number" value={form.xmin} onChange={(e) => setForm((prev) => ({ ...prev, xmin: e.target.value }))} /></label>
            <label><span>Ymin</span><input type="number" value={form.ymin} onChange={(e) => setForm((prev) => ({ ...prev, ymin: e.target.value }))} /></label>
            <label><span>Xmax</span><input type="number" value={form.xmax} onChange={(e) => setForm((prev) => ({ ...prev, xmax: e.target.value }))} /></label>
            <label><span>Ymax</span><input type="number" value={form.ymax} onChange={(e) => setForm((prev) => ({ ...prev, ymax: e.target.value }))} /></label>
            {errorMessage && <p className="validation-message" role="alert">{errorMessage}</p>}
          </ControlPanel>

          <CalculationPanel
            title="Cohen–Sutherland decision"
            formula={currentStep?.decision ?? 'AND nonzero → reject; both codes zero → accept; otherwise intersect an outside endpoint with a boundary.'}
            values={
              currentStep
                ? [
                    { label: 'Step', value: currentStep.step },
                    { label: 'Code A', value: currentStep.codeA },
                    { label: 'Endpoint A region', value: currentStep.codeAName },
                    { label: 'Code B', value: currentStep.codeB },
                    { label: 'Endpoint B region', value: currentStep.codeBName },
                    { label: 'CodeA AND CodeB', value: `${currentStep.codeA} & ${currentStep.codeB} = ${currentStep.andCode}` },
                    { label: 'Status', value: currentStep.status },
                    { label: 'Boundary', value: currentStep.selectedBoundary ?? '—' },
                    { label: 'Updated endpoint', value: currentStep.updatedEndpoint ?? '—' },
                    { label: 'Intersection', value: currentStep.intersection ? `(${currentStep.intersection.x.toFixed(3)}, ${currentStep.intersection.y.toFixed(3)})` : '—' },
                    { label: 'New outcode', value: currentStep.newOutcode != null ? `${currentStep.newOutcode.toString(2).padStart(4, '0')} · ${currentStep.newOutcodeName}` : '—' },
                  ]
                : [
                    { label: 'Step', value: '—' },
                    { label: 'Code A', value: '—' },
                    { label: 'Code B', value: '—' },
                    { label: 'Status', value: '—' },
                  ]
            }
          />
        </div>

        <div className="right-column">
          <section className="panel canvas-panel">
            <div className="panel-header-row">
              <h3>Visualization</h3>
              <span className="small-tag">COHEN-SUTHERLAND</span>
            </div>
            <CanvasGrid
              points={points}
              currentIndex={Math.max(0, stepIndex)}
              activeColor="#fbbf24"
              polygons={[{ points: clipWindow, stroke: '#f8fafc', fill: 'rgba(148, 163, 184, 0.1)', lineWidth: 2 }]}
              lines={[linePath]}
            />
            <StepControls
              currentStep={stepIndex}
              totalSteps={Math.max(1, result?.steps?.length ?? 1)}
              playKey={result}
              onComplete={() => setStepIndex(Math.max(0, (result?.steps?.length ?? 1) - 1))}
              onClear={() => { setResult(null); setStepIndex(0); setErrorMessage(''); }}
              onPrev={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setStepIndex((prev) => Math.min(Math.max(0, (result?.steps?.length ?? 1) - 1), prev + 1))}
              onReset={() => setStepIndex(0)}
            />
          </section>

          <AlgorithmTable
            columns={[{ key: 'step', label: 'Iteration' }, { key: 'codeA', label: 'Code A' }, { key: 'regionA', label: 'A region' }, { key: 'codeB', label: 'Code B' }, { key: 'regionB', label: 'B region' }, { key: 'and', label: 'A AND B' }, { key: 'status', label: 'Decision' }, { key: 'edge', label: 'Boundary' }, { key: 'calculation', label: 'Intersection / decision' }]}
            rows={tableRows}
          />
          <section className="panel algorithm-explanation"><div className="panel-header-row"><h3>Region-code guide</h3><span className="small-tag">O(k) · k CLIPPING ITERATIONS</span></div><div className="region-code-grid"><span>TOP <strong>1000</strong></span><span>BOTTOM <strong>0100</strong></span><span>RIGHT <strong>0010</strong></span><span>LEFT <strong>0001</strong></span><span>INSIDE <strong>0000</strong></span></div><ol><li>Compute each endpoint's four-bit outcode.</li><li>Bitwise AND nonzero means trivial reject.</li><li>Two zero outcodes mean accept.</li><li>Otherwise intersect an outside endpoint with its indicated boundary and repeat.</li></ol></section>
        </div>
      </div>
    </div>
  );
}
