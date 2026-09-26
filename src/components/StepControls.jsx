import { useEffect, useState } from 'react';

export default function StepControls({ currentStep, totalSteps, onPrev, onNext, onReset, onComplete, onClear, playKey }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(450);

  useEffect(() => {
    if (playKey == null) return undefined;
    const timer = window.setTimeout(() => setIsPlaying(true), 0);
    return () => window.clearTimeout(timer);
  }, [playKey]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (currentStep >= totalSteps - 1) {
      const timer = window.setTimeout(() => setIsPlaying(false), 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(onNext, speed);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps, onNext, speed]);

  const togglePlayback = () => {
    if (currentStep >= totalSteps - 1) onReset();
    setIsPlaying((playing) => !playing);
  };

  return (
    <div className="step-controls">
      <button type="button" onClick={() => { setIsPlaying(false); onReset(); }}>Reset</button>
      <button type="button" onClick={() => { setIsPlaying(false); onPrev(); }} disabled={currentStep === 0}>Prev</button>
      <button type="button" onClick={togglePlayback}>{isPlaying ? 'Pause' : currentStep >= totalSteps - 1 ? 'Replay' : 'Play'}</button>
      <button type="button" onClick={() => { setIsPlaying(false); onNext(); }} disabled={currentStep >= totalSteps - 1}>Next</button>
      {onComplete && <button type="button" onClick={() => { setIsPlaying(false); onComplete(); }} disabled={currentStep >= totalSteps - 1}>Complete</button>}
      {onClear && <button type="button" onClick={() => { setIsPlaying(false); onClear(); }}>Clear</button>}
      <label className="step-speed-control"><span>Speed</span><select value={speed} onChange={(event) => setSpeed(Number(event.target.value))}><option value="850">Slow</option><option value="450">Normal</option><option value="180">Fast</option></select></label>
      <span>
        Step {Math.min(currentStep + 1, totalSteps)} / {totalSteps}
      </span>
    </div>
  );
}
