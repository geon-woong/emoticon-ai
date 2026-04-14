import { Sparkles, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ConceptSuggestion } from '@/types/concept';
import { cn } from '@/lib/utils/cn';

interface Props {
  concept: ConceptSuggestion;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ConceptCard({ concept, isSelected, onSelect }: Props) {
  const isLlm = concept.source === 'llm';
  return (
    <Card
      className={cn(
        'flex items-center gap-3 px-5 py-4 transition',
        isLlm && 'border-brand-accent/50 bg-brand-selected-bg/40',
        onSelect && 'cursor-pointer hover:brightness-95',
        isSelected && 'ring-2 ring-brand-selected border-brand-selected'
      )}
      onClick={onSelect}
    >
      {isLlm && <Sparkles className="h-4 w-4 shrink-0 text-brand-accent" />}
      <p className="flex-1 text-base font-bold text-brand-text">{concept.text}</p>
      {isSelected && <Check className="h-4 w-4 shrink-0 text-brand-selected" />}
    </Card>
  );
}
