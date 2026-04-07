import { describe, it, expect } from 'vitest';
import { recommendConcepts, type RecommendData } from './rule-based';
import type { WizardSelection } from '@/types/concept';

const data: RecommendData = {
  personalities: [
    { id: 'passionate', label: '열정적인', tone: 'active' },
    { id: 'calm', label: '차분한', tone: 'calm' },
  ],
  jobs: [
    {
      id: 'office_worker',
      label: '직장인',
      modifiers: ['열정 가득 사회 초년생', '야근하는', '월요병 가득한', '퇴사 꿈꾸는'],
    },
    { id: 'developer', label: '개발자', modifiers: ['주니어', '시니어'] },
  ],
  relationships: [
    { id: 'couple', label: '커플', modifiers: ['100일 된', '권태기'] },
  ],
  hobbies: [
    { id: 'gaming', label: '게임', modifiers: ['밤샘', '랭커', '초보'] },
  ],
  sports: [
    {
      id: 'swimming',
      label: '수영',
      modifiers: ['8년차 고수', '초보', '새벽반'],
    },
  ],
  modifiers: {
    skillLevel: ['입문자', '8년차 고수'],
    intensity: ['진심인'],
    context: ['주말마다'],
  },
};

const fullSelection: WizardSelection = {
  age: '20s',
  gender: 'female',
  personalities: ['passionate', 'calm'],
  job: 'office_worker',
  relationship: 'couple',
  hobby: 'gaming',
  sport: 'swimming',
};

describe('recommendConcepts', () => {
  it('4개 주제 모두 선택 + 성격 2개 → 각 주제별 3개 컨셉 생성', () => {
    const result = recommendConcepts(fullSelection, data, { seed: 42 });
    expect(Object.keys(result.bySubject).sort()).toEqual(
      ['hobby', 'job', 'relationship', 'sport'].sort()
    );
    expect(result.bySubject.job?.length).toBe(3);
    expect(result.bySubject.relationship?.length).toBe(3);
    expect(result.bySubject.hobby?.length).toBe(3);
    expect(result.bySubject.sport?.length).toBe(3);
  });

  it('일부 주제만 선택하면 결과에 해당 키만 존재', () => {
    const result = recommendConcepts(
      { ...fullSelection, relationship: null, hobby: null },
      data,
      { seed: 42 }
    );
    expect(Object.keys(result.bySubject).sort()).toEqual(['job', 'sport']);
  });

  it('주제 혼합 금지: 모든 컨셉 텍스트는 자기 주제 label만 포함', () => {
    const result = recommendConcepts(fullSelection, data, { seed: 7 });
    const allLabels = {
      job: '직장인',
      relationship: '커플',
      hobby: '게임',
      sport: '수영',
    } as const;

    for (const [key, concepts] of Object.entries(result.bySubject)) {
      for (const c of concepts ?? []) {
        const ownLabel = allLabels[key as keyof typeof allLabels];
        expect(c.text).toContain(ownLabel);
        for (const [otherKey, otherLabel] of Object.entries(allLabels)) {
          if (otherKey === key) continue;
          expect(c.text).not.toContain(otherLabel);
        }
      }
    }
  });

  it('모든 컨셉 텍스트는 "컨셉"으로 끝남', () => {
    const result = recommendConcepts(fullSelection, data, { seed: 1 });
    for (const concepts of Object.values(result.bySubject)) {
      for (const c of concepts ?? []) {
        expect(c.text.endsWith('컨셉')).toBe(true);
      }
    }
  });

  it('동일 seed로 두 번 호출하면 결정적으로 동일', () => {
    const a = recommendConcepts(fullSelection, data, { seed: 123 });
    const b = recommendConcepts(fullSelection, data, { seed: 123 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('항목 modifier가 비어 있어도 fallback 풀로 컨셉 생성', () => {
    const dataNoMod: RecommendData = {
      ...data,
      jobs: [{ id: 'office_worker', label: '직장인' }],
    };
    const result = recommendConcepts(
      { ...fullSelection, relationship: null, hobby: null, sport: null },
      dataNoMod,
      { seed: 99 }
    );
    expect(result.bySubject.job?.length).toBe(3);
    for (const c of result.bySubject.job ?? []) {
      expect(c.text).toContain('직장인');
      expect(c.text.endsWith('컨셉')).toBe(true);
    }
  });

  it('성격이 비어 있어도 modifier만으로 컨셉 생성', () => {
    const result = recommendConcepts(
      { ...fullSelection, personalities: [], relationship: null, hobby: null, sport: null },
      data,
      { seed: 5 }
    );
    expect(result.bySubject.job?.length).toBe(3);
    for (const c of result.bySubject.job ?? []) {
      expect(c.parts.personalityLabel).toBeUndefined();
      expect(c.parts.modifier).toBeDefined();
    }
  });
});
