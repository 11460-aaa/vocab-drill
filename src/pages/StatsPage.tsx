import type { StudyScope, Word, WordStats } from '../types';
import { formatAccuracy, formatRelativeTime, getWrongBook } from '../lib/stats';
import { StatsGrid } from '../components/StatsGrid';
import { EmptyState } from '../components/EmptyState';
import { TagBadge } from '../components/TagBadge';
import { Button } from '../components/ui/Button';
import {
  ArrowRightIcon,
  BarChartIcon,
  CheckIcon,
  FlameIcon,
  PlayIcon,
  TargetIcon,
  TrophyIcon,
  XIcon,
} from '../components/Icons';

interface StatsPageProps {
  words: Word[];
  stats: WordStats;
  onStartScope: (scope: StudyScope) => void;
  onBackLibrary: () => void;
}

/** 统计与错题本：展示累计数据、掌握进度以及需要巩固的词。 */
export function StatsPage({ words, stats, onStartScope, onBackLibrary }: StatsPageProps) {
  const wrongBook = getWrongBook(words);
  const attempts = stats.totalCorrect + stats.totalWrong;
  const accuracyPercent = Math.round(stats.accuracy * 100);
  const masteryPercent = stats.total === 0 ? 0 : Math.round((stats.mastered / stats.total) * 100);

  return (
    <div className="animate-fade-up space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Your progress</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            统计 &amp; 错题本
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
            所有数字都来自你的真实作答。看见积累，也看见下一步该复习哪里。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onBackLibrary}>
            返回生词本
          </Button>
          <Button onClick={() => onStartScope('all')} disabled={words.length === 0}>
            <PlayIcon className="h-4 w-4" />
            开始抽背
          </Button>
        </div>
      </div>

      <StatsGrid stats={stats} />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5 sm:p-6" aria-labelledby="mastery-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Mastery</p>
              <h2 id="mastery-title" className="mt-1.5 text-base font-semibold text-ink-900">
                掌握进度
              </h2>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-papaya-50 text-papaya-700">
              <TrophyIcon className="h-[18px] w-[18px]" />
            </span>
          </div>

          <div className="mt-5 flex items-end justify-between gap-4">
            <div>
              <span className="font-display text-4xl font-semibold leading-none text-ink-900">
                {stats.mastered}
              </span>
              <span className="ml-1 text-sm text-ink-400">/ {stats.total} 个词</span>
            </div>
            <span className="font-display text-2xl font-semibold text-moss-600">
              {masteryPercent}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-moss-400 to-moss-600 transition-[width] duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-400">
            连续答对 3 次即视为掌握；答错一次会重新计算连续记录，让“掌握”更接近真正记住。
          </p>
        </section>

        <section className="panel p-5 sm:p-6" aria-labelledby="accuracy-title">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Accuracy</p>
              <h2 id="accuracy-title" className="mt-1.5 text-base font-semibold text-ink-900">
                累计正确率
              </h2>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
              <BarChartIcon className="h-[18px] w-[18px]" />
            </span>
          </div>

          <div className="mt-5 flex items-center gap-5">
            <div
              className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#d95d4d ${accuracyPercent * 3.6}deg, #ebe5d8 0deg)`,
              }}
              role="img"
              aria-label={`累计正确率 ${formatAccuracy(stats.accuracy, attempts)}`}
            >
              <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-white">
                <span className="font-display text-xl font-semibold text-ink-900">
                  {attempts === 0 ? '—' : `${accuracyPercent}%`}
                </span>
              </div>
            </div>
            <div className="min-w-0 text-sm">
              <p className="text-ink-600">
                {attempts === 0
                  ? '还没有作答记录，开始第一组抽背吧。'
                  : `累计作答 ${attempts} 次，答对 ${stats.totalCorrect} 次。`}
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-full bg-moss-50 px-2 py-1 text-moss-700">
                  <CheckIcon className="h-3 w-3" /> {stats.totalCorrect} 对
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-coral-50 px-2 py-1 text-coral-600">
                  <XIcon className="h-3 w-3" /> {stats.totalWrong} 错
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section className="panel overflow-hidden" aria-labelledby="wrongbook-title">
        <div className="border-b border-ink-900/[0.07] px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-500">
                <FlameIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="wrongbook-title" className="text-base font-semibold text-ink-900">
                    错题本
                  </h2>
                  <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                    {wrongBook.length}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                  答错过、且尚未掌握的词。连续答对 3 次后会自动移出。
                </p>
              </div>
            </div>
            {wrongBook.length > 0 ? (
              <Button size="sm" onClick={() => onStartScope('wrong')}>
                <TargetIcon className="h-4 w-4" />
                复习全部错题
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>
        </div>

        {wrongBook.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              compact
              title={words.length === 0 ? '还没有生词' : '错题本是空的'}
              description={
                words.length === 0
                  ? '先添加一些生词，答错的词会自动进入这里，方便集中复习。'
                  : '目前没有答错且未掌握的词。继续保持，或者从全部生词中随机抽一组巩固一下。'
              }
              icon={<FlameIcon className="h-6 w-6" />}
              action={
                words.length === 0 ? (
                  <Button size="sm" onClick={onBackLibrary}>
                    去添加生词
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" onClick={() => onStartScope('all')}>
                    <PlayIcon className="h-3.5 w-3.5" />
                    随机抽一组
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-ink-900/[0.06]">
            {wrongBook.map((word) => (
              <li
                key={word.id}
                className="flex flex-col gap-2 px-5 py-4 transition-colors hover:bg-cream-50/70 sm:flex-row sm:items-center sm:gap-4 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-display text-lg font-semibold text-ink-900">
                      {word.en}
                    </span>
                    {word.phonetic ? (
                      <span className="text-[11px] text-ink-400">/{word.phonetic}/</span>
                    ) : null}
                    {word.tag ? <TagBadge tag={word.tag} /> : null}
                  </div>
                  <p className="mt-0.5 break-words text-sm leading-relaxed text-ink-600">{word.zh}</p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-ink-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-coral-50 px-2 py-1 font-medium text-coral-600">
                    <XIcon className="h-3 w-3" /> 答错 {word.wrongCount} 次
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-moss-400" />
                    连对 {word.streak} / 3
                  </span>
                  <span className="hidden sm:inline">{formatRelativeTime(word.lastReviewedAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {words.length > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-ink-900/[0.07] bg-white/50 px-5 py-4 text-xs text-ink-500 sm:flex-row">
          <span>
            当前还有 <strong className="font-semibold text-ink-800">{stats.due}</strong>{' '}
            个词待复习，其中 {wrongBook.length} 个在错题本里。
          </span>
          <button
            type="button"
            onClick={() => onStartScope('unmastered')}
            className="inline-flex items-center gap-1 font-medium text-moss-600 transition hover:text-moss-800"
          >
            只复习未掌握
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}
