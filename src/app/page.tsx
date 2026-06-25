'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, User, MessageCircle, Palette, Layers, RotateCcw, Lock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { PromptModal } from '@/components/ui/PromptModal';
import { SecretCodeModal } from '@/components/ui/SecretCodeModal';
import { useUnlockStore } from '@/stores/unlock-store';
import { cn } from '@/lib/utils/cn';

const GUIDE_COMBINER_PROMPT = `여러 개의 첨부 이미지를 분석하여,
내 캐릭터를 기반으로 이모티콘 한 컷을 완성하세요.

---

[이미지 자동 분류 규칙]

첨부된 이미지들의 순서는 일정하지 않으므로,
각 이미지를 분석하여 아래 역할로 자동 분류하세요.
없는 이미지의 경우 제외하면 됩니다.

- 캐릭터 이미지 (절대 기준)
- 동작 가이드
- 표정 가이드
- 소품 가이드
- 효과 가이드
- 배경 가이드

각 이미지의 형태, 구성, 요소를 기반으로 가장 적절한 역할을 판단하세요.

---

[가장 중요한 기준 - 캐릭터 판별]

- 캐릭터 이미지 1개를 선택하여 절대 기준으로 사용하세요
- 가장 완성도가 높고 중심이 되는 캐릭터를 기준으로 판단
- 해당 캐릭터의 외형, 비율, 선 스타일은 절대 변경 금지

---

[작업 목표]

선택된 캐릭터를 유지한 상태에서,
다른 가이드 이미지의 요소들을 조합하여
하나의 이모티콘 컷으로 완성하세요.

---

[캐릭터 유지 규칙]

- 캐릭터 디자인 절대 변경 금지
- 얼굴 형태, 눈, 비율, 선 스타일 유지
- 캐릭터를 새로 그리지 말 것
- 동일한 캐릭터에 요소를 적용하는 방식으로 작업

---

[동작 적용 규칙]

- 동작 가이드의 포즈를 캐릭터에 적용
- 팔다리 구조는 캐릭터 기준 유지
- 과도한 변형 금지

---

[표정 적용 규칙]

- 표정 가이드를 참고하여 얼굴에 적용
- 눈과 입 중심으로 감정 표현
- 캐릭터 스타일 유지

---

[소품 적용 규칙]

- 소품은 캐릭터와 자연스럽게 조합
- 캐릭터를 과도하게 가리지 않도록 배치
- 크기와 위치는 균형 있게 조절

---

[효과 적용 규칙]

- 효과는 보조 요소로 사용
- 캐릭터보다 강조되지 않도록
- 과도한 사용 금지

---

[배경 적용 규칙]

- 배경 가이드를 참고하여 구성
- 캐릭터가 잘 보이도록 단순하게 유지
- 복잡한 요소 추가 금지

---

[이모티콘 최적화 규칙]

- 작은 사이즈에서도 캐릭터가 명확하게 보일 것
- 실루엣이 유지되도록 구성
- 캐릭터 중심 구도 유지

---

[스타일 유지 규칙]

- 원본 캐릭터 선 스타일 유지
- 손그림 느낌 유지
- AI 특유의 매끈한 스타일 금지
- 완벽한 대칭 금지

---

[색상 규칙]

- 기존 캐릭터의 색상 톤과 분위기를 유지할 것
- 추가 색상은 캐릭터 색감과 자연스럽게 어울리도록 제한적으로 사용
- 색상 대비를 활용해 캐릭터가 잘 보이도록 구성

---

[레이어 우선순위]

1. 캐릭터
2. 동작 / 표정
3. 소품
4. 효과
5. 배경

→ 캐릭터가 항상 가장 강조되어야 함

---

[출력 설정]

- 1080 x 1080 px
- 72 dpi
- 정사각형
- 배경 투명 (PNG)
- 이모티콘 1컷 완성 이미지

---

[절대 금지]

- 캐릭터 리디자인
- 스타일 변경
- 과도한 요소 추가
- 복잡한 구성
- 캐릭터 가림
- 이미지 역할 오판

---

최종 결과는
"카카오 이모티콘으로 바로 사용할 수 있는 완성 컷"으로 출력하세요.`;

const TURNAROUND_PROMPT = `두 개의 이미지를 참고하여 캐릭터 턴어라운드 시트를 제작하세요.

[참고 이미지 역할]

- 이미지 1: 캐릭터 원본 (디자인, 색상, 비율, 선 스타일의 절대 기준)
- 이미지 2: 턴어라운드 가이드 (구도 및 배치 기준)

---

[작업 목표]

이미지 1의 캐릭터를 "그대로 유지"한 상태에서,
이미지 2의 구도를 따라 턴어라운드 시트를 구성하세요.

이 작업은 새로운 캐릭터를 만드는 것이 아니라,
기존 캐릭터를 다양한 각도로 "회전 표현"하는 작업입니다.

---

[구도 규칙]

왼쪽부터 순서대로 정확히 배치하세요:

1. 왼쪽 90도 측면
2. 왼쪽 45도 사선
3. 정면
4. 뒷면
- 모든 캐릭터는 동일한 크기와 간격으로 정렬
- 하나의 시트(한 장 이미지)로 구성

---

[캐릭터 유지 규칙 - 가장 중요]

- 이미지 1의 캐릭터를 절대 변경하지 말 것
- 얼굴 형태, 눈, 코, 입, 비율, 체형, 색상 모두 유지
- 선 스타일, 선 굵기 유지
- 기존에 없는 요소 추가 금지
- 기존 요소 삭제 금지
- 단순화, 디테일 축소, 재해석 금지
- "같은 캐릭터를 다른 각도로 본 모습"이어야 함

---

[턴어라운드 정확도 규칙]

- 정면 기준 비율을 모든 각도에서 동일하게 유지
- 머리 크기, 몸 비율, 눈 위치 변화 금지
- 각도만 달라지고 캐릭터 자체는 동일해야 함

---

[보이지 않는 부분 처리 규칙]

- 측면/후면에서 보이지 않던 부분은 최소한으로 자연스럽게 보완
- 임의 디자인 추가 금지
- 원본 스타일과 어긋나지 않게 보수적으로 표현

---

[스타일 규칙]

- 원본 이미지의 선 스타일을 그대로 유지
- 손그림 느낌 유지 (삐뚤고 자연스러운 선 허용)
- AI 특유의 매끈한 벡터 스타일 금지
- 과도한 대칭 및 기하학적 형태 금지

---

[출력 설정]

- 해상도: 1920x1080px
- DPI: 72
- 배경: 흰색 단색
- 채색 포함 (원본 색상 그대로 사용)

---

[절대 금지 사항]

- 캐릭터 리디자인
- 스타일 변경
- 디테일 단순화 또는 제거
- 새로운 장식 추가
- 캐릭터가 다른 개체처럼 보이게 만드는 것

---

최종 결과는 하나의 턴어라운드 시트 이미지로 출력하세요.`;

type PromptKey = 'guide-combiner' | 'turnaround';

interface PromptConfig {
  title: string;
  prompt: string;
  description?: string;
}

const PROMPTS: Record<PromptKey, PromptConfig> = {
  'guide-combiner': {
    title: '이모티콘 가이드 조합기 프롬프트',
    prompt: GUIDE_COMBINER_PROMPT,
    description:
      '이모티콘 가이드 조합기는 출력된 캐릭터 이미지와 제공된 가이드 이미지를 AI에 업로드해 사용할 수 있어요',
  },
  turnaround: {
    title: '캐릭터 턴어라운드 제작 프롬프트',
    prompt: TURNAROUND_PROMPT,
    description:
      '캐릭터 턴어라운드는 본인 캐릭터 이미지와 제공된 턴어라운드 이미지를 AI에 업로드해 사용할 수 있어요',
  },
};

interface NavFeatureCard {
  type: 'nav';
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface PromptFeatureCard {
  type: 'prompt';
  promptKey: PromptKey;
  title: string;
  description: string;
  icon: React.ReactNode;
}

type FeatureCard = NavFeatureCard | PromptFeatureCard;

const FEATURES: FeatureCard[] = [
  {
    type: 'nav',
    href: '/concept',
    title: '이모티콘 컨셉 찾기',
    description: '키워드를 골라 어울리는 컨셉을 추천받아요',
    icon: <Sparkles className="h-8 w-8" />,
    enabled: true,
  },
  {
    type: 'nav',
    href: '/character',
    title: '캐릭터 주체 찾기',
    description: '컨셉에 어울리는 캐릭터 주체를 찾아요',
    icon: <User className="h-8 w-8" />,
    enabled: true,
  },

  {
    type: 'nav',
    href: '/design',
    title: '캐릭터 디자인하기',
    description: '컨셉에 맞는 캐릭터를 AI로 디자인해요',
    icon: <Palette className="h-8 w-8" />,
    enabled: true,
  },
  {
    type: 'prompt',
    promptKey: 'turnaround',
    title: '캐릭터 턴어라운드 제작하기',
    description: '캐릭터 원본 이미지로 정면·측면·후면 턴어라운드 시트를 만드는 프롬프트',
    icon: <RotateCcw className="h-8 w-8" />,
  },
  {
    type: 'nav',
    href: '/message',
    title: '이모티콘 메시지 기획하기',
    description: '이모티콘에 들어갈 32개 메시지를 기획해요',
    icon: <MessageCircle className="h-8 w-8" />,
    enabled: true,
  },
  {
    type: 'prompt',
    promptKey: 'guide-combiner',
    title: '이모티콘 가이드 조합기',
    description: '캐릭터·동작·표정·소품 가이드를 조합해 한 컷을 완성하는 프롬프트',
    icon: <Layers className="h-8 w-8" />,
  },
];

export default function HomePage() {
  const [activePrompt, setActivePrompt] = useState<PromptKey | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const unlocked = useUnlockStore((s) => s.unlocked);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      <div className="space-y-12">
        <section className="space-y-3 text-center">
          <h1 className="text-5xl text-brand-text" style={{ fontFamily: 'Black Han Sans, sans-serif' }}>
            동동작가의 이모티콘 전용 AI
          </h1>
          <p className="text-base text-brand-muted">
            이모티콘 작업을 위한 컨셉 구상, 캐릭터 디자인, 메시지 기획 등 다양한 기능을 사용 해 보세요.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const isFree = f.type === 'nav' && f.href === '/concept';
            const isLocked = !isFree && (!mounted || !unlocked);
            const cardKey = f.type === 'nav' ? f.href : f.promptKey;

            const cardContent = (
              <Card
                className={cn(
                  'flex h-full flex-col items-center gap-4 p-6 text-center transition',
                  'cursor-pointer hover:-translate-y-1 hover:border-brand-selected hover:shadow-md',
                  isLocked && 'opacity-70',
                )}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-selected-bg text-brand-selected">
                  {f.icon}
                </div>
                <h2 className="text-xl font-bold text-brand-text">{f.title}</h2>
                <p className="text-sm text-brand-muted">{f.description}</p>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-divider px-3 py-1 text-xs font-bold text-brand-muted">
                    <Lock className="h-3 w-3" />
                    잠금
                  </span>
                )}
              </Card>
            );

            if (isLocked) {
              return (
                <button key={cardKey} className="text-left" onClick={() => setShowSecret(true)}>
                  {cardContent}
                </button>
              );
            }

            if (f.type === 'prompt') {
              return (
                <button key={f.promptKey} className="text-left" onClick={() => setActivePrompt(f.promptKey)}>
                  {cardContent}
                </button>
              );
            }

            return (
              <Link key={f.href} href={f.href}>
                {cardContent}
              </Link>
            );
          })}
        </section>
      </div>

      <PromptModal
        open={activePrompt !== null}
        title={activePrompt ? PROMPTS[activePrompt].title : ''}
        prompt={activePrompt ? PROMPTS[activePrompt].prompt : ''}
        description={activePrompt ? PROMPTS[activePrompt].description : undefined}
        onClose={() => setActivePrompt(null)}
      />

      <SecretCodeModal open={showSecret} onClose={() => setShowSecret(false)} />
    </>
  );
}
