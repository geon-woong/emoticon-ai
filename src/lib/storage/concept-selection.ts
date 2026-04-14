import type { WizardSelection } from '@/types/concept';

const LS_KEY = 'emoticon-ai/concept-selection';

export function saveConceptSelection(selection: WizardSelection): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(selection));
  } catch {
    // localStorage 접근 불가 환경 무시
  }
}

export function loadConceptSelection(): WizardSelection | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardSelection;
  } catch {
    return null;
  }
}
