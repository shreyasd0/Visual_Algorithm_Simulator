const modules = [
  {
    id: 'line',
    title: 'Line Drawing',
    description: 'DDA and Bresenham algorithms for plotting a line from one point to another.',
    steps: 3,
    accent: 'purple',
  },
  {
    id: 'circle',
    title: 'Circle Drawing',
    description: 'Midpoint circle algorithm using decision parameters for precise rasterization.',
    steps: 4,
    accent: 'cyan',
  },
  {
    id: 'transformations',
    title: '2D Transformations',
    description: 'Translation, scaling, rotation, and pivot-based transform operations.',
    steps: 5,
    accent: 'green',
  },
  {
    id: 'clipping',
    title: 'Clipping',
    description: 'Cohen-Sutherland line clipping against a rectangular window.',
    steps: 4,
    accent: 'amber',
  },
  {
    id: 'filling',
    title: 'Filling Algorithms',
    description: 'Flood-fill to fill regions with connected pixels of the same color.',
    steps: 5,
    accent: 'rose',
  },
];

export default function Dashboard({ onSelect }) {
  return (
    <div className="page dashboard-page">
      <header className="hero-header">
        <div>
          <p className="eyebrow">Computer Graphics Lab</p>
          <h1>CG VisualLab</h1>
        </div>
        <span className="hero-badge">3D Interactive Algorithm Simulator</span>
      </header>

      <div className="module-grid">
        {modules.map((module) => (
          <article key={module.id} className={`module-card ${module.accent}`}>
            <div className="module-icon">{module.title.charAt(0)}</div>
            <div className="module-copy">
              <h2>{module.title}</h2>
              <p>{module.description}</p>
            </div>
            <div className="module-meta">
              <span>{module.steps} visual steps</span>
              <button type="button" onClick={() => onSelect(module.id)}>
                Open
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
