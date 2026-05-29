'use client';

import { useState } from 'react';
import { X, Lock, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';
import { useUnlockStore } from '@/stores/unlock-store';

interface Props {
  open: boolean;
  onClose: () => void;
}

const WADIZ_URL = 'https://app.wadiz.kr/links/su9wDe14xE';

export function SecretCodeModal({ open, onClose }: Props) {
  const unlock = useUnlockStore((s) => s.unlock);
  const [code, setCode] = useState('');

  if (!open) return null;

  const handleSubmit = () => {
    if (unlock(code)) {
      toast.success('잠금이 해제되었어요!');
      setCode('');
      onClose();
    } else {
      toast.error('시크릿 코드가 올바르지 않아요.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-brand-card border border-brand-divider shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-brand-card px-6 py-5 border-b border-brand-divider">
          <div>
            <h2 className="text-xl font-bold text-brand-text">잠긴 기능이에요 🔒</h2>
            <p className="mt-0.5 text-sm text-brand-muted">
              시크릿 코드를 입력하면 모든 기능을 사용할 수 있어요.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-brand-divider/40 transition"
            aria-label="닫기"
          >
            <X className="h-5 w-5 text-brand-muted" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* 코드 입력 */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-brand-divider bg-brand-bg px-4 py-3">
              <Lock className="h-4 w-4 shrink-0 text-brand-muted" />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
                placeholder="시크릿 코드를 입력하세요"
                autoFocus
                className="w-full bg-transparent text-sm text-brand-text outline-none placeholder:text-brand-muted"
              />
            </div>
            <Button variant="primary" onClick={handleSubmit} className="w-full">
              잠금 해제
            </Button>
          </section>

          {/* 와디즈 안내 */}
          <section className="space-y-3 border-t border-brand-divider pt-6">
            <p className="text-sm text-brand-muted leading-relaxed">
              아직 코드가 없으신가요? 와디즈 펀딩에 참여하고 시크릿 코드를 받아보세요.
            </p>
            <a
              href={WADIZ_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-brand-btn2 px-6 py-3 text-base font-bold text-brand-text shadow-sm transition hover:brightness-105 active:brightness-95"
            >
              와디즈 펀딩 보러가기
              <ExternalLink className="h-4 w-4" />
            </a>
          </section>
        </div>
      </div>
    </div>
  );
}
