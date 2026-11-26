import { useLayoutEffect, useRef, useState } from 'react';
import { INITIAL_WEIGHT } from '../../engines/neural';
import { useLab } from '../../store/useLab';
import { NeuronCalculator } from './Calculator';
import { DotPuzzle } from './DotPuzzle';
import { StreetChallenge } from './StreetChallenge';
import { NewExample, TrainingExamples, type TrainingState } from './Training';
import './neural.css';
import './neuron-art.css';

export function NeuralStage() {
  const step = useLab((s) => s.step);
  const [training, setTraining] = useState<TrainingState>({ weight: INITIAL_WEIGHT, last: null });
  const stage = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const viewport = stage.current?.parentElement;
    if (viewport) viewport.scrollTop = 0;
  }, [step]);

  return (
    <div className="lab-view neural-stage" ref={stage}>
      {step === 'understand' && <NeuronCalculator />}
      {(step === 'explore' || step === 'train') && (
        <TrainingExamples training={training} onChange={setTraining} train={step === 'train'} />
      )}
      {step === 'evaluate' && <NewExample weight={training.weight} />}
      {step === 'break' && <StreetChallenge />}
      {step === 'apply' && <DotPuzzle />}
    </div>
  );
}
