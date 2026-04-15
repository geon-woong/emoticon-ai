'use client';

import { type ReactNode, useState } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './Button';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  description?: ReactNode;
  prompt: string;
}

const AI_LINKS = [
  { name: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-[#10a37f]' },
  { name: 'Gemini', url: 'https://gemini.google.com', color: 'bg-[#4285f4]' },
];

export function PromptModal({ open, onClose, title, subtitle, description, prompt }: Props) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      toast.success('프롬프트가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('복사에 실패했습니다. 직접 텍스트를 선택해 복사해주세요.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-brand-card border border-brand-divider shadow-xl">
        {/* 헤더 */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-brand-card px-6 py-5 border-b border-brand-divider">
          <div>
            <h2 className="text-xl font-bold text-brand-text">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-sm text-brand-muted">{subtitle}</p>
            )}
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
          {/* AI 활용 가이드 */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-brand-text">AI로 활용하기</h3>
            <p className="text-sm text-brand-muted leading-relaxed">
              {description ?? '아래 프롬프트를 복사한 후, ChatGPT 또는 Gemini에 붙여넣어 사용하세요.'}
            </p>
            <div className="flex flex-wrap gap-2">
              {AI_LINKS.map((ai) => (
                <a
                  key={ai.name}
                  href={ai.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white transition hover:brightness-110 ${ai.color}`}
                >
                  {ai.name} 바로가기
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </section>

          {/* 프롬프트 */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-brand-text">프롬프트</h3>
              <Button variant="secondary" onClick={handleCopy} className="text-sm px-4 py-2">
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? '복사됨!' : '프롬프트 복사하기'}
              </Button>
            </div>
            <pre className="w-full rounded-2xl border border-brand-divider bg-brand-bg p-4 text-xs text-brand-text whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto font-mono">
              {prompt}
            </pre>
          </section>
        </div>
      </div>
    </div>
  );
}
