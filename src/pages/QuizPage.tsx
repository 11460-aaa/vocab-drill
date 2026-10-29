import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { QuizSession, Word } from '../types';
import { getAnswerForCurrentQuestion, getCurrentQuestion } from '../lib/quiz';
import { getExpectedAnswer, getPromptText } from '../lib/answer';
import { Button } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { TagBadge } from '../components/TagBadge';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  InfoIcon,
  SparklesIcon,
  XIcon,
} from '../components/Icons';

interface QuizPageProps {
  words: Word[];
  session: QuizSession;
  onSubmitAnswer: (wordId: string, answer: string) => void;
  onNext: () => void;
  onExit: () => void;
}

const DIRECTION_LABEL = {
  'en-zh': '英译中',
  'zh-en': '中译英',
} as const;

/**
 * 答题页：只保留题干、输入框和当前题反馈。
 * 作答后不会自动跳题，必须由用户点击“下一题”继续。
 */
export function QuizPage({
  words,
  session,
  onSubmitAnswer,
  onNext,
  onExit,
}: QuizPageProps) {
  const [value, setValue] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [exitOpen, setExitOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const wordMap = useMemo(
    () => new Map(words.map((word) => [word.id, word])),
    [words],
  );
  const current = useMemo(
    () => (session ? getCurrentQuestion(session, wordMap) : null),
    [session, wordMap],
  );
  const answer = useMemo(
    () => (session ? getAnswerForCurrentQuestion(session) : undefined),
    [session],
  );

  const total = session.questions.length;
  const questionNumber = Math.min(session.currentIndex + 1, total);
  const progress = total === 0 ? 0 : ((session.currentIndex + 1) / total) * 100;

  useEffect(() => {
    setValue('');
    setInputError(null);
    // 切换到下一题后重新聚焦输入框。
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => window.clearTimeout(timer);
  }, [current?.question.id]);

  if (!current) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-ink-500">本次题目已完成。</p>
        <Button className="mt-4" onClick={onNext}>
          查看小结
        </Button>
      </div>
    );
  }

  if (!session.questions.length) {
    return (
      <div className="mx-auto max-w-lg py-20 text-center">
        <p className="text-sm text-ink-500">本次没有可作答的题目。</p>
        <Button className="mt-4" variant="secondary" onClick={onExit}>
          返回设置
        </Button>
      </div>
    );
  }

  const { question, word } = current;
  const directionLabel = DIRECTION_LABEL[question.direction];
  const prompt = getPromptText(word, question.direction);
  const expected = getExpectedAnswer(word, question.direction);
  const isLastQuestion = session.currentIndex === total - 1;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (answer) return;
    const trimmed = value.trim();
    if (!trimmed) {
      setInputError('先写下你的答案，再提交。');
      inputRef.current?.focus();
      return;
    }
    setInputError(null);
    onSubmitAnswer(word.id, trimmed);
  }

  return (
    <div className="animate-fade-up mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExitOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-xs font-medium text-ink-500 transition hover:text-ink-900 focus-visible:ring-4 focus-visible:ring-moss-500/20"
        >
          <ArrowLeftIcon className="h-3.5 w-3.5" />
          退出本次
        </button>
        <span className="text-xs tabular-nums text-ink-400">
          第 <strong className="font-semibold text-ink-800">{questionNumber}</strong> / {total} 题
        </span>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-ink-900/[0.07]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={questionNumber}
        aria-label={`进度：第 ${questionNumber} 题，共 ${total} 题`}
      >
        <div
          className="h-full rounded-full bg-moss-500 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="panel mt-5 overflow-hidden sm:mt-6">
        <div className="relative px-5 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-moss-100/50 blur-3xl"
          />

          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-moss-50 px-2.5 py-1 text-[11px] font-semibold text-moss-700">
                {directionLabel}
              </span>
              <span className="text-[11px] text-ink-400">
                {question.direction === 'en-zh'
                  ? '请写出对应的中文释义'
                  : '请写出对应的英文词条'}
              </span>
              {word.tag ? <TagBadge tag={word.tag} className="ml-auto" /> : null}
            </div>

            <div className="mt-7 min-h-[92px] sm:min-h-[112px]">
              <p
                className={`text-balance break-words font-semibold leading-tight tracking-tight text-ink-900 ${
                  question.direction === 'en-zh'
                    ? 'font-display text-[38px] sm:text-5xl'
                    : 'text-[30px] leading-snug sm:text-[38px]'
                }`}
              >
                {prompt}
              </p>
              {question.direction === 'en-zh' && word.phonetic ? (
                <p className="mt-3 text-sm tracking-wide text-ink-400">/{word.phonetic}/</p>
              ) : null}
            </div>

            {!answer ? (
              <form onSubmit={handleSubmit} className="mt-7" noValidate>
                <label htmlFor="answer-input" className="sr-only">
                  {question.direction === 'en-zh' ? '输入中文释义' : '输入英文词条'}
                </label>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <input
                    ref={inputRef}
                    id="answer-input"
                    value={value}
                    onChange={(event) => {
                      setValue(event.target.value);
                      if (inputError) setInputError(null);
                    }}
                    placeholder={question.direction === 'en-zh' ? '写下中文释义…' : '写下英文词条…'}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    aria-invalid={Boolean(inputError)}
                    aria-describedby={inputError ? 'answer-error' : 'answer-hint'}
                    className={`field-input h-14 flex-1 rounded-2xl border-2 px-4 text-[16px] ${
                      inputError ? 'field-input-error' : ''
                    }`}
                  />
                  <Button type="submit" size="lg" className="h-14 rounded-2xl px-7 sm:w-auto">
                    提交答案
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
                {inputError ? (
                  <p id="answer-error" className="mt-2 text-xs text-coral-600">
                    {inputError}
                  </p>
                ) : (
                  <p id="answer-hint" className="mt-2.5 text-[11px] text-ink-400">
                    按 Enter 提交 · 不区分大小写，忽略标点差异
                  </p>
                )}
              </form>
            ) : (
              <div className="mt-6" aria-live="polite">
                <div
                  className={`rounded-2xl border px-4 py-4 sm:px-5 ${
                    answer.isCorrect
                      ? 'border-moss-200 bg-moss-50/80'
                      : 'border-coral-100 bg-coral-50/70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        answer.isCorrect
                          ? 'bg-moss-600 text-white'
                          : 'bg-coral-500 text-white'
                      }`}
                    >
                      {answer.isCorrect ? (
                        <CheckIcon className="h-4 w-4" />
                      ) : (
                        <XIcon className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          answer.isCorrect ? 'text-moss-800' : 'text-coral-700'
                        }`}
                      >
                        {answer.isCorrect ? '答对了，记忆又牢了一点。' : '这次还差一点。'}
                      </p>
                      {answer.isCorrect ? (
                        <p className="mt-1 text-xs leading-relaxed text-moss-700/80">
                          你的答案：{answer.userAnswer}
                        </p>
                      ) : (
                        <div className="mt-2 space-y-1.5 text-xs leading-relaxed">
                          <p className="text-coral-700/75">
                            你的答案：
                            <span className="font-medium text-coral-800">{answer.userAnswer}</span>
                          </p>
                          <p className="inline-flex flex-wrap items-baseline gap-1.5 rounded-lg bg-white/80 px-2.5 py-1.5 text-ink-700">
                            正确答案：
                            <strong className="font-semibold text-ink-900">{expected}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-ink-900/[0.08] bg-cream-50/80 p-4 sm:p-5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-display text-xl font-semibold text-ink-900">
                      {word.en}
                    </span>
                    {word.phonetic ? (
                      <span className="text-xs text-ink-400">/{word.phonetic}/</span>
                    ) : null}
                    {word.tag ? <TagBadge tag={word.tag} /> : null}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{word.zh}</p>
                  {word.note ? (
                    <p className="mt-2 whitespace-pre-line border-l-2 border-moss-200 pl-3 text-xs leading-relaxed text-ink-500">
                      {word.note}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex justify-end">
                  <Button size="lg" onClick={onNext} data-autofocus>
                    {isLastQuestion ? '查看本次小结' : '下一题'}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {!answer ? (
          <div className="flex items-center gap-2 border-t border-ink-900/[0.06] bg-cream-50/70 px-5 py-3 text-[11px] text-ink-400 sm:px-8">
            <SparklesIcon className="h-3.5 w-3.5 text-papaya-500" />
            答案提交后立即判定，并显示完整词条
          </div>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-300">
        <InfoIcon className="h-3.5 w-3.5" />
        每次作答后，学习记录会立即保存到本地
      </div>

      <ConfirmDialog
        open={exitOpen}
        title="退出本次抽背？"
        description={`已经答过的 ${session.answers.length} 道题会保留学习记录，尚未作答的题目不会计入。下次可以从设置重新开始。`}
        confirmLabel="退出本次"
        cancelLabel="继续答题"
        tone="danger"
        onCancel={() => setExitOpen(false)}
        onConfirm={() => {
          setExitOpen(false);
          onExit();
        }}
      />
    </div>
  );
}
