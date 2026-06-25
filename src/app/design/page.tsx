'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronLeft, ChevronRight, Palette,
  PenLine, Check, PenSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { PromptModal } from '@/components/ui/PromptModal';
import { loadConceptSelection } from '@/lib/storage/concept-selection';

const CHARACTER_DESIGN_TEMPLATE = `첨부된 캐릭터 러프 스케치와 입력정보를 기반으로, 러프 스케치 이미지가 없다면 입력 정보만을 바탕으로
카카오 이모티콘에 적합한 캐릭터로 디자인하여 이미지로 출력하세요.

이 작업은 원본 러프 스케치 캐릭터의 특징을 유지하면서
이모티콘에 최적화된 형태로 정리하는 과정입니다.

---

[입력 정보]

컨셉: {concept}
캐릭터 주체: {characterType}
캐릭터 구조: {bodyType} (일체형 / 이족보행형 / 사족보행형)
그림체 스타일: {style} (기본형 / B급형 / 공감형)
캐릭터 개성 요소: {features} (최대 3개)
색감: {colorStyle}

---

[작업 목표]

- 러프 스케치의 핵심 특징을 유지한다
- 불필요한 디테일을 정리한다
- 이모티콘에 적합한 단순하고 명확한 캐릭터로 완성한다

---

[핵심 원칙]

1. 원본 특징 유지
- 캐릭터의 기본 형태와 인상을 유지할 것
- 캐릭터 정체성이 변형되지 않도록 할 것
2. 재디자인 허용 범위
- 선 정리, 형태 정돈, 비율 보정은 허용
- 캐릭터 자체가 바뀌는 수준의 변경은 금지
3. 단순화 방향
- 디테일은 줄이되 특징은 더 선명하게
- 복잡한 요소 제거, 핵심만 강조

---

[캐릭터 구조 규칙]

- 반드시 입력된 캐릭터 구조를 따를 것
1. 일체형
→ 머리와 몸통이 하나로 연결된 형태 (이모티콘 스타일 기본형)
2. 이족보행형
→ 두 발로 서 있는 구조 (사람형/동물형 캐릭터)
3. 사족보행형
→ 네 발로 움직이는 구조
- 구조를 임의로 변경하지 말 것

---

[비율 트렌드 규칙]

- 최근 이모티콘 트렌드에 맞게 얼굴 비중이 더 큰 비율로 구성할 것
- 기본적으로 머리 중심 비율 (약 2~2.5등신 느낌)
- 얼굴이 강조되고 몸통은 상대적으로 단순하게 처리

---

[팔다리 규칙]

- 팔다리는 기본적으로 짧고 단순하게 표현할 것
- 캐릭터 주체의 핵심 개성이 아닌 경우 길게 표현하지 말 것
- 손/발 디테일 최소화
- 포즈 확장성을 고려해 단순 구조 유지

---

[이모티콘 최적화 규칙]

1. 실루엣
- 작은 사이즈에서도 형태가 명확하게 보이도록
2. 표정 전달력
- 눈과 입이 잘 보이도록 구성
- 감정 전달 우선
3. 반복 사용성
- 다양한 표정/포즈로 확장 가능하게 단순 구조 유지

---

[개성 요소 규칙]

- 입력된 개성 요소는 반드시 반영
- 최소 1개 ~ 최대 3개까지만 유지
- (예: 눈썹, 볼터치, 무늬, 소품 등)
- 핵심 포인트로 강조

---

[스타일 규칙]

- 손으로 그린 느낌 유지
- 약간 삐뚤고 자연스러운 선 허용
- AI 특유의 매끈한 벡터 스타일 금지
- 완벽한 대칭 금지

---

[색감 규칙]

- 전체 색상 개수는 최소 1개, 최대 4개까지만 사용할 것
- 가능한 한 색상 개수를 줄일 것 (2~3색 권장)
- 핵심 색상 1개 중심 + 보조 색상 구성
- 플랫 컬러 사용
- 작은 사이즈에서도 대비 확보

---

[출력 설정]

- 이미지 크기: 1080 x 1080 px (정사각형)
- 해상도: 72 dpi
- 배경: 흰색 단색 (순수 흰색, 패턴/그라데이션 금지)
- 캐릭터는 중앙에 배치할 것
- 여백은 적절히 확보하여 잘리지 않도록 할 것
- 작은 사이즈에서도 캐릭터가 명확하게 보이도록 구성
- 최종 결과는 이모티콘 제작에 바로 사용할 수 있는 완성형 이미지로 출력
- 단일 캐릭터 이미지 출력
- 이모티콘 제작 가능한 완성형 캐릭터

---

[절대 금지 사항]

- 캐릭터 정체성 변경
- 개성 요소 3개 초과
- 과한 디테일 추가
- 현실적인 묘사
- AI 느낌 나는 스타일

---

최종 결과는 "이모티콘에 바로 사용할 수 있는 캐릭터"로 완성하여 이미지로 출력하세요.`;

function buildCharacterDesignPrompt(params: {
  concept: string; characterType: string; bodyType: string;
  drawingStyle: string; features: string; colorStyle: string;
}): string {
  return CHARACTER_DESIGN_TEMPLATE
    .replace('{concept}', params.concept)
    .replace('{characterType}', params.characterType)
    .replace('{bodyType}', params.bodyType)
    .replace('{style}', params.drawingStyle)
    .replace('{features}', params.features)
    .replace('{colorStyle}', params.colorStyle);
}
import { recommendConcepts, type RecommendData } from '@/lib/recommend/rule-based';
import { cn } from '@/lib/utils/cn';
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

// ─── 데이터 ─────────────────────────────────────────────────────────────────

const CHARACTER_TYPES = [
  '강아지', '고양이', '햄스터', '토끼', '곰', '판다', '여우', '늑대', '너구리', '수달',
  '코알라', '캥거루', '다람쥐', '고슴도치', '나무늘보', '사자', '호랑이', '기린', '코끼리',
  '하마', '원숭이', '쥐', '병아리', '오리', '부엉이', '펭귄', '참새', '까마귀', '개구리',
  '거북이', '도마뱀', '카멜레온', '뱀', '물고기', '고래', '돌고래', '문어', '해파리', '게',
  '새우', '구름', '해', '달', '별', '비', '눈', '선인장', '나무', '꽃', '유령', '슬라임',
  '물방울', '젤리', '로봇', '외계인', '괴물', '요정', '드래곤', '직장인', '회사원',
  '사회초년생', '학생', '대학생', '취준생', '알바생', '자취생', '집순이', '집돌이',
  '엄마', '아빠', '친구', '연인', '식빵', '햄버거', '피자', '치킨', '라면', '김밥',
  '떡볶이', '초밥', '커피', '우유', '아이스크림', '케이크', '도넛', '딸기', '바나나',
  '사과', '텀블러', '스마트폰', '노트북', '이어폰', '가방', '모자', '안경', '후드티',
];

const BODY_TYPES = [
  { id: '일체형', label: '일체형', desc: '머리와 몸통이 하나로 연결된 형태', image: '/design/body/integral.png' },
  { id: '이족보행형', label: '이족보행형', desc: '두 발로 서 있는 구조', image: '/design/body/biped.png' },
  { id: '사족보행형', label: '사족보행형', desc: '네 발로 움직이는 구조', image: '/design/body/quadruped.png' },
];

const DRAWING_STYLES = [
  { id: '기본형', label: '기본형', desc: '귀엽고 대중적인 이모티콘 스타일', image: '/design/style/basic.png' },
  { id: 'B급형', label: 'B급형', desc: '밈, 짤, 낙서처럼 보이는 유머러스한 스타일', image: '/design/style/b-grade.png' },
  { id: '일러스트형', label: '일러스트형', desc: '풍성하고 디테일한 스타일', image: '/design/style/illustration.png' },
];

const FEATURE_OPTIONS = [
  { id: '동물 무늬', label: '동물 무늬' },
  { id: '귀무늬', label: '귀무늬' },
  { id: '눈썹', label: '눈썹' },
  { id: '볼터치', label: '볼터치' },
  { id: '수염', label: '수염' },
  { id: '배무늬', label: '배무늬' },
  { id: '손무늬', label: '손무늬' },
  { id: '발무늬', label: '발무늬' },
];

// 가이드 이미지 위에 라벨을 얹을 위치(부위 좌표, %). side는 텍스트가 놓일 방향.
// 이미지가 바뀌면 x/y만 조정하면 된다.
type GuideSide = 'left' | 'right';
const FEATURE_GUIDE_LABELS: { label: string; x: number; y: number; side: GuideSide }[] = [
  { label: '동물 무늬', x: 46, y: 20, side: 'left' },
  { label: '귀무늬', x: 60, y: 18, side: 'right' },
  { label: '볼터치', x: 66, y: 47, side: 'right' },
  { label: '배무늬', x: 43, y: 70, side: 'left' },
  { label: '손무늬', x: 70, y: 66, side: 'right' },
  { label: '발무늬', x: 40, y: 86, side: 'left' },
];

const COLOR_OPTIONS = [
  { id: '파스텔톤', label: '파스텔톤', image: '/design/color/pastel.png' },
  { id: '비비드톤', label: '비비드톤', image: '/design/color/vivid.png' },
  { id: '모노톤', label: '모노톤', image: '/design/color/mono.png' },
  { id: '네온톤', label: '네온톤', image: '/design/color/neon.png' },
  { id: '소프트톤', label: '소프트톤', image: '/design/color/soft.png' },
];

const STEP_LABELS = ['컨셉 선택', '캐릭터 주체', '캐릭터 구조', '그림체 스타일', '개성 요소', '색감'];
const TOTAL_STEPS = 6;

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function hasMinimumSelection(s: WizardSelection): boolean {
  return (
    (s.personalities?.length ?? 0) > 0 &&
    ((s.jobs?.length ?? 0) > 0 ||
      (s.relationships?.length ?? 0) > 0 ||
      (s.hobbies?.length ?? 0) > 0 ||
      (s.sports?.length ?? 0) > 0)
  );
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

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

interface DesignState {
  concept: ConceptSuggestion | null;
  characterType: string | null;
  characterTypeCustom: string;
  bodyType: string | null;
  drawingStyle: string | null;
  features: string[];
  hasCustomFeature: boolean;
  featureCustom: string;
  colorStyle: string | null;
  colorStyleCustom: string;
}

const INITIAL_STATE: DesignState = {
  concept: null,
  characterType: null,
  characterTypeCustom: '',
  bodyType: null,
  drawingStyle: null,
  features: [],
  hasCustomFeature: false,
  featureCustom: '',
  colorStyle: null,
  colorStyleCustom: '',
};

export default function DesignPage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [lsSelection, setLsSelection] = useState<WizardSelection | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [state, setState] = useState<DesignState>(INITIAL_STATE);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setLsSelection(loadConceptSelection());
  }, []);

  const hasMinimum = lsSelection ? hasMinimumSelection(lsSelection) : false;

  const ruleResult = useMemo(() => {
    if (!lsSelection || !hasMinimum) return { bySubject: {} };
    return recommendConcepts(lsSelection, DATA, { seed: stableSeed(lsSelection) });
  }, [lsSelection, hasMinimum]);

  if (!hydrated) return null;

  // ── 1단계 미완료 안내 ──
  if (!hasMinimum) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-selected-bg text-brand-selected">
          <Palette className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-brand-text">먼저 컨셉을 찾아보세요</h1>
          <p className="text-sm text-brand-muted leading-relaxed">
            캐릭터 디자인은 <strong className="text-brand-text">1단계 이모티콘 컨셉 찾기</strong>를 먼저 진행해야 해요.
            <br />
            위저드를 완료하면 추천 컨셉이 저장되고,
            <br />
            그 컨셉을 기반으로 캐릭터를 디자인할 수 있어요.
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

  // ── canGoNext ──
  const totalFeatureCount = state.features.length + (state.hasCustomFeature ? 1 : 0);
  const canGoNext = (() => {
    switch (currentStep) {
      case 0: return state.concept !== null;
      case 1: return state.characterType !== null &&
        (state.characterType !== '직접입력' || state.characterTypeCustom.trim() !== '');
      case 2: return state.bodyType !== null;
      case 3: return state.drawingStyle !== null;
      case 4: return totalFeatureCount > 0 &&
        (!state.hasCustomFeature || state.featureCustom.trim() !== '');
      case 5: return state.colorStyle !== null &&
        (state.colorStyle !== '직접입력' || state.colorStyleCustom.trim() !== '');
      default: return false;
    }
  })();

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setShowModal(true);
    }
  };

  const set = <K extends keyof DesignState>(key: K, val: DesignState[K]) =>
    setState((s) => ({ ...s, [key]: val }));

  // ── 최종 프롬프트 파라미터 ──
  const effectiveCharacterType =
    state.characterType === '직접입력' ? state.characterTypeCustom : (state.characterType ?? '');
  const effectiveColorStyle =
    state.colorStyle === '직접입력' ? state.colorStyleCustom : (state.colorStyle ?? '');
  const effectiveFeatures = [
    ...state.features,
    ...(state.hasCustomFeature && state.featureCustom.trim() ? [state.featureCustom.trim()] : []),
  ].join(', ');

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <header className="space-y-3">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1 text-sm text-brand-muted hover:text-brand-text"
        >
          <ChevronLeft className="h-4 w-4" />
          시작 페이지로
        </button>
        <h1 className="text-3xl font-bold text-brand-text">캐릭터 디자인하기</h1>

        {/* 진행률 */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-brand-muted">
            <span>STEP {currentStep + 1} / {TOTAL_STEPS}</span>
            <span>{STEP_LABELS[currentStep]}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-brand-divider overflow-hidden">
            <div
              className="h-full rounded-full bg-brand-selected transition-all"
              style={{ width: `${((currentStep + 1) / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* 단계별 내용 */}
      {currentStep === 0 && (
        <StepConcept
          ruleResult={ruleResult.bySubject}
          selected={state.concept}
          onSelect={(c) => set('concept', c)}
        />
      )}
      {currentStep === 1 && (
        <StepCharacterType
          selected={state.characterType}
          custom={state.characterTypeCustom}
          onSelect={(v) => set('characterType', v)}
          onCustomChange={(v) => set('characterTypeCustom', v)}
        />
      )}
      {currentStep === 2 && (
        <StepBodyType
          selected={state.bodyType}
          onSelect={(v) => set('bodyType', v)}
        />
      )}
      {currentStep === 3 && (
        <StepDrawingStyle
          selected={state.drawingStyle}
          onSelect={(v) => set('drawingStyle', v)}
        />
      )}
      {currentStep === 4 && (
        <StepFeatures
          features={state.features}
          hasCustom={state.hasCustomFeature}
          custom={state.featureCustom}
          totalCount={totalFeatureCount}
          onToggle={(id) => {
            setState((s) => {
              const next = s.features.includes(id)
                ? s.features.filter((f) => f !== id)
                : totalFeatureCount < 3 ? [...s.features, id] : s.features;
              return { ...s, features: next };
            });
          }}
          onToggleCustom={() => {
            if (state.hasCustomFeature) {
              set('hasCustomFeature', false);
            } else if (totalFeatureCount < 3) {
              set('hasCustomFeature', true);
            }
          }}
          onCustomChange={(v) => set('featureCustom', v)}
        />
      )}
      {currentStep === 5 && (
        <StepColorStyle
          selected={state.colorStyle}
          custom={state.colorStyleCustom}
          onSelect={(v) => set('colorStyle', v)}
          onCustomChange={(v) => set('colorStyleCustom', v)}
        />
      )}

      {/* 내비게이션 */}
      <div className="flex justify-between pt-2">
        <Button
          variant="secondary"
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          이전
        </Button>
        <Button onClick={handleNext} disabled={!canGoNext}>
          {currentStep === TOTAL_STEPS - 1 ? (
            <>
              <Palette className="h-4 w-4" />
              프롬프트 받기
            </>
          ) : (
            <>
              다음
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* 모달 */}
      <PromptModal
        open={showModal && state.concept !== null}
        onClose={() => setShowModal(false)}
        title="캐릭터 디자인 프롬프트"
        subtitle={state.concept ? `컨셉: ${state.concept.text}` : undefined}
        description={<>
          아래 프롬프트를 복사한 후 ChatGPT에 붙여넣으세요.
          <br />
          <span className="font-medium text-brand-text">러프 스케치 이미지가 있다면 함께 첨부</span>하면 더 정확한 결과를 얻을 수 있어요.
        </>}
        prompt={state.concept ? buildCharacterDesignPrompt({
          concept: state.concept.text,
          characterType: effectiveCharacterType,
          bodyType: state.bodyType ?? '',
          drawingStyle: state.drawingStyle ?? '',
          features: effectiveFeatures,
          colorStyle: effectiveColorStyle,
        }) : ''}
      />
    </div>
  );
}

// ─── 단계 컴포넌트 ────────────────────────────────────────────────────────────

function StepConcept({
  ruleResult,
  selected,
  onSelect,
}: {
  ruleResult: Parameters<typeof ConceptResultGrid>[0]['bySubject'];
  selected: ConceptSuggestion | null;
  onSelect: (c: ConceptSuggestion) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-selected font-medium">
        1단계에서 추천된 컨셉 중 하나를 선택해주세요.
      </p>
      <ConceptResultGrid
        bySubject={ruleResult}
        selectedConceptId={selected?.id}
        onSelect={onSelect}
      />
    </div>
  );
}

function StepCharacterType({
  selected,
  custom,
  onSelect,
  onCustomChange,
}: {
  selected: string | null;
  custom: string;
  onSelect: (v: string) => void;
  onCustomChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">캐릭터 주체를 선택하거나 직접 입력해주세요.</p>

      {/* 직접입력 카드 */}
      <button
        type="button"
        onClick={() => onSelect('직접입력')}
        className={cn(
          'w-full rounded-2xl border p-4 text-left transition flex items-center gap-3',
          selected === '직접입력'
            ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30'
            : 'border-brand-divider bg-brand-card hover:border-brand-selected/50'
        )}
      >
        <PenSquare className="h-5 w-5 shrink-0 text-brand-selected" />
        <span className="font-bold text-brand-text">직접 입력하기</span>
        {selected === '직접입력' && <Check className="ml-auto h-4 w-4 text-brand-selected" />}
      </button>

      {selected === '직접입력' && (
        <input
          type="text"
          placeholder="캐릭터 주체를 입력해주세요 (예: 졸린 판다 바리스타)"
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          className="w-full rounded-2xl border border-brand-divider bg-brand-card px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-selected"
        />
      )}

      {/* 옵션 그리드 */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5 max-h-60 overflow-scroll">
        {CHARACTER_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => onSelect(type)}
            className={cn(
              'rounded-2xl border px-3 py-2.5 text-sm font-medium transition',
              selected === type
                ? 'border-brand-selected bg-brand-selected-bg/30 text-brand-selected ring-2 ring-brand-selected'
                : 'border-brand-divider bg-brand-card text-brand-text hover:border-brand-selected/50'
            )}
          >
            {type}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepBodyType({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">캐릭터의 기본 구조를 선택해주세요.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {BODY_TYPES.map(({ id, label, desc, image }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              'rounded-3xl border p-6 text-center transition flex flex-col items-center gap-3',
              selected === id
                ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30'
                : 'border-brand-divider bg-brand-card hover:border-brand-selected/50'
            )}
          >
            <div className={cn(
              'relative h-16 w-16 overflow-hidden rounded-full',
              selected === id ? 'ring-2 ring-brand-selected' : 'bg-brand-selected-bg'
            )}>
              <Image src={image} alt={label} fill sizes="64px" className="object-cover" />
            </div>
            <p className="font-bold text-brand-text">{label}</p>
            <p className="text-xs text-brand-muted">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepDrawingStyle({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">그림체 스타일을 선택해주세요.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {DRAWING_STYLES.map(({ id, label, desc, image }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              'rounded-3xl border p-6 text-center transition flex flex-col items-center gap-3',
              selected === id
                ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30'
                : 'border-brand-divider bg-brand-card hover:border-brand-selected/50'
            )}
          >
            <div className={cn(
              'relative h-16 w-16 overflow-hidden rounded-full',
              selected === id ? 'ring-2 ring-brand-selected' : 'bg-brand-selected-bg'
            )}>
              <Image src={image} alt={label} fill sizes="64px" className="object-cover" />
            </div>
            <p className="font-bold text-brand-text">{label}</p>
            <p className="text-xs text-brand-muted">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepFeatures({
  features,
  hasCustom,
  custom,
  totalCount,
  onToggle,
  onToggleCustom,
  onCustomChange,
}: {
  features: string[];
  hasCustom: boolean;
  custom: string;
  totalCount: number;
  onToggle: (id: string) => void;
  onToggleCustom: () => void;
  onCustomChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-muted">택해주세요. (최대 3개)</p>
        <span className={cn(
          'text-sm font-bold',
          totalCount >= 3 ? 'text-brand-selected' : 'text-brand-muted'
        )}>
          {totalCount} / 3
        </span>
      </div>
      <div className="flex w-full justify-center rounded-2xl border border-brand-divider bg-white py-6">
        <div className="relative aspect-3/2 w-full max-w-md overflow-hidden">
          <Image
            src="/design/feature/guide.png"
            alt="개성 요소 가이드"
            fill
            sizes="(min-width: 640px) 448px, 100vw"
            className="object-contain"
          />
          {FEATURE_GUIDE_LABELS.map(({ label, x, y, side }) => (
            <div
              key={label}
              className={cn(
                'absolute flex -translate-y-1/2 items-center gap-1',
                side === 'left' ? 'left-0 flex-row' : 'right-0 flex-row-reverse'
              )}
              style={{
                top: `${y}%`,
                width: side === 'left' ? `${x}%` : `${100 - x}%`,
              }}
            >
              <span className="whitespace-nowrap rounded-md bg-white/80 px-1.5 py-0.5 text-xs font-bold text-brand-text sm:text-sm">
                {label}
              </span>
              <span className="h-px flex-1 bg-amber-500" />
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURE_OPTIONS.map(({ id, label }) => {
          const isSelected = features.includes(id);
          const isDisabled = !isSelected && totalCount >= 3;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              disabled={isDisabled}
              className={cn(
                'rounded-2xl border px-4 py-3 text-center text-sm font-medium transition',
                isSelected
                  ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30 text-brand-selected'
                  : isDisabled
                    ? 'border-brand-divider bg-brand-card text-brand-muted opacity-40 cursor-not-allowed'
                    : 'border-brand-divider bg-brand-card text-brand-text hover:border-brand-selected/50'
              )}
            >
              {label}
            </button>
          );
        })}

        {/* 직접입력 */}
        <button
          type="button"
          onClick={onToggleCustom}
          disabled={!hasCustom && totalCount >= 3}
          className={cn(
            'rounded-2xl border px-4 py-3 text-center text-sm font-medium transition',
            hasCustom
              ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30 text-brand-selected'
              : !hasCustom && totalCount >= 3
                ? 'border-brand-divider bg-brand-card text-brand-muted opacity-40 cursor-not-allowed'
                : 'border-brand-divider bg-brand-card text-brand-text hover:border-brand-selected/50'
          )}
        >
          직접 입력
        </button>
      </div>

      {hasCustom && (
        <input
          type="text"
          placeholder="예: 앞머리, 리본, 안경"
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          className="w-full rounded-2xl border border-brand-divider bg-brand-card px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-selected"
        />
      )}
    </div>
  );
}

function StepColorStyle({
  selected,
  custom,
  onSelect,
  onCustomChange,
}: {
  selected: string | null;
  custom: string;
  onSelect: (v: string) => void;
  onCustomChange: (v: string) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-muted">캐릭터의 색감 톤을 선택해주세요.</p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {COLOR_OPTIONS.map(({ id, label, image }) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              'rounded-3xl border p-5 flex flex-col items-center gap-3 transition',
              selected === id
                ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30'
                : 'border-brand-divider bg-brand-card hover:border-brand-selected/50'
            )}
          >
            <div className="relative h-12 w-12 overflow-hidden">
              <Image src={image} alt={label} fill sizes="48px" className="object-contain" />
            </div>
            <span className="text-sm font-medium text-brand-text">{label}</span>
          </button>
        ))}

        {/* 직접입력 */}
        <button
          type="button"
          onClick={() => onSelect('직접입력')}
          className={cn(
            'rounded-3xl border p-5 flex flex-col items-center gap-3 transition',
            selected === '직접입력'
              ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30'
              : 'border-brand-divider bg-brand-card hover:border-brand-selected/50'
          )}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-selected-bg">
            <PenLine className="h-6 w-6 text-brand-selected" />
          </div>
          <span className="text-sm font-medium text-brand-text">직접 입력</span>
        </button>
      </div>

      {selected === '직접입력' && (
        <input
          type="text"
          placeholder="예: 따뜻한 브라운 톤, 레트로 컬러"
          value={custom}
          onChange={(e) => onCustomChange(e.target.value)}
          className="w-full rounded-2xl border border-brand-divider bg-brand-card px-4 py-3 text-sm text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-selected"
        />
      )}
    </div>
  );
}
