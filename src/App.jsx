import { useState } from 'react';
import './index.css';
import Algorithm2DLab from './pages/Algorithm2DLab.jsx';
import SceneLab from './pages/SceneLab.jsx';

export default function App() {
  const [show2D, setShow2D] = useState(false);
  return show2D
    ? <Algorithm2DLab onBackTo3D={() => setShow2D(false)} />
    : <SceneLab onShow2D={() => setShow2D(true)} />;
}