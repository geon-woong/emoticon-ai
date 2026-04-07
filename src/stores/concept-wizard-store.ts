import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { WizardSelection, WizardStepId } from '@/types/concept';

export const WIZARD_STEPS: ReadonlyArray<{
  id: WizardStepId;
  label: string;
  mode: 'single' | 'multi';
}> = [
  { id: 'age', label: '나이', mode: 'single' },
  { id: 'gender', label: '성별', mode: 'single' },
  { id: 'personality', label: '성격', mode: 'multi' },
  { id: 'job', label: '직업', mode: 'single' },
  { id: 'relationship', label: '관계', mode: 'single' },
  { id: 'hobby', label: '취미', mode: 'single' },
  { id: 'sport', label: '운동', mode: 'single' },
];

const initialSelection: WizardSelection = {
  age: null,
  gender: null,
  personalities: [],
  job: null,
  relationship: null,
  hobby: null,
  sport: null,
};

type SingleKey = Exclude<keyof WizardSelection, 'personalities'>;

interface ConceptWizardState {
  currentStep: number;
  selection: WizardSelection;
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  setSingle: <K extends SingleKey>(key: K, value: WizardSelection[K]) => void;
  togglePersonality: (id: string) => void;
  reset: () => void;
}

export const useConceptWizardStore = create<ConceptWizardState>()(
  persist(
    (set) => ({
      currentStep: 0,
      selection: initialSelection,
      setStep: (n) => set({ currentStep: n }),
      next: () =>
        set((s) => ({ currentStep: Math.min(s.currentStep + 1, WIZARD_STEPS.length - 1) })),
      prev: () =>
        set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
      setSingle: (key, value) =>
        set((s) => ({ selection: { ...s.selection, [key]: value } })),
      togglePersonality: (id) =>
        set((s) => {
          const has = s.selection.personalities.includes(id);
          return {
            selection: {
              ...s.selection,
              personalities: has
                ? s.selection.personalities.filter((p) => p !== id)
                : [...s.selection.personalities, id],
            },
          };
        }),
      reset: () => set({ currentStep: 0, selection: initialSelection }),
    }),
    {
      name: 'emoticon-ai/concept-wizard',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : (undefined as unknown as Storage)
      ),
    }
  )
);
