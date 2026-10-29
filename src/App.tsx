import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  AppView,
  QuizConfig,
  QuizResult,
  QuizSession,
  StudyScope,
} from './types';
import { useWordbook } from './hooks/useWordbook';
import { useToast } from './hooks/useToast';
import { checkAnswer } from './lib/answer';
import { buildQuizResult, buildQuizSession, buildRetrySession, getScopePool } from './lib/quiz';
import { getAllTags, getWordStats } from './lib/stats';
import { AppShell } from './components/AppShell';
import { Toast } from './components/Toast';
import { AlertIcon, XIcon } from './components/Icons';
import { LibraryPage } from './pages/LibraryPage';
import { SetupPage } from './pages/SetupPage';
import { QuizPage } from './pages/QuizPage';
import { ResultPage } from './pages/ResultPage';
import { StatsPage } from './pages/StatsPage';

const DEFAULT_CONFIG: QuizConfig = {
  count: 10,
  direction: 'en-zh',
  scope: 'all',
  shuffle: true,
};

/**
 * 应用状态与页面切换。
 * 页面之间用 state 管理，不依赖服务端路由；词库和学习数据由 useWordbook 持久化。
 */
export default function App() {
  const {
    words,
    storageError,
    addWord,
    addWords,
    updateWord,
    deleteWord,
    recordAnswer,
  } = useWordbook();
  const { toast, showToast, dismissToast } = useToast();

  const [view, setView] = useState<AppView>('library');
  const [config, setConfig] = useState<QuizConfig>(DEFAULT_CONFIG);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [dismissedStorageError, setDismissedStorageError] = useState<string | null>(null);
  const answerLockedRef = useRef(false);

  const stats = useMemo(() => getWordStats(words), [words]);
  const tags = useMemo(() => getAllTags(words), [words]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [view]);

  function goTo(nextView: AppView) {
    setView(nextView);
  }

  /** 打开设置页，并可预先指定抽词范围（例如从错题本进入）。 */
  function openSetup(scope?: StudyScope) {
    if (scope) {
      setConfig((previous) => ({ ...previous, scope }));
    }
    setView('setup');
  }

  function handleStartStudy(nextConfig: QuizConfig) {
    const pool = getScopePool(words, nextConfig);
    if (pool.length === 0) {
      showToast('当前范围没有可抽的词，请调整范围或先添加生词。', 'error');
      return;
    }

    const safeCount = Math.max(1, Math.min(Math.floor(nextConfig.count) || 1, pool.length));
    const safeConfig: QuizConfig = { ...nextConfig, count: safeCount };
    const nextSession = buildQuizSession(words, safeConfig);

    if (nextSession.questions.length === 0) {
      showToast('抽题失败，请稍后重试。', 'error');
      return;
    }

    setConfig(safeConfig);
    setSession(nextSession);
    setResult(null);
    answerLockedRef.current = false;
    setView('quiz');
  }

  /**
   * 提交当前题：判定 → 更新词条学习数据 → 记录本次会话答案。
   * 判定和记录都在这里完成，QuizPage 只负责输入与展示。
   */
  function handleSubmitAnswer(wordId: string, userAnswer: string) {
    if (!session || answerLockedRef.current) return;

    const question = session.questions[session.currentIndex];
    if (!question || question.wordId !== wordId) return;
    if (session.answers.some((answer) => answer.questionId === question.id)) return;

    const word = words.find((item) => item.id === wordId);
    if (!word) return;

    const checked = checkAnswer(word, question.direction, userAnswer);
    answerLockedRef.current = true;

    recordAnswer(wordId, checked.isCorrect);
    setSession((previous) => {
      if (!previous) return previous;
      // 双重保险：避免任何竞态下重复记录同一道题。
      if (previous.answers.some((answer) => answer.questionId === question.id)) {
        return previous;
      }
      return {
        ...previous,
        answers: [
          ...previous.answers,
          {
            questionId: question.id,
            wordId,
            direction: question.direction,
            userAnswer,
            isCorrect: checked.isCorrect,
            answeredAt: Date.now(),
          },
        ],
      };
    });
  }

  /** 用户手动点击“下一题”；最后一题结束后生成小结。 */
  function handleNextQuestion() {
    if (!session) return;

    const currentQuestion = session.questions[session.currentIndex];
    const hasAnswered = session.answers.some(
      (answer) => answer.questionId === currentQuestion?.id,
    );
    if (!currentQuestion || !hasAnswered) return;

    const isLast = session.currentIndex >= session.questions.length - 1;
    if (isLast) {
      setResult(buildQuizResult(session));
      setView('result');
      answerLockedRef.current = false;
      return;
    }

    setSession((previous) =>
      previous ? { ...previous, currentIndex: previous.currentIndex + 1 } : previous,
    );
    answerLockedRef.current = false;
  }

  function handleExitQuiz() {
    answerLockedRef.current = false;
    setSession(null);
    setView('setup');
    showToast('已退出本次抽背，答过的题目已保存。', 'info');
  }

  function handleRetryWrong() {
    if (!result || !session || result.wrongWordIds.length === 0) return;

    const retrySession = buildRetrySession(
      words,
      result.wrongWordIds,
      session.config.direction,
      true,
    );
    if (retrySession.questions.length === 0) {
      showToast('错题词条不存在，无法重练。', 'error');
      return;
    }

    setConfig((previous) => ({
      ...previous,
      count: result.wrongWordIds.length,
      scope: 'wrong',
    }));
    setSession(retrySession);
    setResult(null);
    answerLockedRef.current = false;
    setView('quiz');
  }

  function handleStudyAgain() {
    setView('setup');
  }

  function handleBackLibrary() {
    setView('library');
  }

  const storageBanner =
    storageError && storageError !== dismissedStorageError ? (
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-xs leading-relaxed text-coral-700">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="flex-1">{storageError}</p>
        <button
          type="button"
          onClick={() => setDismissedStorageError(storageError)}
          className="rounded-full p-1 text-coral-500 transition hover:bg-coral-100 hover:text-coral-700"
          aria-label="关闭存储提示"
        >
          <XIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    ) : null;

  let page;
  if (view === 'setup') {
    page = (
      <SetupPage
        words={words}
        config={config}
        onChangeConfig={setConfig}
        onStart={handleStartStudy}
        onBack={handleBackLibrary}
      />
    );
  } else if (view === 'quiz' && session) {
    page = (
      <QuizPage
        words={words}
        session={session}
        onSubmitAnswer={handleSubmitAnswer}
        onNext={handleNextQuestion}
        onExit={handleExitQuiz}
      />
    );
  } else if (view === 'result' && session && result) {
    page = (
      <ResultPage
        result={result}
        session={session}
        words={words}
        onRetryWrong={handleRetryWrong}
        onStudyAgain={handleStudyAgain}
        onBackLibrary={handleBackLibrary}
        onViewStats={() => setView('stats')}
      />
    );
  } else if (view === 'stats') {
    page = (
      <StatsPage
        words={words}
        stats={stats}
        onStartScope={openSetup}
        onBackLibrary={handleBackLibrary}
      />
    );
  } else {
    page = (
      <LibraryPage
        words={words}
        stats={stats}
        tags={tags}
        onAddWord={addWord}
        onAddWords={addWords}
        onUpdateWord={updateWord}
        onDeleteWord={deleteWord}
        onStartStudy={() => openSetup()}
        onNotify={showToast}
      />
    );
  }

  return (
    <>
      <AppShell
        view={view}
        focusMode={view === 'quiz' && Boolean(session)}
        wordCount={words.length}
        onNavigate={goTo}
      >
        {storageBanner}
        {page}
      </AppShell>
      <Toast toast={toast} onDismiss={dismissToast} />
    </>
  );
}
