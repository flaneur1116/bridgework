export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg width="28" height="18" viewBox="0 0 28 18" aria-hidden>
        <path d="M4 14 C 9 2, 19 2, 24 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <line x1="1" y1="14" x2="27" y2="14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="4" cy="14" r="3" fill="currentColor" />
        <circle cx="24" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
      <span className="display text-[1.15rem] font-bold tracking-tight">Bridgework</span>
    </span>
  );
}
