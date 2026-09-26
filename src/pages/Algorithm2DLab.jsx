import { useState } from 'react';
import LineDrawing from './LineDrawing.jsx';
import CircleDrawing from './CircleDrawing.jsx';
import Transformations from './Transformations.jsx';
import Clipping from './Clipping.jsx';

const concepts = [
  { id: 'line', label: 'Line rasterization', detail: 'DDA · Bresenham', Component: LineDrawing },
  { id: 'circle', label: 'Circle rasterization', detail: 'Midpoint circle', Component: CircleDrawing },
  { id: 'transform', label: '2D transformations', detail: 'Translation · scale · rotate', Component: Transformations },
  { id: 'clip', label: 'Line clipping', detail: 'Cohen–Sutherland', Component: Clipping },
];

export default function Algorithm2DLab({ onBackTo3D }) {
  const [activeId, setActiveId] = useState('line');
  const activeConcept = concepts.find((concept) => concept.id === activeId) || concepts[0];
  const ActivePage = activeConcept.Component;

  return (
    <div className="two-d-lab">
      <header className="two-d-header">
        <div className="two-d-brand">
          <div className="two-d-logo">CG</div>
          <div><span>COMPUTER GRAPHICS · WORKBENCH</span><strong>2D Algorithm Lab</strong></div>
        </div>
        <div className="two-d-header-actions">
          <div className="two-d-mode-pill"><span className="mode-indicator" />2D CALCULATIONS</div>
          <button type="button" className="switch-3d-button" onClick={onBackTo3D}><span aria-hidden="true">◇</span> Return to 3D Studio</button>
        </div>
      </header>

      <nav className="two-d-concept-nav" aria-label="2D algorithm concepts">
        {concepts.map(({ id, label, detail }) => (
          <button
            type="button"
            key={id}
            className={activeId === id ? 'two-d-concept active' : 'two-d-concept'}
            onClick={() => setActiveId(id)}
            aria-current={activeId === id ? 'page' : undefined}
          >
            <span className="concept-mark" aria-hidden="true">{label === 'Line rasterization' ? '╱' : label === 'Circle rasterization' ? '◉' : label === '2D transformations' ? '↗' : '⌗'}</span>
            <span className="concept-copy"><strong>{label}</strong><small>{detail}</small></span>
          </button>
        ))}
      </nav>

      <main className="two-d-content">
        <div className="two-d-intro">
          <div><p className="two-d-eyebrow">2D COMPUTER GRAPHICS</p><h1>{activeConcept.label}</h1><p>Adjust inputs, run the algorithm, and inspect every calculation step.</p></div>
          <span className="two-d-coordinate-badge">XY PLANE</span>
        </div>
        <ActivePage key={activeId} />
      </main>
    </div>
  );
}
