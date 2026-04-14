'use client';

import { useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import type { ConceptSuggestion } from '@/types/concept';

interface Props {
  open: boolean;
  onClose: () => void;
  selectedConcept: ConceptSuggestion;
}

const PROMPT_TEMPLATE = `<메시지 작성 프롬프트>

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

function buildPrompt(concept: string): string {
  return PROMPT_TEMPLATE.replace('{concept}', concept);
}

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-[#10a37f]' },
  { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-[#4285f4]' },
];

export function MessagePlanningModal({ open, onClose, selectedConcept }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const prompt = buildPrompt(selectedConcept.text);

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
            <h2 className="text-xl font-bold text-brand-text">이모티콘 메시지 기획하기</h2>
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
            <h3 className="text-base font-bold text-brand-text">AI로 메시지 기획하기</h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              아래 프롬프트를 복사한 후, ChatGPT 또는 Gemini에 붙여넣으세요.
              <br />
              <span className="text-brand-text font-medium">컨셉은 자동으로 입력</span>되어 있으며,
              나머지 항목은 내 캐릭터에 맞게 직접 채워주세요.
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
            <pre className="w-full rounded-2xl border border-brand-divider bg-brand-bg p-4 text-xs text-brand-text whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-mono">
              {prompt}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
