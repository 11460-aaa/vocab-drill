import { useMemo, useState } from 'react';
import type { Word, WordInput } from '../types';
import { formatRelativeTime } from '../lib/stats';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { WordForm } from './WordForm';
import { TagBadge } from './TagBadge';
import {
  CheckIcon,
  EditIcon,
  SearchIcon,
  TrashIcon,
  TrophyIcon,
  XIcon,
} from './Icons';

interface WordListProps {
  words: Word[];
  tags: string[];
  onUpdate: (id: string, input: WordInput) => void;
  onDelete: (id: string) => void;
  onAddRequest: () => void;
  onStartStudy: () => void;
}

function StatusBadge({ word }: { word: Word }) {
  if (word.mastered) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-moss-200 bg-moss-50 px-2 py-0.5 text-[11px] font-medium text-moss-700">
        <TrophyIcon className="h-3 w-3" />
        已掌握
      </span>
    );
  }
  if (word.wrongCount > 0) {
    return (
      <span className="inline-flex items-center rounded-full border border-papaya-300/60 bg-papaya-50 px-2 py-0.5 text-[11px] font-medium text-papaya-700">
        待巩固
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-ink-900/10 bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
      新词
    </span>
  );
}

function StreakDots({ streak }: { streak: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`连续答对 ${streak} 次`}>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`h-1.5 w-1.5 rounded-full ${
            index < streak ? 'bg-moss-500' : 'bg-ink-900/10'
          }`}
        />
      ))}
    </span>
  );
}

/**
 * 生词列表：搜索、标签筛选、行内编辑和二次确认删除。
 */
export function WordList({
  words,
  tags,
  onUpdate,
  onDelete,
  onAddRequest,
  onStartStudy,
}: WordListProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Word | null>(null);

  const sortedWords = useMemo(
    () => [...words].sort((a, b) => b.createdAt - a.createdAt),
    [words],
  );

  const filteredWords = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase();
    return sortedWords.filter((word) => {
      const matchesTag = selectedTag === 'all' || word.tag === selectedTag;
      if (!matchesTag) return false;
      if (!keyword) return true;
      return (
        word.en.toLocaleLowerCase().includes(keyword) ||
        word.zh.toLocaleLowerCase().includes(keyword) ||
        (word.note ?? '').toLocaleLowerCase().includes(keyword)
      );
    });
  }, [sortedWords, search, selectedTag]);

  const hasFilters = search.trim() !== '' || selectedTag !== 'all';

  function resetFilters() {
    setSearch('');
    setSelectedTag('all');
  }

  return (
    <section className="panel overflow-hidden" aria-labelledby="word-list-title">
      <div className="border-b border-ink-900/[0.07] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 id="word-list-title" className="text-lg font-semibold tracking-tight text-ink-900">
                生词列表
              </h2>
              <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[11px] font-medium text-ink-500">
                {words.length}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-400">
              {hasFilters
                ? `筛选出 ${filteredWords.length} 个词`
                : '点击“编辑”可以直接修改词条，学习记录会保留。'}
            </p>
          </div>
          {hasFilters ? (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-500 transition hover:bg-ink-900/[0.05] hover:text-ink-800"
            >
              <XIcon className="h-3.5 w-3.5" />
              清除筛选
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="搜索英文或中文释义…"
              aria-label="搜索生词"
              className="field-input h-11 pl-10 pr-9"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="清空搜索"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-ink-900/[0.06] hover:text-ink-700"
              >
                <XIcon className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="relative sm:w-44">
            <select
              value={selectedTag}
              onChange={(event) => setSelectedTag(event.target.value)}
              aria-label="按标签筛选"
              className="field-input h-11 cursor-pointer appearance-none pr-9"
            >
              <option value="all">全部标签</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
            >
              <path
                d="m5 7.5 5 5 5-5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="px-5 py-12 text-center sm:px-6">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-100 text-ink-400">
            <SearchIcon className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-800">
            {words.length === 0 ? '还没有生词' : '没有找到匹配的词'}
          </p>
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-ink-400">
            {words.length === 0
              ? '从上方表单添加第一个词，或批量导入你的词表，就可以开始抽背了。'
              : '换一个关键词，或者清除标签筛选再试试。'}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {words.length === 0 ? (
              <>
                <Button size="sm" onClick={onAddRequest}>
                  去添加生词
                </Button>
                <Button size="sm" variant="secondary" onClick={onStartStudy}>
                  查看抽背设置
                </Button>
              </>
            ) : (
              <Button size="sm" variant="secondary" onClick={resetFilters}>
                清除筛选
              </Button>
            )}
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-ink-900/[0.06]">
          {filteredWords.map((word) => {
            const isEditing = editingId === word.id;
            return (
              <li key={word.id} className="group px-4 py-4 transition-colors hover:bg-cream-50/80 sm:px-6">
                {isEditing ? (
                  <div className="animate-fade-up">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-ink-800">编辑词条</p>
                        <p className="mt-0.5 text-[11px] text-ink-400">
                          学习数据（正确 / 错误 / 掌握度）不会重置
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-full p-2 text-ink-400 transition hover:bg-ink-900/[0.06] hover:text-ink-700"
                        aria-label="关闭编辑"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                    <WordForm
                      initial={{
                        en: word.en,
                        zh: word.zh,
                        phonetic: word.phonetic,
                        note: word.note,
                        tag: word.tag,
                      }}
                      tags={tags}
                      submitLabel="保存修改"
                      editingId={word.id}
                      existingWords={words}
                      onCancel={() => setEditingId(null)}
                      onSubmit={(input) => {
                        onUpdate(word.id, input);
                        setEditingId(null);
                      }}
                    />
                  </div>
                ) : (
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="break-words font-display text-lg font-semibold leading-snug tracking-tight text-ink-900">
                          {word.en}
                        </h3>
                        {word.phonetic ? (
                          <span className="text-xs text-ink-400">/{word.phonetic}/</span>
                        ) : null}
                        <StatusBadge word={word} />
                      </div>

                      <p className="mt-1 break-words text-sm leading-relaxed text-ink-700">
                        {word.zh}
                      </p>

                      {word.note ? (
                        <p className="mt-1.5 whitespace-pre-line break-words rounded-lg border-l-2 border-ink-900/10 pl-2.5 text-xs leading-relaxed text-ink-400">
                          {word.note}
                        </p>
                      ) : null}

                      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                        {word.tag ? <TagBadge tag={word.tag} /> : null}
                        <span className="inline-flex items-center gap-1 text-[11px] text-moss-600">
                          <CheckIcon className="h-3 w-3" /> {word.correctCount} 对
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] text-coral-500">
                          <XIcon className="h-3 w-3" /> {word.wrongCount} 错
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-ink-400">
                          <StreakDots streak={word.streak} />
                          连对 {word.streak}
                        </span>
                        <span className="text-[11px] text-ink-400">
                          {formatRelativeTime(word.lastReviewedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 sm:opacity-60 sm:transition sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => setEditingId(word.id)}
                        className="rounded-lg p-2 text-ink-400 transition hover:bg-moss-50 hover:text-moss-700 focus-visible:ring-4 focus-visible:ring-moss-500/20"
                        aria-label={`编辑 ${word.en}`}
                        title="编辑"
                      >
                        <EditIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(word)}
                        className="rounded-lg p-2 text-ink-400 transition hover:bg-coral-50 hover:text-coral-600 focus-visible:ring-4 focus-visible:ring-coral-500/15"
                        aria-label={`删除 ${word.en}`}
                        title="删除"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="删除这个生词？"
        description={
          deleteTarget
            ? `「${deleteTarget.en} · ${deleteTarget.zh}」及其全部学习记录都会被永久删除，此操作无法撤销。`
            : ''
        }
        confirmLabel="确认删除"
        tone="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </section>
  );
}
