'use client';

import { Check } from 'lucide-react';
import type { KeywordItem } from '@/types/concept';
import { cn } from '@/lib/utils/cn';

interface Props {
  items: KeywordItem[];
  mode: 'single' | 'multi';
  selectedIds: string[];
  onToggle: (id: string) => void;
}


export function KeywordGrid({ items, mode, selectedIds, onToggle }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 overflow-scroll max-h-64 py-5">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            className={cn(
              'relative rounded-2xl border-2 px-4 py-5 text-center text-base font-bold transition',
              selected
                ? 'border-brand-selected bg-brand-selected-bg text-brand-selected'
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
  );
}
