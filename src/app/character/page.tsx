'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { CharacterSubjectModal } from '@/components/character/CharacterSubjectModal';
import { useConceptWizardStore } from '@/stores/concept-wizard-store';
import { recommendConcepts, type RecommendData } from '@/lib/recommend/rule-based';
import { loadConceptSelection } from '@/lib/storage/concept-selection';
import type { ConceptSuggestion, WizardSelection } from '@/types/concept';

import ages from '@/data/keywords/ages.json';
import genders from '@/data/keywords/genders.json';
import personalities from '@/data/keywords/personalities.json';
import jobs from '@/data/keywords/jobs.json';
import relationships from '@/data/keywords/relationships.json';
import hobbies from '@/data/keywords/hobbies.json';
import sports from '@/data/keywords/sports.json';
import modifiers from '@/data/keywords/modifiers.json';
import speechStyles from '@/data/keywords/speech-styles.json';

const DATA: RecommendData = {
  personalities: personalities as RecommendData['personalities'],
  jobs: jobs as RecommendData['jobs'],
  relationships: relationships as RecommendData['relationships'],
  hobbies: hobbies as RecommendData['hobbies'],
  sports: sports as RecommendData['sports'],
  modifiers: modifiers as RecommendData['modifiers'],
};

const LABEL_MAPS = {
  age: new Map((ages as { id: string; label: string }[]).map((x) => [x.id, x.label])),
  gender: new Map((genders as { id: string; label: string }[]).map((x) => [x.id, x.label])),
  personality: new Map(
    (personalities as { id: string; label: string }[]).map((x) => [x.id, x.label])
  ),
  speechStyle: new Map(
    (speechStyles as { id: string; label: string }[]).map((x) => [x.id, x.label])
  ),
};

const LS_KEY = 'emoticon-ai/character-selected-concept';

function loadSavedConcept(): ConceptSuggestion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ConceptSuggestion;
  } catch {
    return null;
  }
}

function saveConcept(concept: ConceptSuggestion) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(concept));
  } catch {
    // localStorage 접근 불가 환경 무시
  }
}

function stableSeed(selection: unknown): number {
  const key = JSON.stringify(selection);
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function hasMinimumSelection(s: WizardSelection): boolean {
  return (
    s.personalities.length > 0 &&
    (!!s.job || !!s.relationship || s.hobbies.length > 0 || s.sports.length > 0)
  );
}

export default function CharacterPage() {
  const router = useRouter();
  const storeSelection = useConceptWizardStore((s) => s.selection);

  const [selectedConcept, setSelectedConcept] = useState<ConceptSuggestion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  // sessionStorage가 비었을 때 localStorage 폴백
  const [lsSelection, setLsSelection] = useState<WizardSelection | null>(null);

  // 클라이언트 마운트 후 localStorage 복원
  useEffect(() => {
    setHydrated(true);
    setLsSelection(loadConceptSelection());
    const saved = loadSavedConcept();
    if (saved) setSelectedConcept(saved);
  }, []);

  // sessionStorage 우선, 없으면 localStorage 폴백
  const selection = hasMinimumSelection(storeSelection) ? storeSelection : (lsSelection ?? storeSelection);
  const hasMinimum = hasMinimumSelection(selection);

  const ruleResult = useMemo(() => {
    if (!hasMinimum) return { bySubject: {} };
    return recommendConcepts(selection, DATA, { seed: stableSeed(selection) });
  }, [selection, hasMinimum]);

  const handleSelect = (concept: ConceptSuggestion) => {
    setSelectedConcept(concept);
    saveConcept(concept);
  };

  if (!hydrated) return null;

  if (!hasMinimum) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-selected-bg text-brand-selected">
          <User className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-brand-text">먼저 컨셉을 찾아보세요</h1>
          <p className="text-sm text-brand-muted leading-relaxed">
            캐릭터 주체 찾기는 <strong className="text-brand-text">1단계 이모티콘 컨셉 찾기</strong>를 먼저 진행해야 해요.
            <br />
            위저드에서 나이·성격·직업 등을 선택하면 컨셉이 추천되고,
            <br />
            그 컨셉을 기반으로 캐릭터를 찾을 수 있어요.
          </p>
        </div>
        <Button onClick={() => router.push('/concept')}>
          1단계 컨셉 찾기로 이동
        </Button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="text-sm text-brand-muted hover:text-brand-text"
        >
          시작 페이지로
        </button>
      </div>
    );
  }

  const personalityLabels = selection.personalities
    .map((id) => LABEL_MAPS.personality.get(id))
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text"
        >
          <ChevronLeft className="h-4 w-4" />
          시작 페이지로
        </button>
        <h1 className="text-3xl font-bold text-brand-text">캐릭터 주체 찾기</h1>
        <p className="text-sm text-brand-muted">
          {LABEL_MAPS.age.get(selection.age ?? '')} ·{' '}
          {LABEL_MAPS.gender.get(selection.gender ?? '')} · 성격: {personalityLabels}
          {selection.speechStyle &&
            ` · 말투: ${LABEL_MAPS.speechStyle.get(selection.speechStyle)}`}
        </p>
        <p className="text-sm text-brand-selected font-medium">
          1단계에서 추천된 컨셉 중 하나를 선택하면 캐릭터 주체 프롬프트를 받을 수 있어요.
        </p>
      </header>

      <ConceptResultGrid
        bySubject={ruleResult.bySubject}
        selectedConceptId={selectedConcept?.id}
        onSelect={handleSelect}
      />

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => setShowModal(true)}
          disabled={!selectedConcept}
        >
          <User className="h-5 w-5" />
          캐릭터 주체 찾기
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.push('/concept/result')}
        >
          <ChevronLeft className="h-4 w-4" />
          컨셉 결과로 돌아가기
        </Button>
      </div>

      {selectedConcept && (
        <CharacterSubjectModal
          open={showModal}
          onClose={() => setShowModal(false)}
          selectedConcept={selectedConcept}
          selection={selection}
          labelMaps={LABEL_MAPS}
        />
      )}
    </div>
  );
}
