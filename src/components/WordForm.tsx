import { useId, useState } from 'react';
import type { FormEvent } from 'react';
import type { Word, WordInput } from '../types';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';

interface WordFormProps {
  initial?: WordInput;
  tags: string[];
  submitLabel: string;
  onSubmit: (input: WordInput) => void;
  onCancel?: () => void;
  /** 添加成功后清空表单；编辑模式一般由父组件关闭表单 */
  resetOnSubmit?: boolean;
  /** 编辑时排除自身，避免和自己判重复 */
  editingId?: string;
  existingWords: Word[];
  compact?: boolean;
  autoFocus?: boolean;
}

interface FormErrors {
  en?: string;
  zh?: string;
}

function normalizeKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

/**
 * 添加 / 行内编辑共用的生词表单。
 * 英文重复时会先弹出确认，用户仍可选择“继续添加/保存”。
 */
export function WordForm({
  initial,
  tags,
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSubmit = false,
  editingId,
  existingWords,
  compact = false,
  autoFocus = false,
}: WordFormProps) {
  const datalistId = useId();
  const [en, setEn] = useState(initial?.en ?? '');
  const [zh, setZh] = useState(initial?.zh ?? '');
  const [phonetic, setPhonetic] = useState(initial?.phonetic ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [tag, setTag] = useState(initial?.tag ?? '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [duplicate, setDuplicate] = useState<Word | null>(null);
  const [pendingInput, setPendingInput] = useState<WordInput | null>(null);

  function buildInput(): WordInput {
    return {
      en: en.trim(),
      zh: zh.trim(),
      phonetic: phonetic.trim() || undefined,
      note: note.trim() || undefined,
      tag: tag.trim() || undefined,
    };
  }

  function submitNow(input: WordInput) {
    onSubmit(input);
    if (resetOnSubmit) {
      setEn('');
      setZh('');
      setPhonetic('');
      setNote('');
      setTag('');
      setErrors({});
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = buildInput();
    const nextErrors: FormErrors = {};
    if (!input.en) nextErrors.en = '请填写英文词条';
    if (!input.zh) nextErrors.zh = '请填写中文释义';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const duplicateWord = existingWords.find(
      (word) => word.id !== editingId && normalizeKey(word.en) === normalizeKey(input.en),
    );

    if (duplicateWord) {
      setDuplicate(duplicateWord);
      setPendingInput(input);
      return;
    }

    submitNow(input);
  }

  const inputClass = 'field-input';

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className={compact ? '' : 'mt-4'}>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${datalistId}-en`} className="field-label">
              英文 <span className="text-coral-500">*</span>
            </label>
            <input
              id={`${datalistId}-en`}
              value={en}
              onChange={(event) => {
                setEn(event.target.value);
                if (errors.en) setErrors((previous) => ({ ...previous, en: undefined }));
              }}
              placeholder="例如：serendipity"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              autoFocus={autoFocus}
              aria-invalid={Boolean(errors.en)}
              aria-describedby={errors.en ? `${datalistId}-en-error` : undefined}
              className={`${inputClass} ${errors.en ? 'field-input-error' : ''}`}
            />
            {errors.en ? (
              <p id={`${datalistId}-en-error`} className="mt-1 text-xs text-coral-600">
                {errors.en}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${datalistId}-zh`} className="field-label">
              中文释义 <span className="text-coral-500">*</span>
              <span className="font-normal text-ink-400">多个义项用 ; 或 , 分隔</span>
            </label>
            <input
              id={`${datalistId}-zh`}
              value={zh}
              onChange={(event) => {
                setZh(event.target.value);
                if (errors.zh) setErrors((previous) => ({ ...previous, zh: undefined }));
              }}
              placeholder="例如：意外发现珍宝的运气；机缘巧合"
              autoComplete="off"
              aria-invalid={Boolean(errors.zh)}
              aria-describedby={errors.zh ? `${datalistId}-zh-error` : undefined}
              className={`${inputClass} ${errors.zh ? 'field-input-error' : ''}`}
            />
            {errors.zh ? (
              <p id={`${datalistId}-zh-error`} className="mt-1 text-xs text-coral-600">
                {errors.zh}
              </p>
            ) : null}
          </div>

          <div>
            <label htmlFor={`${datalistId}-phonetic`} className="field-label">
              音标 <span className="font-normal text-ink-400">可选</span>
            </label>
            <input
              id={`${datalistId}-phonetic`}
              value={phonetic}
              onChange={(event) => setPhonetic(event.target.value)}
              placeholder="例如：ˌserənˈdɪpəti"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor={`${datalistId}-tag`} className="field-label">
              标签 <span className="font-normal text-ink-400">可选</span>
            </label>
            <input
              id={`${datalistId}-tag`}
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="例如：雅思 / 阅读"
              autoComplete="off"
              list={`${datalistId}-tags`}
              className={inputClass}
            />
            <datalist id={`${datalistId}-tags`}>
              {tags.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor={`${datalistId}-note`} className="field-label">
              备注 / 例句 <span className="font-normal text-ink-400">可选</span>
            </label>
            <textarea
              id={`${datalistId}-note`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="记下例句、词根或你总记不住的地方…"
              rows={compact ? 2 : 2}
              className={`${inputClass} resize-y leading-relaxed`}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              取消
            </Button>
          ) : null}
          <Button type="submit" variant="primary" className="sm:min-w-[112px]">
            {submitLabel}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={Boolean(duplicate)}
        title="这个英文已经存在"
        description={
          duplicate
            ? `词库中已经有「${duplicate.en} · ${duplicate.zh}」。你可以返回修改，也可以确认后继续${
                editingId ? '保存' : '添加'
              }一个同名单词。`
            : ''
        }
        confirmLabel={editingId ? '仍然保存' : '仍然添加'}
        cancelLabel="返回修改"
        onCancel={() => {
          setDuplicate(null);
          setPendingInput(null);
        }}
        onConfirm={() => {
          if (pendingInput) submitNow(pendingInput);
          setDuplicate(null);
          setPendingInput(null);
        }}
      />
    </>
  );
}
