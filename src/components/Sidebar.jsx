import { FaChartLine, FaCircle, FaCropAlt, FaFillDrip, FaVectorSquare } from 'react-icons/fa';

const items = [
  { id: 'line', label: 'Line Drawing', icon: FaChartLine },
  { id: 'circle', label: 'Circle Drawing', icon: FaCircle },
  { id: 'transformations', label: '2D Transformations', icon: FaVectorSquare },
  { id: 'clipping', label: 'Clipping', icon: FaCropAlt },
  { id: 'filling', label: 'Filling Algorithms', icon: FaFillDrip },
];

export default function Sidebar({ activePage, onSelect }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-mark">3D</div>
        <div>
          <h2>VisualLab</h2>
          <p>3D Algorithms</p>
        </div>
      </div>

      <nav className="nav-list">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={activePage === id ? 'nav-item active' : 'nav-item'}
            onClick={() => onSelect(id)}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}
