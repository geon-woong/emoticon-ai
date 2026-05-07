import type {
  KeywordItem,
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
 *  3. 짧고 간결하게 (4어절 이내).
 *  4. 선택된 주제별로 perSubject(=3) 개씩 생성한다.
 */
export function recommendConcepts(
  selection: WizardSelection,
  data: RecommendData,
  options: RecommendOptions = {}
): RecommendResult {
  const rng = createSeededRng(options.seed ?? Date.now());

  const subjects: ReadonlyArray<readonly [SubjectKey, string[], KeywordItem[]]> = [
    ['job', selection.jobs, data.jobs],
    ['relationship', selection.relationships, data.relationships],
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

      const itemCount = options.perSubject ?? 1;
      const concepts: ConceptSuggestion[] = [];
      const used = new Set<string>();
      const maxAttempts = itemCount * 8;
      let attempts = 0;

      while (concepts.length < itemCount && attempts < maxAttempts) {
        attempts++;

        const personality =
          personalityItems.length > 0 ? pickOne(personalityItems, rng) : null;

        const text = composeText({
          personalityLabel: personality?.label,
          subjectLabel: subjectItem.label,
        });

        const sig = `${personality?.id ?? ''}|${subjectItem.id}`;
        if (used.has(sig)) continue;
        used.add(sig);

        concepts.push({
          id: hashString(sig),
          subject: subjectKey,
          text,
          parts: {
            personalityLabel: personality?.label,
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

interface ComposeInput {
  personalityLabel?: string;
  subjectLabel: string;
}

function composeText(input: ComposeInput): string {
  const tokens: string[] = [];
  if (input.personalityLabel) tokens.push(input.personalityLabel);
  tokens.push(input.subjectLabel);
  tokens.push('컨셉');
  return tokens.join(' ');
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
