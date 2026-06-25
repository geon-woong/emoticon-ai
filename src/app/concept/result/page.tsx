'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, ChevronLeft, ArrowRight, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { PromptModal } from '@/components/ui/PromptModal';
import { useConceptWizardStore, WIZARD_STEPS } from '@/stores/concept-wizard-store';

const CONCEPT_DETAIL_TEMPLATE = `너는 카카오 이모티콘 기획 전문가다.

이 작업은 새로운 컨셉을 만드는 단계가 아니라,
이미 정해진 컨셉을 이모티콘 제작에 바로 활용할 수 있도록 구체화하는 단계이다.

반드시 입력된 정보를 기반으로 하나의 일관된 컨셉으로 정리하라.
절대 새로운 컨셉을 추가하거나 변형하지 말 것.

---

[입력값]

나이대: {age}
성별: {gender}
성격: {personality}
말투: {speach-styles}

정해진 컨셉: {concept}

---

[전체 작성 원칙]

- 컨셉을 새로 만들지 말고, 기존 컨셉을 유지한 채 구체화할 것
- 실제 카카오톡에서 자주 쓰일 수 있는 방향으로 작성할 것
- 모든 항목은 하나의 동일한 캐릭터를 설명해야 할 것
- 과하게 길지 않고, 바로 활용 가능하게 작성할 것

---

[항목별 작성 규칙]

컨셉 :

- 반드시 입력된 "정해진 컨셉"을 그대로 출력할 것
- 절대 수정, 요약, 재작성 금지

성격 :

- 입력된 성격 값을 그대로 출력할 것
- 추가 설명 금지

말투 :

- 입력된 말투 값을 그대로 출력할 것
- 추가 설명 금지

타겟 :

- 이 이모티콘을 가장 좋아할 만한 사용자층을 구체적으로 작성
- 나이, 성향, 사용 상황이 자연스럽게 드러나야 함

받아보는 대상 :

- 실제로 이 이모티콘을 주로 보내게 될 상대를 작성
- 친구, 가족, 연인, 직장동료 등 현실적인 관계 중심

추천 캐릭터 주체 :

- 이 컨셉에 가장 잘 어울리는 캐릭터를 구체적으로 제안
- 단순 동물/사람이 아니라 "성향이 드러나는 주체"로 작성
- 예: 마감에 찌든 햄스터 작가 / 귀찮음 많은 집사 고양이

비주얼 포인트 :

- 반드시 "외형적으로 보이는 요소"만 작성할 것
- 색상, 무늬, 눈, 눈썹, 다크써클, 체형, 소품 등 시각적 특징 중심
- 감정이나 행동 표현 금지 (예: '귀찮은 표정' X)
- 정확히 3개만 작성
- 각 항목은 짧은 단어/구 형태로 작성

추천 이모티콘 메시지 10개 :

- 실제 카카오톡에서 바로 쓸 수 있는 짧은 문장으로 작성
- 입력된 말투와 성격이 자연스럽게 반영되어야 함
- 서로 비슷한 문장 반복 금지
- 인사, 리액션, 공감, 귀찮음, 기쁨 등 다양한 상황 포함
- 설명문 금지, 이모티콘 대사 형태로 작성

---

[출력 형식]

<컨셉 정보>

컨셉 :
성격 :
말투 :

타겟 :
받아보는 대상 :

추천 캐릭터 주체 :
비주얼 포인트 :

추천 이모티콘 메시지 10개 :`;

function buildConceptDetailPrompt(params: {
  age: string; gender: string; personality: string; speechStyle: string; concept: string;
}): string {
  return CONCEPT_DETAIL_TEMPLATE
    .replace('{age}', params.age)
    .replace('{gender}', params.gender)
    .replace('{personality}', params.personality)
    .replace('{speach-styles}', params.speechStyle)
    .replace('{concept}', params.concept);
}
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
import speechStyles from '@/data/keywords/speech-styles.json';

const DATA: RecommendData = {
  personalities: personalities as RecommendData['personalities'],
  jobs: jobs as RecommendData['jobs'],
  relationships: relationships as RecommendData['relationships'],
  hobbies: hobbies as RecommendData['hobbies'],
  sports: sports as RecommendData['sports'],
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
    (selection.jobs.length > 0 ||
      selection.relationships.length > 0 ||
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
            setStep(WIZARD_STEPS.length - 1);
            router.push('/concept');
          }}
          className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text"
        >
          <ChevronLeft className="h-4 w-4" />
          이전단계로 돌아가기
        </button>
        <h1 className="text-3xl font-bold text-brand-text">추천 컨셉</h1>
        <p className="text-sm text-brand-muted">
          {LABEL_MAPS.age.get(selection.age ?? '')} · {LABEL_MAPS.gender.get(selection.gender ?? '')} · 성격:{' '}
          {personalityLabels}
          {selection.speechStyle && ` · 말투: ${LABEL_MAPS.speechStyle.get(selection.speechStyle)}`}
        </p>
        <p className="text-sm text-brand-selected font-medium">컨셉을 하나 선택한 후 구체화할 수 있어요.</p>
      </header>

      <ConceptResultGrid
        bySubject={ruleResult.bySubject}
        selectedConceptId={selectedConcept?.id}
        onSelect={setSelectedConcept}
      />

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button onClick={() => setShowModal(true)} disabled={!selectedConcept}>
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
        <Button variant="secondary" onClick={() => router.push('/')}>
          <Home className="h-4 w-4" />
          메인화면
        </Button>
      </div>

      <p className="text-center text-xs text-brand-muted">선택한 컨셉은 자동으로 저장됩니다.</p>

      <PromptModal
        open={showModal && selectedConcept !== null}
        onClose={() => setShowModal(false)}
        title="컨셉 구체화하기"
        subtitle={selectedConcept ? `선택한 컨셉: ${selectedConcept.text}` : undefined}
        description="아래 프롬프트를 복사한 후, ChatGPT에 붙여넣어 컨셉을 구체화해보세요."
        prompt={
          selectedConcept
            ? buildConceptDetailPrompt({
                age: LABEL_MAPS.age.get(selection.age ?? '') ?? selection.age ?? '',
                gender: LABEL_MAPS.gender.get(selection.gender ?? '') ?? selection.gender ?? '',
                personality: selection.personalities
                  .map((id) => LABEL_MAPS.personality.get(id))
                  .filter(Boolean)
                  .join(', '),
                speechStyle: LABEL_MAPS.speechStyle.get(selection.speechStyle ?? '') ?? '없음',
                concept: selectedConcept.text,
              })
            : ''
        }
      />
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
