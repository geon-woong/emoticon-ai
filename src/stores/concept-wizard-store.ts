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
  { id: 'job', label: '직업', mode: 'multi' },
  { id: 'relationship', label: '관계', mode: 'multi' },
  { id: 'hobby', label: '취미', mode: 'multi' },
  { id: 'sport', label: '운동', mode: 'multi' },
  { id: 'speech-style', label: '말투', mode: 'single' },
];

const initialSelection: WizardSelection = {
  age: null,
  gender: null,
  personalities: [],
  jobs: [],
  relationships: [],
  hobbies: [],
  sports: [],
  speechStyle: null,
};

type SingleKey = 'age' | 'gender' | 'speechStyle';
type MultiKey = 'personalities' | 'jobs' | 'relationships' | 'hobbies' | 'sports';

interface ConceptWizardState {
  currentStep: number;
  selection: WizardSelection;
  setStep: (n: number) => void;
  next: () => void;
  prev: () => void;
  setSingle: <K extends SingleKey>(key: K, value: string) => void;
  toggleMulti: (key: MultiKey, id: string) => void;
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
      toggleMulti: (key, id) =>
        set((s) => {
          const arr = s.selection[key] as string[];
          if (arr.includes(id)) {
            return { selection: { ...s.selection, [key]: arr.filter((x) => x !== id) } };
          }
          if (arr.length >= 3) return s;
          return { selection: { ...s.selection, [key]: [...arr, id] } };
        }),
      reset: () => set({ currentStep: 0, selection: initialSelection }),
    }),
    {
      name: 'emoticon-ai/concept-wizard-v3',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? sessionStorage : (undefined as unknown as Storage)
      ),
    }
  )
);
