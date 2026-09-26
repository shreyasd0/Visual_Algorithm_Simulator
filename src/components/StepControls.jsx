import { useEffect, useState } from 'react';

export default function StepControls({ currentStep, totalSteps, onPrev, onNext, onReset, playKey }) {
  const [isPlaying, setIsPlaying] = useState(false);

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
    const timer = window.setTimeout(onNext, 450);
    return () => window.clearTimeout(timer);
  }, [isPlaying, currentStep, totalSteps, onNext]);

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
      <span>
        Step {Math.min(currentStep + 1, totalSteps)} / {totalSteps}
      </span>
    </div>
  );
}
