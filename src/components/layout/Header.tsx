import Link from 'next/link';

export function Header() {
  return (
    <header className="border-b border-brand-divider bg-brand-bg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-2xl text-brand-text" style={{ fontFamily: 'Black Han Sans, sans-serif' }}>
          이모티콘 AI
        </Link>
        <nav className="text-sm text-brand-muted">이모티콘 작가를 위한 도우미</nav>
      </div>
    </header>
  );
}
