import type { ReactNode } from 'react';
import type { AppView } from '../types';
import { BarChartIcon, BookIcon, PlayIcon } from './Icons';

interface AppShellProps {
  view: AppView;
  focusMode?: boolean;
  wordCount: number;
  onNavigate: (view: AppView) => void;
  children: ReactNode;
}

const NAV_ITEMS = [
  { view: 'library' as const, label: '生词本', icon: BookIcon },
  { view: 'setup' as const, label: '开始抽背', icon: PlayIcon },
  { view: 'stats' as const, label: '统计 · 错题本', icon: BarChartIcon },
];

/** 全站框架：品牌、主导航、内容宽度和页脚。答题时切换为专注模式。 */
export function AppShell({
  view,
  focusMode = false,
  wordCount,
  onNavigate,
  children,
}: AppShellProps) {
  const brandContent = (
    <>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-moss-600 text-cream-50 shadow-[0_8px_20px_-10px_rgba(29,87,61,0.8)] transition group-hover:-rotate-3 sm:h-10 sm:w-10">
        <span className="font-display text-xl font-bold leading-none sm:text-[22px]">拾</span>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-papaya-300/80" />
      </span>
      <span className="min-w-0">
        <span className="block text-[17px] font-semibold tracking-tight text-ink-900">拾词</span>
        <span className="hidden text-[10px] font-medium uppercase tracking-[0.16em] text-ink-400 sm:block">
          Recall, one word a time
        </span>
      </span>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-ink-900/[0.07] bg-cream-50/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-3 px-4 sm:h-[68px] sm:px-6 lg:px-8">
          {focusMode ? (
            // 答题时品牌标识不可点击，避免误触直接跳出会话；退出请走题面左上角。
            <div className="flex min-w-0 items-center gap-2.5">{brandContent}</div>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('library')}
              className="group flex min-w-0 items-center gap-2.5 rounded-xl text-left focus-visible:ring-4 focus-visible:ring-moss-500/20"
              aria-label="返回生词本首页"
            >
              {brandContent}
            </button>
          )}

          {focusMode ? (
            <div className="ml-auto flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-moss-200 bg-moss-50 px-3 py-1.5 text-xs font-medium text-moss-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss-500" />
                专注模式
              </span>
            </div>
          ) : (
            <>
              <nav
                aria-label="主导航"
                className="ml-auto flex items-center gap-0.5 rounded-2xl border border-ink-900/[0.07] bg-white/60 p-1 shadow-sm sm:gap-1"
              >
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active =
                    view === item.view ||
                    (item.view === 'library' && view === 'result') ||
                    (item.view === 'setup' && view === 'quiz');
                  return (
                    <button
                      key={item.view}
                      type="button"
                      onClick={() => onNavigate(item.view)}
                      aria-current={active ? 'page' : undefined}
                      className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[13px] font-medium transition sm:px-3.5 ${
                        active
                          ? 'bg-white text-moss-700 shadow-sm ring-1 ring-ink-900/[0.06]'
                          : 'text-ink-500 hover:bg-white/70 hover:text-ink-800'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden md:inline">{item.label}</span>
                      <span className="md:hidden">
                        {item.view === 'library'
                          ? '生词本'
                          : item.view === 'setup'
                            ? '抽背'
                            : '统计'}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <span className="hidden shrink-0 items-center gap-1.5 rounded-full border border-ink-900/[0.07] bg-white/60 px-3 py-1.5 text-xs text-ink-500 lg:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-moss-400" />
                {wordCount} 个词
              </span>
            </>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        {children}
      </main>

      {focusMode ? null : (
        <footer className="border-t border-ink-900/[0.06] px-4 py-6">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 text-center text-xs text-ink-400 sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <span>拾词 · 把见过的词，真正记住。</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-moss-400" />
              所有数据只保存在当前浏览器，无需登录
            </span>
          </div>
        </footer>
      )}
    </div>
  );
}
