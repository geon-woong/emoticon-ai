'use client';

import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import type { KeywordItem } from '@/types/concept';
import { cn } from '@/lib/utils/cn';
import { customLabel, isCustomId, makeCustomId } from '@/lib/concept/custom-id';

interface Props {
  items: KeywordItem[];
  mode: 'single' | 'multi';
  selectedIds: string[];
  onToggle: (id: string) => void;
  maxReached?: boolean;
  allowCustom?: boolean;
}


export function KeywordGrid({ items, mode, selectedIds, onToggle, maxReached, allowCustom }: Props) {
  const [draft, setDraft] = useState('');

  // JSON에 없는 커스텀 선택 항목을 뒤에 이어 렌더링
  const knownIds = new Set(items.map((i) => i.id));
  const customItems: KeywordItem[] = selectedIds
    .filter((id) => isCustomId(id) && !knownIds.has(id))
    .map((id) => ({ id, label: customLabel(id) }));
  const displayItems = [...customItems, ...items];

  const addCustom = () => {
    const label = draft.trim();
    if (!label) return;
    onToggle(makeCustomId(label));
    setDraft('');
  };

  return (
    <div className="space-y-4">
      {allowCustom && (
        <div className="flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // 한글 IME 조합 중 Enter는 무시 (조합 확정용 Enter가 중복 추가되는 것 방지)
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                e.preventDefault();
                addCustom();
              }
            }}
            placeholder="직접 입력"
            className="flex-1 rounded-2xl border-2 border-brand-divider bg-brand-card px-4 py-3 text-base font-bold text-brand-text outline-none transition placeholder:font-normal placeholder:text-brand-text/40 focus:border-brand-selected/60"
          />
          <button
            type="button"
            onClick={addCustom}
            disabled={!draft.trim()}
            className={cn(
              'flex items-center gap-1 rounded-2xl border-2 px-4 py-3 text-base font-bold transition',
              draft.trim()
                ? 'border-brand-selected bg-brand-selected text-white hover:opacity-90'
                : 'border-brand-divider bg-brand-card text-brand-text opacity-40 cursor-not-allowed'
            )}
          >
            <Plus className="h-4 w-4" strokeWidth={3} />
            추가
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 overflow-scroll max-h-64 py-5">
        {displayItems.map((item) => {
          const selected = selectedIds.includes(item.id);
          const disabled = !selected && maxReached;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => !disabled && onToggle(item.id)}
              disabled={disabled}
              className={cn(
                'relative rounded-2xl border-2 px-4 py-5 text-center text-base font-bold transition',
                selected
                  ? 'border-brand-selected bg-brand-selected-bg text-brand-selected'
                  : disabled
                    ? 'border-brand-divider bg-brand-card text-brand-text opacity-40 cursor-not-allowed'
                    : 'border-brand-divider bg-brand-card text-brand-text hover:border-brand-selected/40'
              )}
              aria-pressed={selected}
            >
              {selected && mode === 'multi' && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-selected text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
