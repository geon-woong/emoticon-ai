'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, Palette,
  Circle, PersonStanding, PawPrint,
  Smile, Zap, Heart,
  Blend, Ear, Minus, Sparkles, Feather, Square, Hand, Footprints, PenLine,
  Check, PenSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ConceptResultGrid } from '@/components/concept/ConceptResultGrid';
import { CharacterDesignModal } from '@/components/design/CharacterDesignModal';
import { loadConceptSelection } from '@/lib/storage/concept-selection';
import { recommendConcepts, type RecommendData } from '@/lib/recommend/rule-based';
import { cn } from '@/lib/utils/cn';
import type { ConceptSuggestion, WizardSelection } from '@/types/concept';

import personalities from '@/data/keywords/personalities.json';
import jobs from '@/data/keywords/jobs.json';
import relationships from '@/data/keywords/relationships.json';
import hobbies from '@/data/keywords/hobbies.json';
import sports from '@/data/keywords/sports.json';
import modifiers from '@/data/keywords/modifiers.json';

const DATA: RecommendData = {
  personalities: personalities as RecommendData['personalities'],
  jobs: jobs as RecommendData['jobs'],
  relationships: relationships as RecommendData['relationships'],
  hobbies: hobbies as RecommendData['hobbies'],
  sports: sports as RecommendData['sports'],
  modifiers: modifiers as RecommendData['modifiers'],
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
  { id: '일체형', label: '일체형', desc: '머리와 몸통이 하나로 연결된 형태', icon: Circle },
  { id: '이족보행형', label: '이족보행형', desc: '두 발로 서 있는 구조', icon: PersonStanding },
  { id: '사족보행형', label: '사족보행형', desc: '네 발로 움직이는 구조', icon: PawPrint },
];

const DRAWING_STYLES = [
  { id: '기본형', label: '기본형', desc: '깔끔하고 정돈된 이모티콘 스타일', icon: Smile },
  { id: 'B급형', label: 'B급형', desc: '유머러스하고 개성 있는 스타일', icon: Zap },
  { id: '공감형', label: '공감형', desc: '공감 유발 중심의 표정 강조 스타일', icon: Heart },
];

const FEATURE_OPTIONS = [
  { id: '동물 무늬', label: '동물 무늬', icon: Blend },
  { id: '귀무늬', label: '귀무늬', icon: Ear },
  { id: '눈썹', label: '눈썹', icon: Minus },
  { id: '볼터치', label: '볼터치', icon: Sparkles },
  { id: '수염', label: '수염', icon: Feather },
  { id: '배무늬', label: '배무늬', icon: Square },
  { id: '손무늬', label: '손무늬', icon: Hand },
  { id: '발무늬', label: '발무늬', icon: Footprints },
];

const COLOR_OPTIONS = [
  { id: '파스텔톤', label: '파스텔톤', color: '#FFD6E7' },
  { id: '비비드톤', label: '비비드톤', color: '#FF3B30' },
  { id: '모노톤', label: '모노톤', color: '#8E8E93' },
  { id: '네온톤', label: '네온톤', color: '#39FF14' },
  { id: '팝컬러톤', label: '팝컬러톤', color: '#FFD60A' },
];

const STEP_LABELS = ['컨셉 선택', '캐릭터 주체', '캐릭터 구조', '그림체 스타일', '개성 요소', '색감'];
const TOTAL_STEPS = 6;

// ─── 유틸 ────────────────────────────────────────────────────────────────────

function hasMinimumSelection(s: WizardSelection): boolean {
  return (
    s.personalities.length > 0 &&
    (!!s.job || !!s.relationship || s.hobbies.length > 0 || s.sports.length > 0)
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
      {state.concept && (
        <CharacterDesignModal
          open={showModal}
          onClose={() => setShowModal(false)}
          params={{
            concept: state.concept.text,
            characterType: effectiveCharacterType,
            bodyType: state.bodyType ?? '',
            drawingStyle: state.drawingStyle ?? '',
            features: effectiveFeatures,
            colorStyle: effectiveColorStyle,
          }}
        />
      )}
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
        {BODY_TYPES.map(({ id, label, desc, icon: Icon }) => (
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
              'flex h-16 w-16 items-center justify-center rounded-full',
              selected === id ? 'bg-brand-selected text-white' : 'bg-brand-selected-bg text-brand-selected'
            )}>
              <Icon className="h-8 w-8" />
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
        {DRAWING_STYLES.map(({ id, label, desc, icon: Icon }) => (
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
              'flex h-16 w-16 items-center justify-center rounded-full',
              selected === id ? 'bg-brand-selected text-white' : 'bg-brand-selected-bg text-brand-selected'
            )}>
              <Icon className="h-8 w-8" />
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
        <p className="text-sm text-brand-muted">개성 요소를 선택해주세요. (최대 3개)</p>
        <span className={cn(
          'text-sm font-bold',
          totalCount >= 3 ? 'text-brand-selected' : 'text-brand-muted'
        )}>
          {totalCount} / 3
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FEATURE_OPTIONS.map(({ id, label, icon: Icon }) => {
          const isSelected = features.includes(id);
          const isDisabled = !isSelected && totalCount >= 3;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              disabled={isDisabled}
              className={cn(
                'rounded-2xl border px-4 py-3 flex items-center gap-2 transition',
                isSelected
                  ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30 text-brand-selected'
                  : isDisabled
                    ? 'border-brand-divider bg-brand-card text-brand-muted opacity-40 cursor-not-allowed'
                    : 'border-brand-divider bg-brand-card text-brand-text hover:border-brand-selected/50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          );
        })}

        {/* 직접입력 */}
        <button
          type="button"
          onClick={onToggleCustom}
          disabled={!hasCustom && totalCount >= 3}
          className={cn(
            'rounded-2xl border px-4 py-3 flex items-center gap-2 transition',
            hasCustom
              ? 'border-brand-selected ring-2 ring-brand-selected bg-brand-selected-bg/30 text-brand-selected'
              : !hasCustom && totalCount >= 3
                ? 'border-brand-divider bg-brand-card text-brand-muted opacity-40 cursor-not-allowed'
                : 'border-brand-divider bg-brand-card text-brand-text hover:border-brand-selected/50'
          )}
        >
          <PenLine className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">직접 입력</span>
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
        {COLOR_OPTIONS.map(({ id, label, color }) => (
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
            <div
              className="h-12 w-12 rounded-full border border-brand-divider shadow-sm"
              style={{ backgroundColor: color }}
            />
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
