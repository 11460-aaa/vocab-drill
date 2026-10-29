import { TagIcon } from './Icons';

interface TagBadgeProps {
  tag: string;
  count?: number;
  className?: string;
}

/** 标签展示。空标签不渲染。 */
export function TagBadge({ tag, count, className = '' }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-moss-200/70 bg-moss-50 px-2.5 py-0.5 text-[11px] font-medium text-moss-700 ${className}`}
    >
      <TagIcon className="h-3 w-3" />
      {tag}
      {typeof count === 'number' ? (
        <span className="text-moss-500">· {count}</span>
      ) : null}
    </span>
  );
}
