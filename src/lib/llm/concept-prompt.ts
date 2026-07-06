import type { WizardSelection } from '@/types/concept';
import { customLabel, isCustomId } from '@/lib/concept/custom-id';

import ages from '@/data/keywords/ages.json';
import genders from '@/data/keywords/genders.json';
import personalities from '@/data/keywords/personalities.json';
import jobs from '@/data/keywords/jobs.json';
import relationships from '@/data/keywords/relationships.json';
import hobbies from '@/data/keywords/hobbies.json';
import sports from '@/data/keywords/sports.json';

interface LabelOnly {
  id: string;
  label: string;
}

const MAPS = {
  age: new Map((ages as LabelOnly[]).map((x) => [x.id, x.label])),
  gender: new Map((genders as LabelOnly[]).map((x) => [x.id, x.label])),
  personality: new Map((personalities as LabelOnly[]).map((x) => [x.id, x.label])),
  job: new Map((jobs as LabelOnly[]).map((x) => [x.id, x.label])),
  relationship: new Map((relationships as LabelOnly[]).map((x) => [x.id, x.label])),
  hobby: new Map((hobbies as LabelOnly[]).map((x) => [x.id, x.label])),
  sport: new Map((sports as LabelOnly[]).map((x) => [x.id, x.label])),
};

export const SYSTEM_PROMPT = `당신은 한국 이모티콘 작가의 컨셉 기획을 돕는 어시스턴트입니다.
반드시 다음 규칙을 따르세요:

1. 각 컨셉은 사용자가 선택한 성격 1개 + (직업/관계/취미/운동) 중 1개의 조합입니다.
2. 직업, 관계, 취미, 운동을 서로 혼합하지 마세요. 한 컨셉에는 한 주제만 등장합니다.
3. 성격 특성이 자연스럽게 드러나는 컨셉을 만드세요. 단순히 "X 컨셉"만으로 끝내지 마세요.
4. 짧고 간결해야 합니다 (최대 4어절). 모든 컨셉 문구는 "컨셉"으로 끝납니다.
5. 사용자가 선택한 주제(직업/관계/취미/운동)별로 정확히 3개씩 추천합니다. 사용자가 선택하지 않은 주제는 출력에 포함하지 않습니다.
6. 사용자가 이미 본 컨셉(excludeTexts)과 똑같은 문구는 만들지 마세요.

좋은 예: "열정적인 직장인 컨셉", "차분한 수영 컨셉", "유쾌한 커플 컨셉"
나쁜 예: "수영 컨셉", "직장인이 취미로 수영하는 컨셉", "직업과 취미를 합친 컨셉"

출력은 반드시 아래 JSON 스키마만 반환합니다. 다른 텍스트를 포함하지 마세요:
{
  "bySubject": {
    "job":          [{ "text": "..." }, { "text": "..." }, { "text": "..." }],
    "relationship": [{ "text": "..." }, { "text": "..." }, { "text": "..." }],
    "hobby":        [{ "text": "..." }, { "text": "..." }, { "text": "..." }],
    "sport":        [{ "text": "..." }, { "text": "..." }, { "text": "..." }]
  }
}`;

export function buildConceptPrompt(
  selection: WizardSelection,
  excludeTexts: string[] = []
): { system: string; user: string } {
  const resolve = (id: string, map: Map<string, string>): string | undefined =>
    isCustomId(id) ? customLabel(id) : map.get(id);

  const ageLabel = selection.age ? resolve(selection.age, MAPS.age) : null;
  const genderLabel = selection.gender ? resolve(selection.gender, MAPS.gender) : null;
  const personalityLabels = selection.personalities
    .map((id) => resolve(id, MAPS.personality))
    .filter((x): x is string => Boolean(x));

  const subjects: { key: string; labels: string[] }[] = [];
  if (selection.jobs.length > 0) {
    const labels = selection.jobs.map((id) => resolve(id, MAPS.job)).filter((x): x is string => Boolean(x));
    if (labels.length > 0) subjects.push({ key: '직업', labels });
  }
  if (selection.relationships.length > 0) {
    const labels = selection.relationships.map((id) => resolve(id, MAPS.relationship)).filter((x): x is string => Boolean(x));
    if (labels.length > 0) subjects.push({ key: '관계', labels });
  }
  if (selection.hobbies.length > 0) {
    const labels = selection.hobbies.map((id) => resolve(id, MAPS.hobby)).filter((x): x is string => Boolean(x));
    if (labels.length > 0) subjects.push({ key: '취미', labels });
  }
  if (selection.sports.length > 0) {
    const labels = selection.sports.map((id) => resolve(id, MAPS.sport)).filter((x): x is string => Boolean(x));
    if (labels.length > 0) subjects.push({ key: '운동', labels });
  }

  const lines: string[] = ['사용자 선택 정보:'];
  if (ageLabel) lines.push(`- 나이: ${ageLabel}`);
  if (genderLabel) lines.push(`- 성별: ${genderLabel}`);
  if (personalityLabels.length > 0)
    lines.push(`- 성격: ${personalityLabels.join(', ')}`);
  for (const s of subjects) {
    lines.push(`- ${s.key}: ${s.labels.join(', ')}`);
  }

  if (excludeTexts.length > 0) {
    lines.push('');
    lines.push('이미 사용자에게 보여준 컨셉 (중복 금지):');
    for (const t of excludeTexts) lines.push(`- ${t}`);
  }

  lines.push('');
  lines.push(
    `위 정보를 바탕으로 추천 원칙 5가지를 지키며, 선택된 주제(${subjects
      .map((s) => `${s.key}: ${s.labels.join(', ')}`)
      .join(' / ')})별로 각 아이템마다 3개씩 컨셉을 JSON으로 반환하세요.`
  );

  return { system: SYSTEM_PROMPT, user: lines.join('\n') };
}

/**
 * LLM 응답에서 첫 번째 JSON 객체를 관대하게 추출.
 * 코드 펜스(```json ... ```)나 부수 텍스트가 섞여 있어도 동작.
 */
export function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM 응답에서 JSON을 찾지 못했습니다.');
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
