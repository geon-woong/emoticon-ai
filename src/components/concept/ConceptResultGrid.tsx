import type { ConceptSuggestion, SubjectKey } from '@/types/concept';
import { SUBJECT_LABELS } from '@/types/concept';
import { ConceptCard } from './ConceptCard';

interface Props {
  bySubject: Partial<Record<SubjectKey, ConceptSuggestion[]>>;
  title?: string;
}

const ORDER: SubjectKey[] = ['job', 'relationship', 'hobby', 'sport'];

export function ConceptResultGrid({ bySubject, title }: Props) {
  const sections = ORDER.filter((k) => (bySubject[k] ?? []).length > 0);
  if (sections.length === 0) return null;

  return (
    <section className="space-y-8">
      {title && (
        <h2 className="text-xl font-bold text-brand-text">{title}</h2>
      )}
      {sections.map((key) => {
        const concepts = bySubject[key] ?? [];
        return (
          <div key={key} className="space-y-3">
            <h3 className="text-lg font-bold text-brand-selected">
              {SUBJECT_LABELS[key]} 컨셉
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {concepts.map((c) => (
                <ConceptCard key={c.id} concept={c} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
