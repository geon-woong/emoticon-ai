import Link from 'next/link';
import { Sparkles, User, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';

interface FeatureCard {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}

const FEATURES: FeatureCard[] = [
  {
    href: '/concept',
    title: '이모티콘 컨셉 찾기',
    description: '키워드를 골라 어울리는 컨셉을 추천받아요',
    icon: <Sparkles className="h-8 w-8" />,
    enabled: true,
  },
  {
    href: '/character',
    title: '캐릭터 주체 찾기',
    description: '컨셉에 어울리는 캐릭터 주체를 찾아요',
    icon: <User className="h-8 w-8" />,
    enabled: false,
  },
  {
    href: '/message',
    title: '메시지 찾기',
    description: '이모티콘에 들어갈 메시지를 추천받아요',
    icon: <MessageCircle className="h-8 w-8" />,
    enabled: false,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="space-y-3 text-center">
        <h1
          className="text-5xl text-brand-text"
          style={{ fontFamily: 'Black Han Sans, sans-serif' }}
        >
          이모티콘 AI
        </h1>
        <p className="text-base text-brand-muted">
          이모티콘 작가를 위한 기획 도우미. 컨셉, 캐릭터, 메시지를 빠르게 찾아보세요.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        {FEATURES.map((f) => {
          const inner = (
            <Card
              className={cn(
                'flex h-full flex-col items-center gap-4 p-8 text-center transition',
                f.enabled
                  ? 'cursor-pointer hover:-translate-y-1 hover:border-brand-selected hover:shadow-md'
                  : 'pointer-events-none opacity-60'
              )}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-selected-bg text-brand-selected">
                {f.icon}
              </div>
              <h2 className="text-xl font-bold text-brand-text">{f.title}</h2>
              <p className="text-sm text-brand-muted">{f.description}</p>
              {!f.enabled && (
                <span className="rounded-full bg-brand-divider px-3 py-1 text-xs font-bold text-brand-muted">
                  준비 중
                </span>
              )}
            </Card>
          );
          return f.enabled ? (
            <Link key={f.href} href={f.href}>
              {inner}
            </Link>
          ) : (
            <div key={f.href}>{inner}</div>
          );
        })}
      </section>
    </div>
  );
}
