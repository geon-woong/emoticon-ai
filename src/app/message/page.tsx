import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function MessagePlaceholderPage() {
  return (
    <div className="space-y-6 text-center">
      <h1 className="text-3xl font-bold text-brand-text">메시지 찾기</h1>
      <p className="text-brand-muted">준비 중인 기능이에요. 곧 만나요!</p>
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-brand-selected hover:underline"
      >
        <ChevronLeft className="h-4 w-4" />
        시작 페이지로
      </Link>
    </div>
  );
}
