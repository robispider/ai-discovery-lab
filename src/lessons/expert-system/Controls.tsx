import { useT } from '../../i18n';
import { useLab } from '../../store/useLab';
import { Presets, ResetButton } from '../kit';
import { TRICKY, useExpert } from './store';

export function ExpertControls() {
  const { bi, num } = useT();
  const setStep = useLab((s) => s.setStep);
  const rules = useExpert((s) => s.rules.length);
  const { setText, reset } = useExpert.getState();
  const jump = (i: number) => () => {
    setText(TRICKY[i].text);
    setStep('break');
  };
  return (
    <>
      <p className="try-note muted">
        {bi(
          `The knowledge base has ${rules} rules. Edit them in step 3.`,
          `জ্ঞানভান্ডারে ${num(rules)}টি নিয়ম আছে। ধাপ ৩-এ বদলান।`,
        )}
      </p>
      <Presets
        items={[
          { label: bi('Street light says “road”', 'সড়কবাতিতে “রাস্তা”'), onPick: jump(0), brk: true },
          { label: bi('Smell, no keyword', 'দুর্গন্ধ, কীওয়ার্ড নেই'), onPick: jump(2), brk: true },
          { label: bi('Banglish spelling', 'ইংরেজি হরফে বাংলা'), onPick: jump(3), brk: true },
        ]}
      />
      <div className="lab-row">
        <button type="button" className="btn ghost" onClick={() => setStep('train')}>
          ✎ {bi('Edit the rules', 'নিয়ম বদলান')}
        </button>
        <ResetButton onReset={reset} />
      </div>
    </>
  );
}
