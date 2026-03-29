import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AccountAuthShellProps = {
  mode: 'login' | 'signup' | 'profile';
  title: string;
  description: string;
  highlights: string[];
  actionText: string;
  actionHref: string;
  actionState?: unknown;
  children: ReactNode;
};

export function AccountAuthShell({
  mode,
  title,
  description,
  highlights,
  actionText,
  actionHref,
  actionState,
  children,
}: AccountAuthShellProps) {
  return (
    <section className="relative overflow-hidden bg-[#F6F6F2] z-[70] pt-12 lg:pt-14 pb-20 px-6 lg:px-12 min-h-screen">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-[rgba(255,45,143,0.08)] blur-3xl" />
        <div className="absolute bottom-0 left-8 h-64 w-64 rounded-full bg-[rgba(11,11,13,0.05)] blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-stretch">
        <aside className="relative overflow-hidden border border-[#0B0B0D]/10 bg-white p-6 lg:p-8 shadow-[0_20px_60px_rgba(11,11,13,0.06)] h-full">
          <div className="absolute inset-x-0 top-0 h-1 accent-bg" />
          <p className="text-xs uppercase tracking-[0.28em] text-[#6E6E73] mb-3">Aurevia account</p>
          <h2 className="text-3xl lg:text-4xl font-bold leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            {title}
          </h2>
          <p className="mt-4 text-sm text-[#6E6E73] max-w-md">
            {description}
          </p>

          <div className="mt-8 space-y-3">
            {highlights.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full accent-bg shrink-0" />
                <p className="text-sm text-[#0B0B0D] leading-6">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
            <Link
              to={actionHref}
              state={actionState}
              className="px-4 py-2 border border-[#0B0B0D]/10 hover:border-[#0B0B0D] transition-colors"
            >
              {actionText}
            </Link>
            <span className="text-[#6E6E73]">
              {mode === 'login'
                ? 'Fast checkout, receipts, and order history.'
                : mode === 'signup'
                  ? 'Create a profile in under a minute.'
                  : 'Update your name, email, password, and connected accounts.'}
            </span>
          </div>
        </aside>

        <div className="relative overflow-hidden border border-[#0B0B0D]/10 bg-white p-4 lg:p-6 min-h-[520px] lg:min-h-[560px] shadow-[0_20px_60px_rgba(11,11,13,0.06)] flex">
          <div className="absolute inset-x-0 top-0 h-1 accent-bg" />
          <div className="mt-2 w-full max-w-full overflow-hidden flex items-start justify-center">{children}</div>
        </div>
      </div>
    </section>
  );
}