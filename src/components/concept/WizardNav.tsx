'use client';

import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastStep: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function WizardNav({ canGoBack, canGoNext, isLastStep, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <Button
        variant="ghost"
        onClick={onPrev}
        disabled={!canGoBack}
        className="px-4"
      >
        <ChevronLeft className="h-5 w-5" />
        이전
      </Button>
      <Button onClick={onNext} disabled={!canGoNext} className="min-w-40">
        {isLastStep ? (
          <>
            <Sparkles className="h-5 w-5" />
            결과 보기
          </>
        ) : (
          <>
            다음
            <ChevronRight className="h-5 w-5" />
          </>
        )}
      </Button>
    </div>
  );
}
