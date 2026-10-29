import type { QuizResult, QuizSession, Word } from '../types';
import { getExpectedAnswer } from '../lib/answer';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/EmptyState';
import {
  ArrowRightIcon,
  BarChartIcon,
  BookIcon,
  CheckIcon,
  RefreshIcon,
  TrophyIcon,
  XIcon,
} from '../components/Icons';

interface ResultPageProps {
  result: QuizResult;
  session: QuizSession;
  words: Word[];
  onRetryWrong: () => void;
  onStudyAgain: () => void;
  onBackLibrary: () => void;
  onViewStats: () => void;
}

const DIRECTION_LABEL = {
  'en-zh': '英译中',
  'zh-en': '中译英',
} as const;

/** 单次抽背小结：正确率、错题明细和下一步入口。 */
export function ResultPage({
  result,
  session,
  words,
  onRetryWrong,
  onStudyAgain,
  onBackLibrary,
  onViewStats,
}: ResultPageProps) {
  const wordMap = new Map(words.map((word) => [word.id, word]));
  const wrongAnswers = session.answers.filter((answer) => !answer.isCorrect);
  const percent = Math.round(result.accuracy * 100);

  const headline =
    result.wrongCount === 0
      ? '全对，漂亮。'
      : result.accuracy >= 0.8
        ? '记得很稳，继续保持。'
        : result.accuracy >= 0.5
          ? '一半已经记住，再练一轮。'
          : '没关系，错题会带你找到重点。';

  const subline =
    result.wrongCount === 0
      ? `这 ${result.total} 个词都很扎实。要不要再来一组，趁热打铁？`
      : `本次答错 ${result.wrongCount} 题。错题已经更新到错题本，重练一遍会记得更牢。`;

  return (
    <div className="animate-fade-up mx-auto max-w-4xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Session complete</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            本次小结
          </h1>
        </div>
        <span className="rounded-full border border-ink-900/10 bg-white/70 px-3 py-1.5 text-xs text-ink-500">
          {result.total} 题 · {new Date(result.finishedAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <section className="panel relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-moss-100/70 blur-3xl"
        />
        <div className="relative grid gap-7 p-6 sm:p-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-papaya-50 text-papaya-700">
                {result.wrongCount === 0 ? (
                  <TrophyIcon className="h-4 w-4" />
                ) : (
                  <RefreshIcon className="h-4 w-4" />
                )}
              </span>
              <span className="text-xs font-medium text-ink-500">本次抽背已完成</span>
            </div>
            <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
              {headline}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">{subline}</p>

            <div className="mt-5 flex flex-wrap gap-2">
              {result.wrongCount > 0 ? (
                <Button onClick={onRetryWrong}>
                  <RefreshIcon className="h-4 w-4" />
                  重练错题（{result.wrongCount}）
                </Button>
              ) : (
                <Button onClick={onStudyAgain}>
                  <RefreshIcon className="h-4 w-4" />
                  再来一组
                </Button>
              )}
              <Button variant="secondary" onClick={onStudyAgain}>
                {result.wrongCount > 0 ? '再来一组' : '调整设置'}
              </Button>
              <Button variant="ghost" onClick={onBackLibrary}>
                <BookIcon className="h-4 w-4" />
                返回生词本
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-center md:pr-3">
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full sm:h-40 sm:w-40"
              style={{
                background: `conic-gradient(#368a61 ${percent * 3.6}deg, #ebe5d8 0deg)`,
              }}
              role="img"
              aria-label={`本次正确率 ${percent}%`}
            >
              <div className="flex h-[116px] w-[116px] flex-col items-center justify-center rounded-full bg-cream-50 sm:h-[128px] sm:w-[128px]">
                <span className="font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-[42px]">
                  {percent}%
                </span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-ink-400">
                  正确率
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 divide-x divide-ink-900/[0.06] border-t border-ink-900/[0.07] bg-cream-50/50">
          <div className="px-4 py-4 text-center sm:py-5">
            <p className="font-display text-2xl font-semibold text-moss-600">{result.correctCount}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">答对</p>
          </div>
          <div className="px-4 py-4 text-center sm:py-5">
            <p className="font-display text-2xl font-semibold text-coral-500">{result.wrongCount}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">答错</p>
          </div>
          <div className="px-4 py-4 text-center sm:py-5">
            <p className="font-display text-2xl font-semibold text-ink-900">{result.total}</p>
            <p className="mt-0.5 text-[11px] text-ink-400">总题数</p>
          </div>
        </div>
      </section>

      <section className="mt-5" aria-labelledby="mistake-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="mistake-title" className="text-base font-semibold text-ink-900">
              本次出错的词
            </h2>
            <p className="mt-0.5 text-xs text-ink-400">
              错题已计入学习记录；连续答对 3 次后会自动移出错题本。
            </p>
          </div>
          <button
            type="button"
            onClick={onViewStats}
            className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-moss-600 transition hover:text-moss-800"
          >
            <BarChartIcon className="h-3.5 w-3.5" />
            查看错题本
          </button>
        </div>

        {wrongAnswers.length === 0 ? (
          <EmptyState
            compact
            title="这一轮没有错题"
            description="所有题目都答对了。可以再来一组新词，或者去统计页看看最近的积累。"
            icon={<TrophyIcon className="h-6 w-6" />}
            action={
              <Button size="sm" onClick={onStudyAgain}>
                再来一组
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </Button>
            }
          />
        ) : (
          <ul className="panel divide-y divide-ink-900/[0.06] overflow-hidden">
            {wrongAnswers.map((answer) => {
              const word = wordMap.get(answer.wordId);
              if (!word) return null;
              return (
                <li key={answer.questionId} className="p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-50 text-coral-600">
                      <XIcon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="font-display text-lg font-semibold text-ink-900">
                          {word.en}
                        </span>
                        {word.phonetic ? (
                          <span className="text-[11px] text-ink-400">/{word.phonetic}/</span>
                        ) : null}
                        <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] text-ink-500">
                          {DIRECTION_LABEL[answer.direction]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-ink-600">{word.zh}</p>
                      <div className="mt-2 grid gap-1.5 text-xs sm:grid-cols-2">
                        <p className="rounded-lg bg-coral-50/70 px-2.5 py-1.5 text-coral-700">
                          你的答案：
                          <span className="font-medium">{answer.userAnswer}</span>
                        </p>
                        <p className="rounded-lg bg-moss-50 px-2.5 py-1.5 text-moss-800">
                          <CheckIcon className="mr-1 inline h-3 w-3" />
                          正确答案：{getExpectedAnswer(word, answer.direction)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
