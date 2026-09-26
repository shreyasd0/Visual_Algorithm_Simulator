import { useMemo, useState } from 'react';
import CanvasGrid from '../components/CanvasGrid.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import StepControls from '../components/StepControls.jsx';
import CalculationPanel from '../components/CalculationPanel.jsx';
import AlgorithmTable from '../components/AlgorithmTable.jsx';
import { generateDDA } from '../algorithms/dda.js';
import { generateBresenham } from '../algorithms/bresenham.js';

const inputDefaults = { x1: 0, y1: 0, x2: 8, y2: 5 };
const format = (value) => Number(value).toFixed(4).replace(/\.?0+$/, '');

export default function LineDrawing() {
  const [selectedAlgo, setSelectedAlgo] = useState('dda');
  const [form, setForm] = useState(inputDefaults);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const computedPoints = useMemo(() => result?.points.map((point) => ({ x: point.plotX ?? point.x, y: point.plotY ?? point.y })) ?? [], [result]);
  const visibleLine = computedPoints.slice(0, stepIndex + 1);
  const stepData = result?.points?.[stepIndex] ?? null;
  const lastStep = Math.max(0, (result?.points?.length ?? 1) - 1);
  const updateField = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  const calculate = (values = form, algorithm = selectedAlgo) => {
    const coordinates = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, Number(value)]));
    if (Object.values(coordinates).some((value) => !Number.isFinite(value) || Math.abs(value) > 1000)) {
      setErrorMessage('Enter finite coordinates between −1000 and 1000.');
      return false;
    }
    try {
      const data = algorithm === 'dda'
        ? generateDDA(coordinates.x1, coordinates.y1, coordinates.x2, coordinates.y2)
        : generateBresenham(coordinates.x1, coordinates.y1, coordinates.x2, coordinates.y2);
      setResult(data);
      setStepIndex(0);
      setErrorMessage('');
      return true;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to calculate this line.');
      return false;
    }
  };

  const moveEndpoint = (id, x, y) => {
    const endpoint = id === 'start' ? ['x1', 'y1'] : ['x2', 'y2'];
    const nextForm = { ...form, [endpoint[0]]: x, [endpoint[1]]: y };
    setForm(nextForm);
    calculate(nextForm);
  };

  const tableRows = result?.points.map((point) => ({
    key: `${point.step}-${point.x}-${point.y}`,
    step: point.step,
    x: selectedAlgo === 'dda' ? format(point.x) : point.x,
    y: selectedAlgo === 'dda' ? format(point.y) : point.y,
    'plot x': point.plotX ?? point.x,
    'plot y': point.plotY ?? point.y,
    [selectedAlgo === 'dda' ? 'increment' : 'decision']: selectedAlgo === 'dda'
      ? `${format(point.nextX)}, ${format(point.nextY)}`
      : `${point.error} → ${point.nextError}`,
  })) ?? [];

  const columns = [
    { key: 'step', label: 'Step' }, { key: 'x', label: selectedAlgo === 'dda' ? 'Calculated X' : 'X' },
    { key: 'y', label: selectedAlgo === 'dda' ? 'Calculated Y' : 'Y' },
    { key: 'plot x', label: 'Pixel X' }, { key: 'plot y', label: 'Pixel Y' },
    { key: selectedAlgo === 'dda' ? 'increment' : 'decision', label: selectedAlgo === 'dda' ? 'Next sample (x,y)' : 'Error → next error' },
  ];

  const values = !stepData ? [
    { label: 'Step', value: '—' }, { label: 'Calculated x', value: '—' },
    { label: 'Calculated y', value: '—' }, { label: 'Pixel plotted', value: '—' },
  ] : selectedAlgo === 'dda' ? [
    { label: 'Step', value: `${stepData.step} / ${result.points.length}` },
    { label: 'Calculated x', value: format(stepData.x) },
    { label: 'Calculated y', value: format(stepData.y) },
    { label: 'Rounded X', value: stepData.plotX },
    { label: 'Rounded Y', value: stepData.plotY },
    { label: 'Pixel plotted', value: `(${stepData.plotX}, ${stepData.plotY})` },
  ] : [
    { label: 'Step', value: `${stepData.step} / ${result.points.length}` },
    { label: 'X', value: stepData.x }, { label: 'Y', value: stepData.y },
    { label: 'Decision/error', value: stepData.error },
    { label: 'Next decision', value: stepData.nextError },
    { label: 'Next pixel', value: `(${stepData.nextX}, ${stepData.nextY})` },
  ];

  return (
    <div className="page algorithm-page">
      <header className="page-header"><div><p className="eyebrow">Rasterization · XY plane</p><h1>Line Drawing</h1></div><span className="small-tag">{selectedAlgo.toUpperCase()} · O(max(|dx|, |dy|))</span></header>
      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel title="Line endpoints" actions={<button type="button" className="primary-btn" onClick={() => calculate()}>Run</button>}>
            <label><span>Algorithm</span><select value={selectedAlgo} onChange={(event) => { setSelectedAlgo(event.target.value); setResult(null); setStepIndex(0); setErrorMessage(''); }}><option value="dda">DDA</option><option value="bresenham">Bresenham</option></select></label>
            <label><span>X₁</span><input type="number" value={form.x1} onChange={(event) => updateField('x1', event.target.value)} /></label>
            <label><span>Y₁</span><input type="number" value={form.y1} onChange={(event) => updateField('y1', event.target.value)} /></label>
            <label><span>X₂</span><input type="number" value={form.x2} onChange={(event) => updateField('x2', event.target.value)} /></label>
            <label><span>Y₂</span><input type="number" value={form.y2} onChange={(event) => updateField('y2', event.target.value)} /></label>
            {selectedAlgo === 'bresenham' && <p className="complexity-note">Bresenham rounds entered endpoints to integer pixel coordinates.</p>}
            {errorMessage && <p className="validation-message" role="alert">{errorMessage}</p>}
          </ControlPanel>

          <CalculationPanel title={selectedAlgo === 'dda' ? 'Calculated point and plotted pixel' : 'Bresenham decision state'} formula={selectedAlgo === 'dda' ? 'xₖ = xₖ₋₁ + dx/steps; yₖ = yₖ₋₁ + dy/steps; pixel = (round(xₖ), round(yₖ))' : 'e₂ = 2e; update X if e₂ > −dy and Y if e₂ < dx'} values={values} />
          {selectedAlgo === 'dda' && result && <CalculationPanel title="DDA increments" formula="steps = max(|dx|, |dy|); xIncrement = dx/steps; yIncrement = dy/steps" values={[
            { label: 'dx', value: result.dx }, { label: 'dy', value: result.dy },
            { label: 'steps', value: result.stepsCount }, { label: 'xIncrement', value: format(result.xIncrement) },
            { label: 'yIncrement', value: format(result.yIncrement) }, { label: 'Total plotted pixels', value: result.points.length },
          ]} />}
          <section className="panel algorithm-explanation"><div className="panel-header-row"><h3>Algorithm steps</h3><span className="small-tag">O(max(|dx|, |dy|))</span></div>
            <ol>{selectedAlgo === 'dda' ? <><li>Compute dx = x₂ − x₁ and dy = y₂ − y₁.</li><li>Set steps = max(|dx|, |dy|).</li><li>Divide dx and dy by steps to get x/y increments.</li><li>Plot the rounded sample, then add each increment.</li></> : <><li>Round endpoints to integer grid coordinates and compute dx, dy.</li><li>Initialize e = dx − dy and signed axis directions.</li><li>Use doubled error tests to select the next x/y pixel.</li><li>Repeat until the endpoint pixel is plotted.</li></>}</ol>
          </section>
        </div>

        <div className="right-column">
          <section className="panel canvas-panel"><div className="panel-header-row"><h3>2D rasterization</h3><span className="small-tag">{selectedAlgo.toUpperCase()}</span></div>
            <CanvasGrid points={computedPoints} currentIndex={stepIndex} lines={[visibleLine]} handles={[{ id: 'start', x: Number(form.x1), y: Number(form.y1) }, { id: 'end', x: Number(form.x2), y: Number(form.y2) }]} onHandleChange={moveEndpoint} />
            <StepControls currentStep={stepIndex} totalSteps={result?.points?.length ?? 1} playKey={result}
              onPrev={() => setStepIndex((previous) => Math.max(0, previous - 1))}
              onNext={() => setStepIndex((previous) => Math.min(lastStep, previous + 1))}
              onComplete={() => setStepIndex(lastStep)}
              onClear={() => { setResult(null); setStepIndex(0); setErrorMessage(''); }}
              onReset={() => setStepIndex(0)} />
          </section>
          <AlgorithmTable columns={columns} rows={tableRows} />
          <section className="panel comparison-panel"><div className="panel-header-row"><h3>DDA vs Bresenham</h3><span className="small-tag">THEORETICAL PROPERTIES</span></div>
            <div className="table-wrap"><table className="algorithm-table"><thead><tr><th>Property</th><th>DDA</th><th>Bresenham</th></tr></thead><tbody>
              <tr><td>Arithmetic</td><td>Floating-point increments</td><td>Integer error/decision updates</td></tr>
              <tr><td>Pixel plotting</td><td>Round calculated coordinates</td><td>Integer pixel coordinates</td></tr>
              <tr><td>Iteration count</td><td>max(|dx|, |dy|) + 1</td><td>max(|dx|, |dy|) + 1</td></tr>
              <tr><td>Complexity</td><td>O(max(|dx|, |dy|))</td><td>O(max(|dx|, |dy|))</td></tr>
            </tbody></table></div><p className="complexity-note">These are theoretical properties; no runtime superiority is claimed without measurement.</p>
          </section>
        </div>
      </div>
    </div>
  );
}