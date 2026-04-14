'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, ChevronLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { ConceptDetailModal } from '@/components/concept/ConceptDetailModal';
import { useConceptWizardStore } from '@/stores/concept-wizard-store';
import { recommendConcepts, type RecommendData } from '@/lib/recommend/rule-based';
import { saveConceptSelection } from '@/lib/storage/concept-selection';
import type { ConceptSuggestion } from '@/types/concept';

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

// 라벨 lookup용 (선택 요약 표시 + 프롬프트 빌드)
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

export default function ConceptResultPage() {
  const router = useRouter();
  const selection = useConceptWizardStore((s) => s.selection);
  const reset = useConceptWizardStore((s) => s.reset);
  const setStep = useConceptWizardStore((s) => s.setStep);

  const [selectedConcept, setSelectedConcept] = useState<ConceptSuggestion | null>(null);
  const [showModal, setShowModal] = useState(false);

  // 위저드를 거치지 않고 바로 진입한 경우 가드
  const hasMinimum =
    selection.personalities.length > 0 &&
    (selection.job ||
      selection.relationship ||
      selection.hobbies.length > 0 ||
      selection.sports.length > 0);

  useEffect(() => {
    if (!hasMinimum) {
      router.replace('/concept');
    }
  }, [hasMinimum, router]);

  // 컨셉 찾기 완료 시 로컬스토리지에 선택값 저장
  useEffect(() => {
    if (hasMinimum) {
      saveConceptSelection(selection);
    }
  }, [hasMinimum, selection]);

  const ruleResult = useMemo(() => {
    if (!hasMinimum) return { bySubject: {} };
    return recommendConcepts(selection, DATA, { seed: stableSeed(selection) });
  }, [selection, hasMinimum]);

  if (!hasMinimum) return null;

  const personalityLabels = selection.personalities
    .map((id) => LABEL_MAPS.personality.get(id))
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setStep(0);
            router.push('/concept');
          }}
          className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text"
        >
          <ChevronLeft className="h-4 w-4" />
          위저드로 돌아가기
        </button>
        <h1 className="text-3xl font-bold text-brand-text">추천 컨셉</h1>
        <p className="text-sm text-brand-muted">
          {LABEL_MAPS.age.get(selection.age ?? '')} ·{' '}
          {LABEL_MAPS.gender.get(selection.gender ?? '')} · 성격: {personalityLabels}
          {selection.speechStyle && ` · 말투: ${LABEL_MAPS.speechStyle.get(selection.speechStyle)}`}
        </p>
        <p className="text-sm text-brand-selected font-medium">
          컨셉을 하나 선택한 후 구체화할 수 있어요.
        </p>
      </header>

      <ConceptResultGrid
        bySubject={ruleResult.bySubject}
        selectedConceptId={selectedConcept?.id}
        onSelect={setSelectedConcept}
      />

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => setShowModal(true)}
          disabled={!selectedConcept}
        >
          <ArrowRight className="h-5 w-5" />
          컨셉 구체화 하러가기
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            reset();
            router.push('/concept');
          }}
        >
          <RotateCcw className="h-4 w-4" />
          처음부터 다시
        </Button>
      </div>

      {selectedConcept && (
        <ConceptDetailModal
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

function stableSeed(selection: unknown): number {
  // 선택값 기반의 안정된 정수 시드 — 새로고침 시 동일한 룰 결과 보장
  const key = JSON.stringify(selection);
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
