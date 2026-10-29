import { useRef, useState } from 'react';
import type { Word, WordInput, WordStats } from '../types';
import { downloadTextFile, exportFilename, wordsToCsv, wordsToJson } from '../lib/importExport';
import { WordForm } from '../components/WordForm';
import { WordList } from '../components/WordList';
import { ImportDialog } from '../components/ImportDialog';
import { StatsGrid } from '../components/StatsGrid';
import { Button } from '../components/ui/Button';
import { ExportIcon, ImportIcon, PlayIcon, PlusIcon } from '../components/Icons';

interface LibraryPageProps {
  words: Word[];
  stats: WordStats;
  tags: string[];
  onAddWord: (input: WordInput) => Word;
  onAddWords: (inputs: WordInput[]) => number;
  onUpdateWord: (id: string, input: WordInput) => void;
  onDeleteWord: (id: string) => void;
  onStartStudy: () => void;
  onNotify: (message: string, tone?: 'success' | 'error' | 'info') => void;
}

/** 首页 / 生词本：核心统计、添加表单、批量导入导出和词条列表。 */
export function LibraryPage({
  words,
  stats,
  tags,
  onAddWord,
  onAddWords,
  onUpdateWord,
  onDeleteWord,
  onStartStudy,
  onNotify,
}: LibraryPageProps) {
  const [importOpen, setImportOpen] = useState(false);
  const addSectionRef = useRef<HTMLElement>(null);

  function focusAddForm() {
    addSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      addSectionRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    }, 280);
  }

  function exportAs(format: 'json' | 'csv') {
    if (words.length === 0) {
      onNotify('词库为空，暂时没有可导出的内容。', 'info');
      return;
    }
    const content = format === 'json' ? wordsToJson(words) : wordsToCsv(words);
    downloadTextFile(
      exportFilename(format),
      content,
      format === 'json' ? 'application/json' : 'text/csv',
    );
    onNotify(`已导出 ${words.length} 个词（${format.toUpperCase()}）。`);
  }

  return (
    <div className="space-y-7 sm:space-y-8">
      <section className="animate-fade-up pt-2 sm:pt-4">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="eyebrow">Your word garden</p>
            <h1 className="mt-3 text-balance text-[32px] font-semibold leading-[1.15] tracking-[-0.03em] text-ink-900 sm:text-4xl lg:text-[44px]">
              把见过的词，
              <span className="font-display font-normal italic text-moss-600">真正记住</span>。
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-[15px]">
              随手录入生词，按你设定的数量随机抽背。每一次作答都会留下痕迹，
              让复习只发生在真正需要的地方。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <ImportIcon className="h-4 w-4" />
              批量导入
            </Button>
            <div className="flex h-11 items-center overflow-hidden rounded-xl border border-ink-900/15 bg-white/80 text-ink-700 shadow-sm">
              <span className="hidden items-center gap-1.5 pl-3.5 pr-2 text-xs font-medium text-ink-500 sm:flex">
                <ExportIcon className="h-4 w-4" />
                导出
              </span>
              <span className="hidden h-5 w-px bg-ink-900/10 sm:block" />
              <button
                type="button"
                onClick={() => exportAs('json')}
                className="h-full px-3 text-xs font-semibold text-ink-600 transition hover:bg-cream-50 hover:text-ink-900"
                title="导出完整数据为 JSON"
                aria-label="导出 JSON"
              >
                JSON
              </button>
              <span className="h-4 w-px bg-ink-900/10" />
              <button
                type="button"
                onClick={() => exportAs('csv')}
                className="h-full px-3 text-xs font-semibold text-ink-600 transition hover:bg-cream-50 hover:text-ink-900"
                title="导出词表为 CSV"
                aria-label="导出 CSV"
              >
                CSV
              </button>
            </div>
            <Button onClick={onStartStudy} className="ml-0 sm:ml-1">
              <PlayIcon className="h-4 w-4" />
              开始抽背
            </Button>
          </div>
        </div>

        <div className="mt-6 sm:mt-7">
          <StatsGrid stats={stats} compact />
        </div>
      </section>

      <section
        id="add-word"
        ref={addSectionRef}
        className="panel scroll-mt-24 p-5 sm:p-6"
        aria-labelledby="add-word-title"
      >
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-moss-600 text-white shadow-[0_10px_22px_-12px_rgba(37,110,76,0.8)]">
            <PlusIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="add-word-title" className="text-lg font-semibold tracking-tight text-ink-900">
              添加新词
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-400">
              英文和中文必填。中文有多个意思时，用分号或逗号分开，答出任一义项都算正确。
            </p>
          </div>
        </div>

        <WordForm
          tags={tags}
          existingWords={words}
          submitLabel="添加到生词本"
          resetOnSubmit
          onSubmit={(input) => {
            onAddWord(input);
            onNotify(`「${input.en}」已加入生词本。`);
          }}
        />
      </section>

      <div className="animate-fade-up" style={{ animationDelay: '80ms' }}>
        <WordList
          words={words}
          tags={tags}
          onUpdate={(id, input) => {
            onUpdateWord(id, input);
            onNotify('词条已更新，学习记录已保留。');
          }}
          onDelete={(id) => {
            onDeleteWord(id);
            onNotify('词条已删除。', 'info');
          }}
          onAddRequest={focusAddForm}
          onStartStudy={onStartStudy}
        />
      </div>

      <ImportDialog
        open={importOpen}
        existingWords={words}
        onClose={() => setImportOpen(false)}
        onImport={(inputs) => {
          const count = onAddWords(inputs);
          onNotify(`成功导入 ${count} 个生词。`);
        }}
      />
    </div>
  );
}
