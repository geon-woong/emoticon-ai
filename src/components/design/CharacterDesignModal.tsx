'use client';

import { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';

export interface CharacterDesignParams {
  concept: string;
  characterType: string;
  bodyType: string;
  drawingStyle: string;
  features: string;
  colorStyle: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  params: CharacterDesignParams;
}

const PROMPT_TEMPLATE = `첨부된 캐릭터 러프 스케치와 입력정보를 기반으로, 러프 스케치 이미지가 없다면 입력 정보만을 바탕으로
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

function buildPrompt(params: CharacterDesignParams): string {
  return PROMPT_TEMPLATE
    .replace('{concept}', params.concept)
    .replace('{characterType}', params.characterType)
    .replace('{bodyType}', params.bodyType)
    .replace('{style}', params.drawingStyle)
    .replace('{features}', params.features)
    .replace('{colorStyle}', params.colorStyle);
}

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-[#10a37f]' },
  { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-[#4285f4]' },
];

export function CharacterDesignModal({ open, onClose, params }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const prompt = buildPrompt(params);

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
            <h2 className="text-xl font-bold text-brand-text">캐릭터 디자인 프롬프트</h2>
            <p className="mt-0.5 text-sm text-brand-muted">컨셉: {params.concept}</p>
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
            <h3 className="text-base font-bold text-brand-text">AI 이미지 생성 도구에 사용하기</h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              아래 프롬프트를 복사한 후 ChatGPT 또는 Gemini에 붙여넣으세요.
              <br />
              <span className="text-brand-text font-medium">러프 스케치 이미지가 있다면 함께 첨부</span>하면 더 정확한 결과를 얻을 수 있어요.
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

          {/* 입력 요약 */}
          <section className="rounded-2xl border border-brand-divider bg-brand-bg px-4 py-3 text-sm space-y-1">
            <p className="text-brand-muted"><span className="font-medium text-brand-text">컨셉</span>: {params.concept}</p>
            <p className="text-brand-muted"><span className="font-medium text-brand-text">캐릭터 주체</span>: {params.characterType}</p>
            <p className="text-brand-muted"><span className="font-medium text-brand-text">구조</span>: {params.bodyType} · <span className="font-medium text-brand-text">그림체</span>: {params.drawingStyle}</p>
            <p className="text-brand-muted"><span className="font-medium text-brand-text">개성 요소</span>: {params.features}</p>
            <p className="text-brand-muted"><span className="font-medium text-brand-text">색감</span>: {params.colorStyle}</p>
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
            <pre className="w-full rounded-2xl border border-brand-divider bg-brand-bg p-4 text-xs text-brand-text whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-mono">
              {prompt}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
