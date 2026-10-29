import type { ReactNode } from 'react';
import { LeafIcon } from './Icons';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}

/** 统一的空状态：词库为空、筛选无结果、错题本为空等场景共用。 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-900/15 bg-cream-50/60 px-6 text-center ${
        compact ? 'py-10' : 'py-14 sm:py-16'
      }`}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-moss-50 text-moss-500">
        {icon ?? <LeafIcon className="h-6 w-6" />}
      </span>
      <h3 className="text-base font-semibold text-ink-900">{title}</h3>
      <p className="mt-1.5 max-w-md text-sm leading-relaxed text-ink-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
