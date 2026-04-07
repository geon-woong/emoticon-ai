import { Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import type { ConceptSuggestion } from '@/types/concept';
import { cn } from '@/lib/utils/cn';

interface Props {
  concept: ConceptSuggestion;
}

export function ConceptCard({ concept }: Props) {
  const isLlm = concept.source === 'llm';
  return (
    <Card
      className={cn(
        'flex items-center gap-3 px-5 py-4',
        isLlm && 'border-brand-accent/50 bg-brand-selected-bg/40'
      )}
    >
      {isLlm && <Sparkles className="h-4 w-4 shrink-0 text-brand-accent" />}
      <p className="text-base font-bold text-brand-text">{concept.text}</p>
    </Card>
  );
}
