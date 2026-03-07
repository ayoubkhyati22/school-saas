import { cn } from '@/lib/utils';
import { School } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return (
    <svg
      className={cn('animate-spin text-muted-foreground', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

/** Spinner centered inside the content area — use INSIDE <DashboardLayout> */
export function LoadingContent() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

/**
 * Full-page skeleton that mimics the real layout (sidebar + header + spinner in content).
 * Use this ONLY when profile is not yet loaded (very brief flash).
 */
export function LoadingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar skeleton */}
      <aside className="bg-card border-r border-border h-screen fixed left-0 top-0 flex flex-col" style={{ width: '15rem' }}>
        <div className="h-14 flex items-center px-5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary flex items-center justify-center flex-shrink-0">
              <School size={14} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-sm text-foreground tracking-tight">EduManager</span>
          </div>
        </div>
        <nav className="flex-1 py-3 px-3 space-y-0.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-9 bg-muted animate-pulse"
              style={{ opacity: Math.max(0.3, 1 - i * 0.1) }}
            />
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-muted animate-pulse flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-muted animate-pulse w-3/4" />
              <div className="h-2 bg-muted animate-pulse w-1/2" />
            </div>
          </div>
        </div>
      </aside>

      {/* Header skeleton */}
      <header className="h-14 border-b border-border bg-card fixed top-0 right-0 z-10 flex items-center px-6 justify-between" style={{ left: '15rem' }}>
        <div className="h-8 w-48 bg-muted animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-muted animate-pulse" />
          <div className="w-8 h-8 bg-muted animate-pulse" />
          <div className="w-px h-5 bg-border mx-1" />
          <div className="w-24 h-8 bg-muted animate-pulse" />
        </div>
      </header>

      {/* Content spinner */}
      <main className="mt-14 min-h-[calc(100vh-56px)]" style={{ marginLeft: '15rem' }}>
        <div className="p-6 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 56px)' }}>
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </main>
    </div>
  );
}
