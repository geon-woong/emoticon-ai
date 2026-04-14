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

function buildPrompt(params: {
  age: string;
  gender: string;
  personality: string;
  speechStyle: string;
  concept: string;
}): string {
  return PROMPT_TEMPLATE
    .replace('{age}', params.age)
    .replace('{gender}', params.gender)
    .replace('{personality}', params.personality)
    .replace('{speach-styles}', params.speechStyle)
    .replace('{concept}', params.concept);
}

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-[#10a37f]' },
  { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-[#4285f4]' },
];

export function ConceptDetailModal({
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
            <h2 className="text-xl font-bold text-brand-text">컨셉 구체화하기</h2>
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
            <h3 className="text-base font-bold text-brand-text">AI로 구체화하기</h3>
            <p className="text-sm text-brand-muted">
              아래 프롬프트를 복사한 후, ChatGPT 또는 Gemini에 붙여넣어 컨셉을 구체화해보세요.
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
