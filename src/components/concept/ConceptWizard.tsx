'use client';

import { useRouter } from 'next/navigation';
import { useConceptWizardStore, WIZARD_STEPS } from '@/stores/concept-wizard-store';
import { KeywordGrid } from './KeywordGrid';
import { WizardStepHeader } from './WizardStepHeader';
import { WizardNav } from './WizardNav';
import type { KeywordItem, WizardSelection, WizardStepId } from '@/types/concept';

import ages from '@/data/keywords/ages.json';
import genders from '@/data/keywords/genders.json';
import personalities from '@/data/keywords/personalities.json';
import jobs from '@/data/keywords/jobs.json';
import relationships from '@/data/keywords/relationships.json';
import hobbies from '@/data/keywords/hobbies.json';
import sports from '@/data/keywords/sports.json';

const STEP_DATA: Record<WizardStepId, { items: KeywordItem[]; description: string }> = {
  age: { items: ages as KeywordItem[], description: '나이대를 골라주세요' },
  gender: { items: genders as KeywordItem[], description: '성별을 골라주세요' },
  personality: {
    items: personalities as KeywordItem[],
    description: '성격을 골라주세요 (여러 개 선택 가능)',
  },
  job: { items: jobs as KeywordItem[], description: '직업을 골라주세요' },
  relationship: { items: relationships as KeywordItem[], description: '관계를 골라주세요' },
  hobby: { items: hobbies as KeywordItem[], description: '취미를 골라주세요' },
  sport: { items: sports as KeywordItem[], description: '운동을 골라주세요' },
};

const SINGLE_KEY_MAP: Record<
  Exclude<WizardStepId, 'personality'>,
  Exclude<keyof WizardSelection, 'personalities'>
> = {
  age: 'age',
  gender: 'gender',
  job: 'job',
  relationship: 'relationship',
  hobby: 'hobby',
  sport: 'sport',
};

export function ConceptWizard() {
  const router = useRouter();
  const currentStep = useConceptWizardStore((s) => s.currentStep);
  const selection = useConceptWizardStore((s) => s.selection);
  const next = useConceptWizardStore((s) => s.next);
  const prev = useConceptWizardStore((s) => s.prev);
  const setSingle = useConceptWizardStore((s) => s.setSingle);
  const togglePersonality = useConceptWizardStore((s) => s.togglePersonality);

  const step = WIZARD_STEPS[currentStep];
  if (!step) return null;

  const stepData = STEP_DATA[step.id];
  const isPersonality = step.id === 'personality';
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  const selectedIds: string[] = isPersonality
    ? selection.personalities
    : (() => {
        const key = SINGLE_KEY_MAP[step.id as Exclude<WizardStepId, 'personality'>];
        const v = selection[key];
        return v ? [v] : [];
      })();

  const canGoNext = selectedIds.length > 0;

  const handleToggle = (id: string) => {
    if (isPersonality) {
      togglePersonality(id);
    } else {
      const key = SINGLE_KEY_MAP[step.id as Exclude<WizardStepId, 'personality'>];
      setSingle(key, id);
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      router.push('/concept/result');
    } else {
      next();
    }
  };

  return (
    <div className="space-y-8">
      <WizardStepHeader
        stepIndex={currentStep}
        totalSteps={WIZARD_STEPS.length}
        label={step.label}
        description={stepData.description}
      />
      <KeywordGrid
        items={stepData.items}
        mode={step.mode}
        selectedIds={selectedIds}
        onToggle={handleToggle}
      />
      <WizardNav
        canGoBack={currentStep > 0}
        canGoNext={canGoNext}
        isLastStep={isLastStep}
        onPrev={prev}
        onNext={handleNext}
      />
    </div>
  );
}
