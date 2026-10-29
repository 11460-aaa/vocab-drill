import { useMemo, useState } from 'react';
import type { QuizConfig, QuizDirection, StudyScope, Word } from '../types';
import { getScopePool } from '../lib/quiz';
import { getAllTags } from '../lib/stats';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/EmptyState';
import { TagBadge } from '../components/TagBadge';
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BookIcon,
  CheckIcon,
  FlameIcon,
  InfoIcon,
  PlayIcon,
  ShuffleIcon,
  TagIcon,
  TargetIcon,
} from '../components/Icons';

interface SetupPageProps {
  words: Word[];
  config: QuizConfig;
  onChangeConfig: (config: QuizConfig) => void;
  onStart: (config: QuizConfig) => void;
  onBack: () => void;
}

const DIRECTION_OPTIONS: Array<{
  value: QuizDirection;
  title: string;
  description: string;
  badge: string;
}> = [
  { value: 'en-zh', title: '英译中', description: '看英文，写出中文释义', badge: 'EN → 中' },
  { value: 'zh-en', title: '中译英', description: '看中文，写出英文词条', badge: '中 → EN' },
  { value: 'mixed', title: '随机混合', description: '每道题随机切换方向', badge: '⇄' },
];

const SCOPE_OPTIONS: Array<{
  value: StudyScope;
  title: string;
  description: string;
  icon: typeof BookIcon;
}> = [
  { value: 'all', title: '全部生词', description: '从整个生词本中抽取', icon: BookIcon },
  { value: 'unmastered', title: '仅未掌握', description: '优先巩固还没记住的词', icon: TargetIcon },
  { value: 'wrong', title: '仅错过的词', description: '只练答错且未掌握的词', icon: FlameIcon },
  { value: 'tag', title: '按标签筛选', description: '专注某一个分组', icon: TagIcon },
];

function scopeLabel(config: QuizConfig): string {
  switch (config.scope) {
    case 'unmastered':
      return '仅未掌握';
    case 'wrong':
      return '仅错过的词';
    case 'tag':
      return config.tag ? `标签 · ${config.tag}` : '按标签筛选';
    default:
      return '全部生词';
  }
}

/**
 * 学习设置页。
 * 数量默认 10，可抽词上限由当前范围动态决定；若请求数超过实际词数，
 * 点击开始时会二次询问是否按实际数量开始。
 */
export function SetupPage({ words, config, onChangeConfig, onStart, onBack }: SetupPageProps) {
  const [confirmActual, setConfirmActual] = useState(false);
  const tags = useMemo(() => getAllTags(words), [words]);

  // 标签被删除或首次进入标签范围时，回退到第一个可用标签。
  const activeTag =
    config.tag && tags.includes(config.tag) ? config.tag : tags.length > 0 ? tags[0] : undefined;
  const effectiveConfig: QuizConfig = { ...config, tag: activeTag };
  const pool = useMemo(
    () => getScopePool(words, effectiveConfig),
    [words, effectiveConfig.scope, effectiveConfig.tag],
  );
  const poolCount = pool.length;
  const requestedCount = Math.max(0, Math.floor(config.count) || 0);
  const willTrim = requestedCount > poolCount;

  function update(patch: Partial<QuizConfig>) {
    onChangeConfig({ ...effectiveConfig, ...patch });
  }

  function handleScopeChange(scope: StudyScope) {
    if (scope === 'tag' && tags.length === 0) return;
    update({ scope, tag: scope === 'tag' ? activeTag : config.tag });
  }

  function handleCountChange(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      update({ count: 0 });
      return;
    }
    update({ count: Math.min(999, Math.max(0, parsed)) });
  }

  function handleStart() {
    if (poolCount === 0) return;
    const safeCount = Math.max(1, requestedCount || 1);
    if (safeCount > poolCount) {
      setConfirmActual(true);
      return;
    }
    onStart({ ...effectiveConfig, count: safeCount });
  }

  const counts: Record<StudyScope, number> = {
    all: words.length,
    unmastered: words.filter((word) => !word.mastered).length,
    wrong: words.filter((word) => word.wrongCount > 0 && !word.mastered).length,
    tag: activeTag ? words.filter((word) => word.tag === activeTag).length : 0,
  };

  return (
    <div className="animate-fade-up mx-auto max-w-5xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-ink-500 transition hover:text-ink-900 focus-visible:ring-4 focus-visible:ring-moss-500/20"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        返回生词本
      </button>

      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Session setup</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            这次，想抽几个？
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-500">
            设置数量、方向和范围，剩下的交给随机。所有选择题都可以随时回来调整。
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-ink-900/[0.07] bg-white/70 px-4 py-3 text-xs text-ink-500 shadow-sm">
          <BookIcon className="h-4 w-4 text-moss-600" />
          词库共 <strong className="font-semibold text-ink-900">{words.length}</strong> 个词
          <span className="h-3 w-px bg-ink-900/10" />
          当前范围 <strong className="font-semibold text-moss-700">{poolCount}</strong> 个
        </div>
      </div>

      {words.length === 0 ? (
        <EmptyState
          title="词库还是空的"
          description="先去生词本添加几个词，才能开始抽背。录入英文和中文释义即可，音标和备注可以以后再补。"
          action={
            <Button onClick={onBack}>
              <BookIcon className="h-4 w-4" />
              去添加生词
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            {/* 数量 */}
            <section className="panel p-5 sm:p-6" aria-labelledby="count-title">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="eyebrow">01 · 数量</p>
                  <h2 id="count-title" className="mt-1.5 text-base font-semibold text-ink-900">
                    每次抽背数量
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">
                    默认 10 个；当前范围内可用 {poolCount} 个，上限为 {poolCount} 个。
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-2xl border border-ink-900/10 bg-cream-50 p-1.5">
                  <button
                    type="button"
                    onClick={() => update({ count: Math.max(1, (requestedCount || 1) - 1) })}
                    disabled={requestedCount <= 1}
                    aria-label="减少抽背数量"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-medium text-ink-600 transition hover:bg-white hover:text-ink-900 disabled:opacity-30"
                  >
                    −
                  </button>
                  <input
                    id="study-count"
                    type="number"
                    min={1}
                    max={Math.max(poolCount, 1)}
                    inputMode="numeric"
                    value={requestedCount === 0 ? '' : requestedCount}
                    onChange={(event) => handleCountChange(event.target.value)}
                    onBlur={() => {
                      if (!requestedCount) update({ count: 1 });
                    }}
                    aria-label="每次抽背数量"
                    className="h-10 w-16 rounded-xl border border-transparent bg-white text-center font-display text-2xl font-semibold text-ink-900 outline-none transition focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10"
                  />
                  <button
                    type="button"
                    onClick={() => update({ count: Math.min(999, (requestedCount || 0) + 1) })}
                    disabled={requestedCount >= poolCount}
                    aria-label="增加抽背数量"
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-medium text-ink-600 transition hover:bg-white hover:text-ink-900 disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              {willTrim ? (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-papaya-300/50 bg-papaya-50 px-3.5 py-3 text-xs leading-relaxed text-papaya-700">
                  <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    当前范围只有 <strong>{poolCount}</strong> 个词，少于你要求的{' '}
                    <strong>{requestedCount}</strong> 个。点击开始后会先询问是否按实际数量开始。
                  </span>
                </div>
              ) : null}
            </section>

            {/* 方向 */}
            <section className="panel p-5 sm:p-6" aria-labelledby="direction-title">
              <fieldset>
                <legend className="w-full">
                  <p className="eyebrow">02 · 方向</p>
                  <h2 id="direction-title" className="mt-1.5 text-base font-semibold text-ink-900">
                    抽背方向
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">
                    只给出题干的一侧，由你输入另一侧。混合模式会平衡两个方向。
                  </p>
                </legend>
                <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                  {DIRECTION_OPTIONS.map((option) => {
                    const checked = effectiveConfig.direction === option.value;
                    return (
                      <label
                        key={option.value}
                        className={`relative flex cursor-pointer flex-col rounded-2xl border p-3.5 transition ${
                          checked
                            ? 'border-moss-500 bg-moss-50/70 ring-1 ring-moss-500/20'
                            : 'border-ink-900/10 bg-white/60 hover:border-ink-900/20 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="direction"
                          value={option.value}
                          checked={checked}
                          onChange={() => update({ direction: option.value })}
                          className="sr-only"
                        />
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                              checked
                                ? 'bg-moss-600 text-white'
                                : 'bg-cream-100 text-ink-500'
                            }`}
                          >
                            {option.badge}
                          </span>
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                              checked
                                ? 'border-moss-600 bg-moss-600 text-white'
                                : 'border-ink-900/20 bg-white'
                            }`}
                          >
                            {checked ? <CheckIcon className="h-2.5 w-2.5" /> : null}
                          </span>
                        </span>
                        <span className="mt-3 text-sm font-semibold text-ink-900">
                          {option.title}
                        </span>
                        <span className="mt-0.5 text-[11px] leading-relaxed text-ink-400">
                          {option.description}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            </section>

            {/* 范围 */}
            <section className="panel p-5 sm:p-6" aria-labelledby="scope-title">
              <fieldset>
                <legend className="w-full">
                  <p className="eyebrow">03 · 范围</p>
                  <h2 id="scope-title" className="mt-1.5 text-base font-semibold text-ink-900">
                    抽词范围
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">
                    错题本只包含答错过且尚未掌握的词；连续答对 3 次即视为掌握。
                  </p>
                </legend>
                <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {SCOPE_OPTIONS.map((option) => {
                    const checked = effectiveConfig.scope === option.value;
                    const disabled = option.value === 'tag' && tags.length === 0;
                    const Icon = option.icon;
                    return (
                      <label
                        key={option.value}
                        className={`relative flex items-start gap-3 rounded-2xl border p-3.5 transition ${
                          disabled
                            ? 'cursor-not-allowed border-ink-900/[0.06] bg-cream-100/40 opacity-55'
                            : checked
                              ? 'cursor-pointer border-moss-500 bg-moss-50/70 ring-1 ring-moss-500/20'
                              : 'cursor-pointer border-ink-900/10 bg-white/60 hover:border-ink-900/20 hover:bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="scope"
                          value={option.value}
                          checked={checked}
                          disabled={disabled}
                          onChange={() => handleScopeChange(option.value)}
                          className="sr-only"
                        />
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            checked ? 'bg-moss-600 text-white' : 'bg-cream-100 text-ink-500'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[13px] font-semibold text-ink-900">
                              {option.title}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                checked
                                  ? 'bg-white text-moss-700'
                                  : 'bg-cream-100 text-ink-400'
                              }`}
                            >
                              {option.value === 'tag' && !activeTag
                                ? '暂无标签'
                                : `${counts[option.value]} 个`}
                            </span>
                          </span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-400">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                {effectiveConfig.scope === 'tag' && tags.length > 0 ? (
                  <div className="mt-3.5 rounded-2xl border border-ink-900/10 bg-cream-50 p-3.5">
                    <label htmlFor="tag-select" className="field-label">
                      选择标签
                    </label>
                    <select
                      id="tag-select"
                      value={activeTag}
                      onChange={(event) =>
                        update({ scope: 'tag', tag: event.target.value || undefined })
                      }
                      className="field-input h-11 cursor-pointer"
                    >
                      {tags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}（{words.filter((word) => word.tag === tag).length} 个）
                        </option>
                      ))}
                    </select>
                    {activeTag ? (
                      <div className="mt-2.5">
                        <TagBadge tag={activeTag} />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </fieldset>
            </section>

            {/* 顺序 */}
            <section className="panel flex items-center justify-between gap-4 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cream-100 text-ink-500">
                  <ShuffleIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">打乱抽背顺序</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-400">
                    开启后题目顺序随机；关闭时仍随机抽词，但按词库顺序作答。
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={effectiveConfig.shuffle}
                aria-label="打乱抽背顺序"
                onClick={() => update({ shuffle: !effectiveConfig.shuffle })}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-4 focus-visible:ring-moss-500/20 ${
                  effectiveConfig.shuffle ? 'bg-moss-600' : 'bg-ink-900/15'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    effectiveConfig.shuffle ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </section>
          </div>

          {/* 摘要 */}
          <aside className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-ink-900/10 bg-ink-900 text-cream-50 shadow-lift">
              <div className="relative px-5 pb-5 pt-6 sm:px-6">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-moss-500/25 blur-2xl"
                />
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-200/55">
                  Session preview
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="font-display text-6xl font-semibold leading-none tracking-tight">
                    {poolCount === 0 ? 0 : Math.min(requestedCount || 1, poolCount)}
                  </span>
                  <span className="pb-1.5 text-sm text-cream-200/60">个词</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-cream-200/55">
                  从 {poolCount} 个可用词中随机抽取
                </p>

                <dl className="mt-5 space-y-2.5 border-t border-white/10 pt-4 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-cream-200/50">范围</dt>
                    <dd className="text-right font-medium text-cream-50">
                      {scopeLabel(effectiveConfig)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-cream-200/50">方向</dt>
                    <dd className="text-right font-medium text-cream-50">
                      {DIRECTION_OPTIONS.find((item) => item.value === effectiveConfig.direction)
                        ?.title ?? '英译中'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-cream-200/50">顺序</dt>
                    <dd className="text-right font-medium text-cream-50">
                      {effectiveConfig.shuffle ? '随机打乱' : '词库顺序'}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-cream-200/50">答错后</dt>
                    <dd className="text-right font-medium text-cream-50">立即显示正确答案</dd>
                  </div>
                </dl>
              </div>

              <div className="border-t border-white/10 bg-white/[0.04] px-5 py-4 sm:px-6">
                {poolCount === 0 ? (
                  <div className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3.5 py-3 text-xs leading-relaxed text-amber-100">
                    <span className="flex items-start gap-2">
                      <InfoIcon className="mt-0.5 h-4 w-4 shrink-0" />
                      当前范围没有可抽的词。换一个范围，或先掌握 / 添加一些词。
                    </span>
                  </div>
                ) : null}
                <Button
                  onClick={handleStart}
                  disabled={poolCount === 0 || requestedCount === 0}
                  size="lg"
                  fullWidth
                  className="mt-3 !bg-cream-50 !text-ink-900 hover:!bg-white"
                >
                  <PlayIcon className="h-4 w-4" />
                  开始抽背
                  <ArrowRightIcon className="ml-auto h-4 w-4 opacity-60" />
                </Button>
                <p className="mt-2.5 text-center text-[10px] leading-relaxed text-cream-200/40">
                  答完所有题后才会显示本次小结
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}

      <ConfirmDialog
        open={confirmActual}
        title="可用词数不足"
        description={`当前范围只有 ${poolCount} 个词，少于你要求的 ${requestedCount} 个。是否按实际可用的 ${poolCount} 个词开始本次抽背？`}
        confirmLabel={`按 ${poolCount} 个开始`}
        cancelLabel="调整数量"
        onCancel={() => setConfirmActual(false)}
        onConfirm={() => {
          setConfirmActual(false);
          onStart({ ...effectiveConfig, count: poolCount });
        }}
      />
    </div>
  );
}
