import { useMemo, useState } from 'react';
import CanvasGrid from '../components/CanvasGrid.jsx';
import ControlPanel from '../components/ControlPanel.jsx';
import StepControls from '../components/StepControls.jsx';
import CalculationPanel from '../components/CalculationPanel.jsx';
import AlgorithmTable from '../components/AlgorithmTable.jsx';
import { floodFillGrid } from '../algorithms/floodFill.js';

const initialGrid = [
  [0, 0, 0, 0, 0, 0],
  [0, 1, 1, 1, 1, 0],
  [0, 1, 0, 0, 1, 0],
  [0, 1, 0, 0, 1, 0],
  [0, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0],
];

export default function Filling() {
  const [start, setStart] = useState({ row: 2, col: 2 });
  const [newColor, setNewColor] = useState(2);
  const [result, setResult] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);

  const points = useMemo(() => {
    if (!result) return [];
    return result.steps.map((step) => ({ x: step.col, y: step.row }));
  }, [result]);

  const filledCells = useMemo(() => {
    return initialGrid.flatMap((row, rowIndex) =>
      row.map((cell, colIndex) => ({
        x: colIndex,
        y: rowIndex,
        color: result?.steps?.some((step, index) =>
          step.row === rowIndex && step.col === colIndex && index <= stepIndex,
        )
          ? '#fb7185'
          : cell === 0 ? '#0f172a' : '#334155',
      })),
    );
  }, [result, stepIndex]);

  const runAlgorithm = () => {
    const workingGrid = initialGrid.map((row) => [...row]);
    const data = floodFillGrid(workingGrid, Number(start.row), Number(start.col), Number(newColor), 0);
    setResult(data);
    setStepIndex(0);
  };

  const currentStep = result?.steps?.[stepIndex] ?? null;

  return (
    <div className="page algorithm-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Area Filling</p>
          <h1>Flood Fill</h1>
        </div>
      </header>

      <div className="workspace-grid">
        <div className="left-column">
          <ControlPanel
            title="Fill Region"
            actions={<button type="button" className="primary-btn" onClick={runAlgorithm}>Fill</button>}
          >
            <label><span>Start Row</span><input type="number" value={start.row} onChange={(e) => setStart((prev) => ({ ...prev, row: e.target.value }))} /></label>
            <label><span>Start Col</span><input type="number" value={start.col} onChange={(e) => setStart((prev) => ({ ...prev, col: e.target.value }))} /></label>
            <label><span>New Color</span><input type="number" value={newColor} onChange={(e) => setNewColor(e.target.value)} /></label>
          </ControlPanel>

          <CalculationPanel
            title="Active Pixel"
            formula="If pixel matches target color, push neighbors and repaint it."
            values={
              currentStep
                ? [
                    { label: 'Step', value: currentStep.step },
                    { label: 'Row', value: currentStep.row },
                    { label: 'Col', value: currentStep.col },
                    { label: 'Color', value: currentStep.color },
                  ]
                : [
                    { label: 'Step', value: '—' },
                    { label: 'Row', value: '—' },
                    { label: 'Col', value: '—' },
                    { label: 'Color', value: '—' },
                  ]
            }
          />
        </div>

        <div className="right-column">
          <section className="panel canvas-panel">
            <div className="panel-header-row">
              <h3>Visualization</h3>
              <span className="small-tag">STACK-FILL</span>
            </div>
            <CanvasGrid
              points={points}
              currentIndex={Math.max(0, stepIndex)}
              activeColor="#fb7185"
              cells={filledCells}
            />
            <StepControls
              currentStep={stepIndex}
              totalSteps={Math.max(1, result?.steps?.length ?? 1)}
              playKey={result}
              onPrev={() => setStepIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setStepIndex((prev) => Math.min(Math.max(0, (result?.steps?.length ?? 1) - 1), prev + 1))}
              onReset={() => setStepIndex(0)}
            />
          </section>

          <AlgorithmTable
            columns={[{ key: 'step', label: 'Step' }, { key: 'row', label: 'Row' }, { key: 'col', label: 'Col' }, { key: 'color', label: 'Color' }]}
            rows={result?.steps?.map((item) => ({ step: item.step, row: item.row, col: item.col, color: item.color })) ?? []}
          />
        </div>
      </div>
    </div>
  );
}
