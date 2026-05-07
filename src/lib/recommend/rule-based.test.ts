import { describe, it, expect } from 'vitest';
import { recommendConcepts, type RecommendData } from './rule-based';
import type { WizardSelection } from '@/types/concept';

const data: RecommendData = {
  personalities: [
    { id: 'passionate', label: '열정적인' },
    { id: 'calm', label: '차분한' },
    { id: 'funny', label: '유쾌한' },
  ],
  jobs: [
    { id: 'office_worker', label: '직장인' },
    { id: 'developer', label: '개발자' },
  ],
  relationships: [
    { id: 'couple', label: '커플' },
  ],
  hobbies: [
    { id: 'gaming', label: '게임' },
  ],
  sports: [
    { id: 'swimming', label: '수영' },
  ],
};

const fullSelection: WizardSelection = {
  age: '20s',
  gender: 'female',
  personalities: ['passionate', 'calm', 'funny'],
  jobs: ['office_worker'],
  relationships: ['couple'],
  hobbies: ['gaming'],
  sports: ['swimming'],
  speechStyle: null,
};

describe('recommendConcepts', () => {
  it('4개 주제 모두 선택 + 성격 3개 → 각 주제별 1~3개 컨셉 생성', () => {
    const result = recommendConcepts(fullSelection, data, { seed: 42 });
    expect(Object.keys(result.bySubject).sort()).toEqual(
      ['hobby', 'job', 'relationship', 'sport'].sort()
    );
    expect(result.bySubject.job?.length).toBeGreaterThanOrEqual(1);
    expect(result.bySubject.job?.length).toBeLessThanOrEqual(3);
    expect(result.bySubject.relationship?.length).toBeGreaterThanOrEqual(1);
    expect(result.bySubject.relationship?.length).toBeLessThanOrEqual(3);
    expect(result.bySubject.hobby?.length).toBeGreaterThanOrEqual(1);
    expect(result.bySubject.hobby?.length).toBeLessThanOrEqual(3);
    expect(result.bySubject.sport?.length).toBeGreaterThanOrEqual(1);
    expect(result.bySubject.sport?.length).toBeLessThanOrEqual(3);
  });

  it('일부 주제만 선택하면 결과에 해당 키만 존재', () => {
    const result = recommendConcepts(
      { ...fullSelection, relationships: [], hobbies: [] },
      data,
      { seed: 42 }
    );
    expect(Object.keys(result.bySubject).sort()).toEqual(['job', 'sport']);
  });

  it('직업 다중 선택: 2개 직업 선택 시 각각 컨셉 생성', () => {
    const result = recommendConcepts(
      { ...fullSelection, jobs: ['office_worker', 'developer'], relationships: [], hobbies: [], sports: [] },
      data,
      { seed: 10 }
    );
    const jobConcepts = result.bySubject.job ?? [];
    expect(jobConcepts.length).toBeGreaterThanOrEqual(2);
    const hasOfficer = jobConcepts.some((c) => c.text.includes('직장인'));
    const hasDev = jobConcepts.some((c) => c.text.includes('개발자'));
    expect(hasOfficer).toBe(true);
    expect(hasDev).toBe(true);
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

  it('성격 미선택 시 "{subject} 컨셉" 형태로 생성', () => {
    const result = recommendConcepts(
      { ...fullSelection, personalities: [], relationships: [], hobbies: [], sports: [] },
      data,
      { seed: 5, perSubject: 1 }
    );
    expect(result.bySubject.job?.length).toBe(1);
    for (const c of result.bySubject.job ?? []) {
      expect(c.parts.personalityLabel).toBeUndefined();
      expect(c.text).toBe('직장인 컨셉');
    }
  });
});
