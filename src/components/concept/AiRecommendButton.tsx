'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import type { ConceptSuggestion, RecommendResult, SubjectKey, WizardSelection } from '@/types/concept';

interface Props {
  selection: WizardSelection;
  excludeTexts: string[];
  onResult: (result: RecommendResult) => void;
}

export function AiRecommendButton({ selection, excludeTexts, onResult }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/recommend-concept', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ selection, excludeTexts }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          (typeof json === 'object' && json && 'error' in json && typeof (json as { error: unknown }).error === 'string'
            ? (json as { error: string }).error
            : null) ?? 'AI 추천에 실패했습니다.';
        toast.error(msg);
        return;
      }
      const normalized = normalizeResult(json);
      onResult(normalized);
      toast.success('AI 추천이 도착했어요!');
    } catch (err) {
      console.error('[AiRecommendButton] failed', err);
      toast.error('AI 추천 호출 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Sparkles className="h-5 w-5" />
      )}
      {loading ? 'AI가 생각 중...' : 'AI 추천 받기'}
    </Button>
  );
}

/** 서버 응답을 RecommendResult로 정규화 (parts 누락 등 방어). */
function normalizeResult(json: unknown): RecommendResult {
  const empty: RecommendResult = { bySubject: {} };
  if (!json || typeof json !== 'object' || !('bySubject' in json)) return empty;
  const bySubject = (json as { bySubject: unknown }).bySubject;
  if (!bySubject || typeof bySubject !== 'object') return empty;

  const out: RecommendResult = { bySubject: {} };
  for (const key of ['job', 'relationship', 'hobby', 'sport'] as SubjectKey[]) {
    const arr = (bySubject as Record<string, unknown>)[key];
    if (!Array.isArray(arr)) continue;
    out.bySubject[key] = arr
      .map((item, i): ConceptSuggestion | null => {
        if (!item || typeof item !== 'object') return null;
        const text = (item as { text?: unknown }).text;
        if (typeof text !== 'string' || text.length === 0) return null;
        return {
          id: `llm-${key}-${i}-${text.length}`,
          subject: key,
          text,
          parts: { subjectLabel: '' },
          source: 'llm',
        };
      })
      .filter((x): x is ConceptSuggestion => x !== null);
  }
  return out;
}
