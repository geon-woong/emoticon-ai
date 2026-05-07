'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { PromptModal } from '@/components/ui/PromptModal';
import { useConceptWizardStore } from '@/stores/concept-wizard-store';

const MESSAGE_PLANNING_TEMPLATE = `<메시지 작성 프롬프트>

AI 역할: 지금부터 AI인 나는 카카오 이모티콘 전문가이자 기획자입니다.

미션: 아래 [기본 정보]와 [컨셉 정보]를 철저히 반영하여, 카카오톡 대화방에서 실사용률이 높고 컨셉과 완벽하게 연결되는 32개의 이모티콘 메시지 목록을 생성합니다. 메시지 표는 [이모티콘 메시지 구성 원칙]을 준수하여 작성해야 합니다.

[기본 정보]

컨셉 : {concept}

캐릭터 주체 / 이름 : [여기에 캐릭터 주체/이름을 입력하세요] (예: 시바견 / '찌바')

캐릭터 성격 : [여기에 캐릭터 성격을 입력하세요] (예: 긍정적, 도전적, 질문 폭격기)

타겟 : [여기에 타겟을 입력하세요] (예: 이모티콘 제작에 관심 있는 10~30대)

받아보는 대상 : [여기에 받아보는 대상을 입력하세요] (예: 작가 단톡방 동료 작가들)

[컨셉 정보]

분위기 : [여기에 분위기를 입력하세요] (예: 공손한, 친근한, 병맛)

본인 : [여기에 본인 캐릭터의 특징을 입력하세요] (예: 긍정, 도전, 질문 폭격기, 신입 작가)

상대 : [여기에 상대 캐릭터/상황을 입력하세요] (예: 작가 단톡방 사람들, 선배 작가)

말투 : [여기에 말투를 입력하세요] (예: 극존칭, 밝고 명랑한 말투, ~합니다!)

행동 : [여기에 행동 특징을 입력하세요] (예: 적극적인 질문, 봉사, 응원, 피드백 요청)

컨셉 관련 키워드 : [여기에 내 컨셉과 관련된 키워드와 함께 키워드를 설명 해 주세요] (예: 주식 컨셉 - 매수, 매도 : 주식을 사는 것, 주식을 파는 것 / 이모티콘 작가 컨셉 - 승인, 미승인 : 카카오에 이모티콘 제안 후 심사에서 통과하거나 통과하지 못한 상태)

[이모티콘 메시지 구성 원칙]

1. 다양성 (필수): 전체적으로 감정 표현과 메시지가 다양하도록 구성해야 합니다.

2. 컨셉과 연결 (필수): 모든 감정 표현과 메시지는 위 [컨셉 정보]와 관련된 상황과 연결되도록 구성되어야 합니다.

3. 연출 (필수): 동작, 소품, 효과 등을 활용하여 컨셉을 가장 잘 드러낼 수 있는 개성 있고 아이디어 넘치는 상황으로 연출해야 합니다.

4. 텍스트: 텍스트는 최대 8글자 이내의 카카오톡 대화체로 작성합니다. 하나의 상황만 담아 주세요. ('굿모닝! 제안 고고!' 보다는 '굿모닝!' 으로만 표현 해 주세요)

5. 예시 : '주식' 컨셉과 '인사' 키워드를 조합 해 '안녕하세요', '안녕히계세요' 대신 '장 열어!', '장 마감!' 으로 표현

[참고 키워드] (활용도가 높도록 컨셉에 맞춰 적절히 조합하여 사용)

- 필수 감정 표현: 인사, 사랑, 축하, 사과, 감사, 궁금, 긍정, 부정, 칭찬, 위로, 화남, 당황, 신남, 식사, 좌절, 놀람, 슬픔, 웃음, 감동, 기대
- 자주 사용하는 메시지 / 인기 키워드: 영혼 없는 눈, 귀찮, 삐짐, 아픔, 배고픔, 충격, 공포, 외로움, 메롱, 불안, 불만, 고민, 짜증, 식은땀, 인내, 쿨쿨, 실망, 웃픔, 윙크, 휴, 감탄, 난처, 짠, 설렘, 지루, 답답, 찡찡, 당당, 혼란, 정색, 캬, 쑥스러움, 쓰담쓰담, 절레절레, 흥얼흥얼, 쒸익쒸익, 투덜투덜, 룰루랄라, 초롱초롱, 토닥토닥, 멍때림, 무기력, 아침인사, 밤인사, 반가움, 끄덕끄덕, 좋아, 폭죽, 내꿈꿔, 예뻐, 미안해, 싫어, 똑똑, 왜, 보고싶어, 그래, 멋져, 최고, 와우, 안돼, 하하, 신나, 고고, 아니, 응원, 잘자, 자기, 안녕, 박수, 가자, 엄지척, 눈물나, 충성, 고마워, 힘내, 잘했어, 일어나, 사랑해, 행복해, 하, 뭐해?, 고생했어, 뽀뽀, 넵, 잘가, 땡큐, 굿모닝, 퇴근, 힝, 또르르, 선물, 흥칫뿡, 머쓱, 흑흑, 맛점, 소리질러, 우와, 꺄, 오오, 헐, 술, 좋은하루, ㅋㅋ, ㅠㅠ, ㅎㅎ, 졸려, 오케이, 화이팅, 귀여워, 꾸벅, 헉, 고맙습니다.
- 참고 키워드 이외에도 컨셉과 관련된 상황 속 메시지를 구성 해 주세요.

요청 양식:

1. 먼저 [기본 정보]와 [컨셉 정보]를 재확인하는 구체화된 캐릭터 설정을 간략히 제시하세요.

2. 이후 아래 표 형식으로 32가지 메시지 목록을 작성하세요.

| 감정/상황 | 표정 | 동작 | 텍스트 (8글자 이내) | 효과 | 소품 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| (예시) 인사 | 당당한 표정 | 문을 쾅! 차고 점프해서 문을 뛰어넘음 | 등장! | 놀란 효과 | 문 |
| 1 | | | | | |
| 2 | | | | | |
| ... | | | | | |
| 32 | | | | | |`;

function buildMessagePlanningPrompt(concept: string): string {
  return MESSAGE_PLANNING_TEMPLATE.replace('{concept}', concept);
}
import { recommendConcepts, type RecommendData } from '@/lib/recommend/rule-based';
import { loadConceptSelection } from '@/lib/storage/concept-selection';
import type { ConceptSuggestion, WizardSelection } from '@/types/concept';

import personalities from '@/data/keywords/personalities.json';
import jobs from '@/data/keywords/jobs.json';
import relationships from '@/data/keywords/relationships.json';
import hobbies from '@/data/keywords/hobbies.json';
import sports from '@/data/keywords/sports.json';

const DATA: RecommendData = {
  personalities: personalities as RecommendData['personalities'],
  jobs: jobs as RecommendData['jobs'],
  relationships: relationships as RecommendData['relationships'],
  hobbies: hobbies as RecommendData['hobbies'],
  sports: sports as RecommendData['sports'],
};

const LS_KEY = 'emoticon-ai/message-selected-concept';

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

export default function MessagePage() {
  const router = useRouter();
  const storeSelection = useConceptWizardStore((s) => s.selection);

  const [selectedConcept, setSelectedConcept] = useState<ConceptSuggestion | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [lsSelection, setLsSelection] = useState<WizardSelection | null>(null);

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
          <MessageCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-brand-text">먼저 컨셉을 찾아보세요</h1>
          <p className="text-sm text-brand-muted leading-relaxed">
            이모티콘 메시지 기획은 <strong className="text-brand-text">1단계 이모티콘 컨셉 찾기</strong>를 먼저 진행해야 해요.
            <br />
            위저드에서 나이·성격·직업 등을 선택하면 컨셉이 추천되고,
            <br />
            그 컨셉을 기반으로 메시지를 기획할 수 있어요.
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
        <h1 className="text-3xl font-bold text-brand-text">이모티콘 메시지 기획하기</h1>
        <p className="text-sm text-brand-selected font-medium">
          1단계에서 추천된 컨셉 중 하나를 선택하면 메시지 기획 프롬프트를 받을 수 있어요.
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
          <MessageCircle className="h-5 w-5" />
          메시지 기획 프롬프트 받기
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
        title="이모티콘 메시지 기획하기"
        subtitle={selectedConcept ? `선택한 컨셉: ${selectedConcept.text}` : undefined}
        description={<>
          아래 프롬프트를 복사한 후, ChatGPT 또는 Gemini에 붙여넣으세요.
          <br />
          <span className="font-medium text-brand-text">컨셉은 자동으로 입력</span>되어 있으며,
          나머지 항목은 내 캐릭터에 맞게 직접 채워주세요.
        </>}
        prompt={selectedConcept ? buildMessagePlanningPrompt(selectedConcept.text) : ''}
      />
    </div>
  );
}
