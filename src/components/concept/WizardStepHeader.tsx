import { ProgressBar } from '@/components/ui/ProgressBar';

interface Props {
  stepIndex: number;
  totalSteps: number;
  label: string;
  description?: string;
}

export function WizardStepHeader({ stepIndex, totalSteps, label, description }: Props) {
  const percent = ((stepIndex + 1) / totalSteps) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm text-brand-muted">
        <span>
          STEP {stepIndex + 1} / {totalSteps}
        </span>
        <span className="font-bold text-brand-text">{label}</span>
      </div>
      <ProgressBar value={percent} />
      {description && (
        <p className="pt-2 text-center text-lg font-bold text-brand-text">
          {description}
        </p>
      )}
    </div>
  );
}
