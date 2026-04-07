# emoticon-ai

이모티콘 작가를 위한 컨셉/캐릭터/메시지 도우미 웹 서비스. 이번 단계는 시작 페이지와 **이모티콘 컨셉 찾기** 위저드만 구현되어 있다.

## 개발 명령어

```bash
npm install
npm run dev          # http://localhost:3000 (Turbopack)
npm run build        # production build
npm start
npm run lint         # ESLint
npm run test         # Vitest watch
npm run test:run     # Vitest 단발 실행
```

`.env.local`에 `ANTHROPIC_API_KEY=...`를 설정하면 결과 화면의 "AI 추천 받기" 버튼이 동작한다. 없으면 503을 반환하고 룰 기반 추천만 사용한다.

## 아키텍처 개요

### 라우트
- `/` — 시작 페이지. 3개 카드(컨셉/캐릭터/메시지) 중 컨셉만 활성.
- `/concept` — 7단계 위저드(나이→성별→성격→직업→관계→취미→운동). 단일 페이지에서 store의 `currentStep`으로 단계 컴포넌트를 스왑한다.
- `/concept/result` — 룰 기반 결과 + AI 추천 섹션.
- `/character`, `/message` — placeholder.
- `/api/recommend-concept` — Claude API 호출 (Node 런타임).

### 컨셉 찾기 핵심 모듈
- [src/types/concept.ts](src/types/concept.ts) — 도메인 타입 (`WizardSelection`, `ConceptSuggestion`, `RecommendResult`).
- [src/data/keywords/](src/data/keywords/) — 모든 키워드 JSON. 데이터 추가는 이 폴더의 JSON만 편집하면 된다.
- [src/lib/recommend/rule-based.ts](src/lib/recommend/rule-based.ts) — 결정론적 추천 함수. 추천 원칙 5가지를 코드 레벨에서 강제.
- [src/lib/llm/concept-prompt.ts](src/lib/llm/concept-prompt.ts) — system prompt + 사용자 메시지 빌더, JSON 추출 헬퍼.
- [src/stores/concept-wizard-store.ts](src/stores/concept-wizard-store.ts) — Zustand + persist(sessionStorage).
- [src/components/concept/](src/components/concept/) — 위저드/결과 UI.

### 추천 원칙 (반드시 준수)

1. **성격 1개 + (직업/관계/취미/운동) 1개**의 조합으로 컨셉을 만든다.
2. **주제를 혼합하지 않는다.** 한 컨셉에는 한 주제만 등장.
3. modifier(수식어)를 붙여 단순한 "X 컨셉"을 피한다.
4. 짧고 간결하게 (4어절 이내).
5. 각 주제별로 3개씩 추천.

이 원칙은 [rule-based.ts](src/lib/recommend/rule-based.ts)에서 코드로 강제되며 [rule-based.test.ts](src/lib/recommend/rule-based.test.ts)에서 vitest로 검증된다.

### 데이터 추가 방법

각 주제(`jobs`, `relationships`, `hobbies`, `sports`)는 다음 형태:

```json
{ "id": "unique_id", "label": "한국어 라벨", "modifiers": ["수식어1", "수식어2"] }
```

- `label`은 최종 컨셉 문구에 그대로 들어가므로 짧게 작성.
- `modifiers`는 각 항목에 어울리는 1~6개의 수식어 (없으면 `src/data/keywords/modifiers.json`의 fallback 풀이 사용됨).
- `personalities`의 `label`은 한국어 형용사형 (예: "열정적인").

데이터만 추가하면 코드 변경 없이 추천 다양성이 늘어난다.

## 기술 스택

- Next.js 15.5 (App Router, Turbopack), React 19, TypeScript strict + `noUncheckedIndexedAccess`
- Tailwind CSS v4 (PostCSS) — `@theme` 토큰 기반
- Zustand 5 + persist (sessionStorage)
- @anthropic-ai/sdk (Claude API)
- sonner (toast), lucide-react (아이콘)
- vitest (단위 테스트)

## 디자인 토큰

[src/app/globals.css](src/app/globals.css)의 `@theme` 블록에 brand 색상이 정의되어 있다 (`--color-brand-text`, `--color-brand-selected`, `--color-brand-btn2` 등). 한글 폰트로 Black Han Sans / Jua / Gaegu를 사용한다.

## 주의: 정적 export 미사용

API route(`/api/recommend-concept`)가 필요하므로 `output: 'export'`는 사용하지 않는다. 정적 사이트로만 배포하려면 LLM 추천 기능을 떼어내야 한다.
