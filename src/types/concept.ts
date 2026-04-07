export type WizardStepId =
  | 'age'
  | 'gender'
  | 'personality'
  | 'job'
  | 'relationship'
  | 'hobby'
  | 'sport';

export type SubjectKey = 'job' | 'relationship' | 'hobby' | 'sport';

export interface KeywordItem {
  id: string;
  label: string;
  modifiers?: string[];
  tone?: 'active' | 'calm';
}

export interface ModifierPools {
  skillLevel: string[];
  intensity: string[];
  context: string[];
}

export interface WizardSelection {
  age: string | null;
  gender: string | null;
  personalities: string[];
  job: string | null;
  relationship: string | null;
  hobby: string | null;
  sport: string | null;
}

export interface ConceptSuggestion {
  id: string;
  subject: SubjectKey;
  text: string;
  parts: {
    personalityLabel?: string;
    modifier?: string;
    subjectLabel: string;
  };
  source: 'rule' | 'llm';
}

export interface RecommendResult {
  bySubject: Partial<Record<SubjectKey, ConceptSuggestion[]>>;
}

export const SUBJECT_LABELS: Record<SubjectKey, string> = {
  job: '직업',
  relationship: '관계',
  hobby: '취미',
  sport: '운동',
};
