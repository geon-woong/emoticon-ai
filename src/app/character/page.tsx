'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { PromptModal } from '@/components/ui/PromptModal';
import { useConceptWizardStore } from '@/stores/concept-wizard-store';

const CHARACTER_SUBJECT_TEMPLATE = `너는 카카오 이모티콘 기획 전문가다.

이 작업은 이미 정해진 컨셉을 기반으로,
해당 컨셉을 가장 잘 표현할 수 있는 "캐릭터 주체"를 추천하는 단계이다.

새로운 컨셉을 만들지 말고,
입력된 컨셉을 그대로 유지한 상태에서 가장 적합한 캐릭터를 선정하라.

---

[입력값]

나이대: {age}
성별: {gender}
성격: {personality}
말투: {speach-style}

정해진 컨셉: {concept}

---

[전체 기준]

1. 컨셉 분석
- 먼저 컨셉의 핵심 감정과 행동 패턴을 내부적으로 해석한 뒤 추천할 것
1. 캐릭터 선정 기준
- 이 감정과 행동을 가장 잘 표현할 수 있는 주체를 선택할 것
- 단순 귀여움보다 "컨셉 표현력"을 우선할 것
- 카카오 이모티콘에 적합한 친근하고 대중적인 캐릭터일 것
1. 다양성
- 3개의 캐릭터는 서로 겹치지 않게 완전히 다르게 선정할 것
- 과하게 흔한 동물(토끼, 곰 등)만 반복하지 말 것
- 동물 / 사람형 / 사물형 등 다양한 방향 허용
1. 캐릭터 표현 방식
- 단순 동물 이름이 아니라 "성향이 드러나는 형태"로 작성할 것
- 예: 게으른 나무늘보 / 마감에 찌든 햄스터 작가 / 눈치 빠른 회사원 펭귄

---

[선정 이유 작성 기준]

- 이 캐릭터가 왜 해당 컨셉과 잘 맞는지 설명할 것
- 어떤 감정 / 행동을 표현하기 좋은지 포함할 것
- 짧고 명확하게 1~2문장으로 작성할 것

---

[비주얼 포인트 작성 기준]

- 반드시 외형적으로 보이는 요소만 작성할 것
- 감정/행동 표현 금지 (예: '귀찮은 표정' 금지)
- 색상, 무늬, 눈, 눈썹, 다크써클, 체형, 소품 등 시각 요소 중심
- 정확히 3개만 작성
- 짧은 단어 또는 구 형태로 작성

---

[출력 규칙]

- 반드시 3개의 캐릭터를 각각 분리해서 작성할 것
- 각 캐릭터는 서로 완전히 다른 유형이어야 함
- 불필요한 설명 없이 아래 형식만 유지할 것

---

[출력 형식]

컨셉: {concept}

1.

추천 캐릭터 주체:
선정 이유:
비주얼 포인트:

1.

추천 캐릭터 주체:
선정 이유:
비주얼 포인트:

1.

추천 캐릭터 주체:
선정 이유:
비주얼 포인트:`;

function buildCharacterSubjectPrompt(params: {
  age: string; gender: string; personality: string; speechStyle: string; concept: string;
}): string {
  return CHARACTER_SUBJECT_TEMPLATE
    .replace(/{age}/g, params.age)
    .replace(/{gender}/g, params.gender)
    .replace(/{personality}/g, params.personality)
    .replace(/{speach-style}/g, params.speechStyle)
    .replace(/{concept}/g, params.concept);
}
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
import speechStyles from '@/data/keywords/speech-styles.json';

const DATA: RecommendData = {
  personalities: personalities as RecommendData['personalities'],
  jobs: jobs as RecommendData['jobs'],
  relationships: relationships as RecommendData['relationships'],
  hobbies: hobbies as RecommendData['hobbies'],
  sports: sports as RecommendData['sports'],
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
    (s.jobs.length > 0 || s.relationships.length > 0 || s.hobbies.length > 0 || s.sports.length > 0)
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
          onClick={() => router.push('/')}
        >
          <ChevronLeft className="h-4 w-4" />
          처음으로
        </Button>
      </div>

      <PromptModal
        open={showModal && selectedConcept !== null}
        onClose={() => setShowModal(false)}
        title="캐릭터 주체 찾기"
        subtitle={selectedConcept ? `선택한 컨셉: ${selectedConcept.text}` : undefined}
        description="아래 프롬프트를 복사한 후, ChatGPT 또는 Gemini에 붙여넣어 캐릭터 주체를 추천받아보세요."
        prompt={selectedConcept ? buildCharacterSubjectPrompt({
          age: LABEL_MAPS.age.get(selection.age ?? '') ?? selection.age ?? '',
          gender: LABEL_MAPS.gender.get(selection.gender ?? '') ?? selection.gender ?? '',
          personality: selection.personalities.map((id) => LABEL_MAPS.personality.get(id)).filter(Boolean).join(', '),
          speechStyle: LABEL_MAPS.speechStyle.get(selection.speechStyle ?? '') ?? '없음',
          concept: selectedConcept.text,
        }) : ''}
      />
    </div>
  );
}
