'use client';

import { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import type { ConceptSuggestion, WizardSelection } from '@/types/concept';

interface LabelMaps {
  age: Map<string, string>;
  gender: Map<string, string>;
  personality: Map<string, string>;
  speechStyle: Map<string, string>;
}

interface Props {
  open: boolean;
  onClose: () => void;
  selectedConcept: ConceptSuggestion;
  selection: WizardSelection;
  labelMaps: LabelMaps;
}

const PROMPT_TEMPLATE = `너는 카카오 이모티콘 기획 전문가다.

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

function buildPrompt(params: {
  age: string;
  gender: string;
  personality: string;
  speechStyle: string;
  concept: string;
}): string {
  return PROMPT_TEMPLATE
    .replace(/{age}/g, params.age)
    .replace(/{gender}/g, params.gender)
    .replace(/{personality}/g, params.personality)
    .replace(/{speach-style}/g, params.speechStyle)
    .replace(/{concept}/g, params.concept);
}

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-[#10a37f]' },
  { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-[#4285f4]' },
];

export function CharacterSubjectModal({
  open,
  onClose,
  selectedConcept,
  selection,
  labelMaps,
}: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const age = labelMaps.age.get(selection.age ?? '') ?? selection.age ?? '';
  const gender = labelMaps.gender.get(selection.gender ?? '') ?? selection.gender ?? '';
  const personality = selection.personalities
    .map((id) => labelMaps.personality.get(id))
    .filter(Boolean)
    .join(', ');
  const speechStyle = labelMaps.speechStyle.get(selection.speechStyle ?? '') ?? '없음';

  const prompt = buildPrompt({
    age,
    gender,
    personality,
    speechStyle,
    concept: selectedConcept.text,
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('프롬프트가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다. 직접 텍스트를 선택해 복사해주세요.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-brand-card border border-brand-divider shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-brand-card px-6 py-5 border-b border-brand-divider">
          <div>
            <h2 className="text-xl font-bold text-brand-text">캐릭터 주체 찾기</h2>
            <p className="mt-0.5 text-sm text-brand-muted">선택한 컨셉: {selectedConcept.text}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-brand-divider/40 transition"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-brand-muted" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* AI 활용 가이드 */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-brand-text">AI로 캐릭터 찾기</h3>
            <p className="text-sm text-brand-muted">
              아래 프롬프트를 복사한 후, ChatGPT 또는 Gemini에 붙여넣어 캐릭터 주체를 추천받아보세요.
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_LINKS.map((ai) => (
                <a
                  key={ai.name}
                  href={ai.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 ${ai.color}`}
                >
                  {ai.name} 바로가기
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </section>

          {/* 프롬프트 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-text">프롬프트</h3>
              <Button variant="secondary" onClick={handleCopy} className="text-sm px-4 py-2">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? '복사됨!' : '프롬프트 복사하기'}
              </Button>
            </div>
            {/* <pre className="w-full rounded-2xl border border-brand-divider bg-brand-bg p-4 text-xs text-brand-text whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-mono">
              {prompt}
            </pre> */}
          </section>
        </div>
      </div>
    </div>
  );
}
