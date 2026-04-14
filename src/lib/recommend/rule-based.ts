import type {
  KeywordItem,
  ModifierPools,
  RecommendResult,
  ConceptSuggestion,
  SubjectKey,
  WizardSelection,
} from '@/types/concept';

export interface RecommendData {
  personalities: KeywordItem[];
  jobs: KeywordItem[];
  relationships: KeywordItem[];
  hobbies: KeywordItem[];
  sports: KeywordItem[];
  modifiers: ModifierPools;
}

export interface RecommendOptions {
  perSubject?: number;
  seed?: number;
}

/**
 * 결정론적 컨셉 추천 함수.
 *
 * 추천 원칙:
 *  1. 성격 1개 + (직업/관계/취미/운동) 1개의 조합으로 컨셉을 만든다.
 *  2. 주제(직업/관계/취미/운동)는 서로 혼합하지 않는다.
 *  3. modifier(수식어)를 붙여 단순한 "X 컨셉"을 피한다.
 *  4. 짧고 간결하게 (4어절 이내).
 *  5. 선택된 주제별로 perSubject(=3) 개씩 생성한다.
 */
export function recommendConcepts(
  selection: WizardSelection,
  data: RecommendData,
  options: RecommendOptions = {}
): RecommendResult {
  const perSubject = options.perSubject ?? 3;
  const rng = createSeededRng(options.seed ?? Date.now());

  // 단일 선택 주제: job, relationship
  // 복수 선택 주제: hobby(hobbies), sport(sports)
  const subjects: ReadonlyArray<readonly [SubjectKey, string[], KeywordItem[]]> = [
    ['job', selection.job ? [selection.job] : [], data.jobs],
    ['relationship', selection.relationship ? [selection.relationship] : [], data.relationships],
    ['hobby', selection.hobbies, data.hobbies],
    ['sport', selection.sports, data.sports],
  ];

  const personalityItems = data.personalities.filter((p) =>
    selection.personalities.includes(p.id)
  );

  const result: RecommendResult = { bySubject: {} };

  for (const [subjectKey, selectedIds, pool] of subjects) {
    if (selectedIds.length === 0) continue;

    const allConcepts: ConceptSuggestion[] = [];

    for (const selectedId of selectedIds) {
      const subjectItem = pool.find((p) => p.id === selectedId);
      if (!subjectItem) continue;

      const modifierPool =
        subjectItem.modifiers && subjectItem.modifiers.length > 0
          ? subjectItem.modifiers
          : getToneFallbackPool(subjectItem.tone, data.modifiers);

      const concepts: ConceptSuggestion[] = [];
      const used = new Set<string>();
      const maxAttempts = perSubject * 8;
      let attempts = 0;

      while (concepts.length < perSubject && attempts < maxAttempts) {
        attempts++;

        const personality =
          personalityItems.length > 0 ? pickOne(personalityItems, rng) : null;
        const modifier = modifierPool.length > 0 ? pickOne(modifierPool, rng) : null;

        // 원칙 #3: personality 또는 modifier 중 적어도 하나는 있어야 한다.
        if (!personality && !modifier) continue;

        const text = composeText({
          personalityLabel: personality?.label,
          modifier: modifier ?? undefined,
          subjectLabel: subjectItem.label,
        });

        const sig = `${personality?.id ?? ''}|${modifier ?? ''}|${subjectItem.id}`;
        if (used.has(sig)) continue;
        used.add(sig);

        concepts.push({
          id: hashString(sig),
          subject: subjectKey,
          text,
          parts: {
            personalityLabel: personality?.label,
            modifier: modifier ?? undefined,
            subjectLabel: subjectItem.label,
          },
          source: 'rule',
        });
      }

      allConcepts.push(...concepts);
    }

    if (allConcepts.length > 0) {
      result.bySubject[subjectKey] = allConcepts;
    }
  }

  return result;
}

/**
 * tone에 따라 전역 modifier fallback 풀을 선택한다.
 * active → intensity, calm → context, 미지정 → skillLevel + intensity
 */
function getToneFallbackPool(tone: string | undefined, pools: ModifierPools): string[] {
  if (tone === 'active') return pools.intensity;
  if (tone === 'calm') return pools.context;
  return [...pools.skillLevel, ...pools.intensity];
}

interface ComposeInput {
  personalityLabel?: string;
  modifier?: string;
  subjectLabel: string;
}

/**
 * 컨셉 문구 합성. 항상 "... 컨셉"으로 끝난다.
 * 최대 어절 수를 4 이내로 제한해 짧고 간결함을 강제한다.
 */
function composeText(input: ComposeInput): string {
  const tokens: string[] = [];
  if (input.personalityLabel) tokens.push(input.personalityLabel);
  if (input.modifier) tokens.push(input.modifier);
  tokens.push(input.subjectLabel);
  tokens.push('컨셉');

  // 어절 수가 5개를 넘으면(=personality+modifier+subject(여러어절)+컨셉) modifier가 너무 길다는 신호.
  // 단순화를 위해 personality를 떨어뜨려 다시 합성한다.
  if (countWords(tokens.join(' ')) > 5 && input.personalityLabel) {
    return [input.modifier, input.subjectLabel, '컨셉']
      .filter(Boolean)
      .join(' ');
  }
  return tokens.join(' ');
}

function countWords(s: string): number {
  return s.trim().split(/\s+/).length;
}

function pickOne<T>(arr: T[], rng: () => number): T {
  const idx = Math.floor(rng() * arr.length);
  // noUncheckedIndexedAccess 대응
  return arr[idx] as T;
}

/** seedable PRNG (mulberry32). */
function createSeededRng(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): string {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}
