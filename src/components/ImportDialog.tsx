import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { Word, WordInput } from '../types';
import { getImportableRows, parseImportText } from '../lib/importExport';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { AlertIcon, CheckIcon, ImportIcon, InfoIcon } from './Icons';

interface ImportDialogProps {
  open: boolean;
  existingWords: Word[];
  onClose: () => void;
  onImport: (inputs: WordInput[]) => void;
}

const EXAMPLE = `serendipity,意外发现珍宝的运气；机缘巧合
resilient\t有韧性的；能迅速恢复的
give up 放弃
meticulous，一丝不苟的`;

/**
 * 批量导入弹窗：边输入边解析，先预览再写入。
 * 错误行不会被静默丢弃，而会在列表中标注原因。
 */
export function ImportDialog({ open, existingWords, onClose, onImport }: ImportDialogProps) {
  const [text, setText] = useState('');
  const [includeDuplicates, setIncludeDuplicates] = useState(false);
  const deferredText = useDeferredValue(text);

  useEffect(() => {
    if (open) {
      setText('');
      setIncludeDuplicates(false);
    }
  }, [open]);

  const preview = useMemo(
    () => parseImportText(deferredText, existingWords),
    [deferredText, existingWords],
  );
  const importableRows = useMemo(
    () => getImportableRows(preview, includeDuplicates),
    [preview, includeDuplicates],
  );

  const visibleRows = preview.rows.slice(0, 100);

  function handleImport() {
    if (importableRows.length === 0) return;
    onImport(importableRows.map((row) => ({ en: row.en, zh: row.zh })));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title="批量导入生词"
      description="每行一个词，支持逗号、Tab 或空格分隔。先预览解析结果，再决定是否导入。"
      footer={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs leading-relaxed text-ink-500">
            <span className="font-semibold text-ink-800">可导入 {importableRows.length} 个</span>
            {preview.duplicateCount > 0 ? (
              <span className="ml-2 text-papaya-700">重复 {preview.duplicateCount} 行</span>
            ) : null}
            {preview.errorCount > 0 ? (
              <span className="ml-2 text-coral-600">错误 {preview.errorCount} 行</span>
            ) : null}
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="secondary" onClick={onClose}>
              取消
            </Button>
            <Button onClick={handleImport} disabled={importableRows.length === 0}>
              导入 {importableRows.length} 个词
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <label htmlFor="import-text" className="text-[13px] font-medium text-ink-700">
              粘贴文本
            </label>
            <button
              type="button"
              onClick={() => setText(EXAMPLE)}
              className="text-xs font-medium text-moss-600 underline decoration-moss-300 underline-offset-4 transition hover:text-moss-800"
            >
              填入示例
            </button>
          </div>
          <textarea
            id="import-text"
            data-autofocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={13}
            spellCheck={false}
            placeholder={'apple,苹果\nbanana\t香蕉\nlook after 照顾'}
            className="field-input min-h-[260px] resize-y font-mono text-[13px] leading-6 lg:min-h-[340px]"
          />
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-moss-100 bg-moss-50/70 px-3 py-2.5 text-xs leading-relaxed text-moss-800">
            <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <strong className="font-semibold">格式：</strong>英文 + 分隔符 + 中文。支持{' '}
              <code className="rounded bg-white/70 px-1">,</code>、
              <code className="rounded bg-white/70 px-1">，</code>、
              <code className="rounded bg-white/70 px-1">Tab</code> 和空格。空行会自动忽略。
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[13px] font-medium text-ink-700">解析预览</span>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-moss-50 px-2 py-1 text-moss-700">
                <CheckIcon className="h-3 w-3" /> 新增 {preview.newCount}
              </span>
              {preview.duplicateCount > 0 ? (
                <span className="rounded-full bg-papaya-50 px-2 py-1 text-papaya-700">
                  重复 {preview.duplicateCount}
                </span>
              ) : null}
              {preview.errorCount > 0 ? (
                <span className="rounded-full bg-coral-50 px-2 py-1 text-coral-700">
                  错误 {preview.errorCount}
                </span>
              ) : null}
            </div>
          </div>

          <div className="h-[300px] overflow-y-auto rounded-2xl border border-ink-900/10 bg-white/60 lg:h-[365px]">
            {preview.rows.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                <ImportIcon className="h-8 w-8 text-ink-300" />
                <p className="mt-3 text-sm font-medium text-ink-600">等待粘贴内容</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-400">
                  解析结果会实时出现在这里，
                  <br />
                  错误行会标出原因。
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-900/[0.06]">
                {visibleRows.map((row) => (
                  <li
                    key={`${row.lineNumber}-${row.raw}`}
                    className={`px-3.5 py-2.5 ${
                      row.status === 'error' ? 'bg-coral-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 w-7 shrink-0 text-right font-mono text-[10px] text-ink-400">
                        {row.lineNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        {row.status === 'error' ? (
                          <>
                            <p className="break-all font-mono text-[11px] text-ink-500">
                              {row.raw}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-coral-600">
                              <AlertIcon className="h-3 w-3 shrink-0" />
                              {row.message}
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                              <span className="text-[13px] font-semibold text-ink-900">
                                {row.en}
                              </span>
                              <span className="text-xs leading-relaxed text-ink-600">
                                {row.zh}
                              </span>
                            </div>
                            {row.status === 'duplicate' ? (
                              <p className="mt-1 flex items-center gap-1 text-[11px] text-papaya-700">
                                <AlertIcon className="h-3 w-3 shrink-0" />
                                {row.message}
                              </p>
                            ) : null}
                          </>
                        )}
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                          row.status === 'new'
                            ? 'bg-moss-50 text-moss-700'
                            : row.status === 'duplicate'
                              ? 'bg-papaya-50 text-papaya-700'
                              : 'bg-coral-100 text-coral-700'
                        }`}
                      >
                        {row.status === 'new'
                          ? '新增'
                          : row.status === 'duplicate'
                            ? '重复'
                            : '错误'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {preview.rows.length > visibleRows.length ? (
            <p className="mt-2 text-[11px] text-ink-400">
              仅预览前 {visibleRows.length} 行；其余 {preview.rows.length - visibleRows.length}{' '}
              行仍会按同样规则处理。
            </p>
          ) : null}

          {preview.duplicateCount > 0 ? (
            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-ink-900/10 bg-cream-50 px-3 py-2.5 text-xs leading-relaxed text-ink-600">
              <input
                type="checkbox"
                checked={includeDuplicates}
                onChange={(event) => setIncludeDuplicates(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-ink-900/20 text-moss-600 focus:ring-moss-500"
              />
              <span>
                连重复行一起导入
                <span className="block text-[11px] text-ink-400">
                  默认只导入新词，已有词条不会被覆盖。
                </span>
              </span>
            </label>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
