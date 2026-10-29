import type {
  QuestionDirection,
  QuizAnswer,
  QuizConfig,
  QuizQuestion,
  QuizResult,
  QuizSession,
  Word,
} from '../types';
import { createId } from './id';

/**
 * 抽题与答题会话逻辑。
 * 这里全部是纯函数，便于单元测试；随机源可注入，测试结果可复现。
 */

/** Fisher–Yates 洗牌，返回新数组，不修改入参。 */
export function shuffleArray<T>(items: readonly T[], rng: () => number = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

/** 根据抽词范围得到候选词池。 */
export function getScopePool(words: Word[], config: QuizConfig): Word[] {
  switch (config.scope) {
    case 'unmastered':
      return words.filter((word) => !word.mastered);
    case 'wrong':
      // 与错题本保持一致：答错过且尚未掌握。
      return words.filter((word) => word.wrongCount > 0 && !word.mastered);
    case 'tag':
      return config.tag ? words.filter((word) => word.tag === config.tag) : [];
    case 'all':
    default:
      return words;
  }
}

/**
 * 为每题分配方向。
 * 混合模式会尽量让两个方向各占一半，再依据“打乱顺序”设置决定是否打乱方向序列，
 * 避免连续出现同一方向的题干。
 */
function buildDirections(
  count: number,
  direction: QuizConfig['direction'],
  shouldShuffle: boolean,
  rng: () => number,
): QuestionDirection[] {
  if (direction !== 'mixed') {
    return Array.from({ length: count }, () => direction);
  }

  const directions: QuestionDirection[] = Array.from({ length: count }, (_, index) =>
    index % 2 === 0 ? 'en-zh' : 'zh-en',
  );

  return shouldShuffle ? shuffleArray(directions, rng) : directions;
}

/**
 * 创建一次抽背会话。
 *
 * 1. 按范围过滤候选词；
 * 2. 随机抽取 count 个词；
 * 3. 如果关闭“打乱顺序”，抽中的词仍按词库原顺序出现
 *    （抽题本身仍然随机，开关只影响作答顺序）；
 * 4. 混合方向时尽量均衡。
 */
export function buildQuizSession(
  words: Word[],
  config: QuizConfig,
  rng: () => number = Math.random,
  now = Date.now(),
): QuizSession {
  const pool = getScopePool(words, config);
  const count = Math.max(1, Math.min(Math.floor(config.count) || 1, pool.length));

  const drawn = shuffleArray(pool, rng).slice(0, count);
  const ordered = config.shuffle
    ? drawn
    : pool.filter((word) => drawn.some((item) => item.id === word.id));

  const directions = buildDirections(ordered.length, config.direction, config.shuffle, rng);
  const questions: QuizQuestion[] = ordered.map((word, index) => ({
    id: createId(),
    wordId: word.id,
    direction: directions[index],
  }));

  return {
    id: createId(),
    config: { ...config, count: ordered.length },
    questions,
    answers: [],
    currentIndex: 0,
    startedAt: now,
  };
}

/**
 * 重练错题：直接用指定词创建会话。
 * 常见用于结果页的“重练错题”和错题本入口。
 */
export function buildRetrySession(
  words: Word[],
  wordIds: string[],
  direction: QuizConfig['direction'] = 'mixed',
  shouldShuffle = true,
  rng: () => number = Math.random,
  now = Date.now(),
): QuizSession {
  const selected = wordIds
    .map((id) => words.find((word) => word.id === id))
    .filter((word): word is Word => Boolean(word));

  const ordered = shouldShuffle ? shuffleArray(selected, rng) : selected;
  const directions = buildDirections(ordered.length, direction, shouldShuffle, rng);

  return {
    id: createId(),
    config: {
      count: ordered.length,
      direction,
      scope: 'wrong',
      shuffle: shouldShuffle,
    },
    questions: ordered.map((word, index) => ({
      id: createId(),
      wordId: word.id,
      direction: directions[index],
    })),
    answers: [],
    currentIndex: 0,
    startedAt: now,
  };
}

/** 取当前题目和当前词。session 已完成时返回 null。 */
export function getCurrentQuestion(
  session: QuizSession,
  wordMap: Map<string, Word>,
): { question: QuizQuestion; word: Word; index: number } | null {
  const index = session.currentIndex;
  const question = session.questions[index];
  if (!question) return null;
  const word = wordMap.get(question.wordId);
  if (!word) return null;
  return { question, word, index };
}

/** 根据会话中的答题记录生成小结。 */
export function buildQuizResult(session: QuizSession, finishedAt = Date.now()): QuizResult {
  const correctCount = session.answers.filter((answer) => answer.isCorrect).length;
  const wrongAnswers = session.answers.filter((answer) => !answer.isCorrect);
  const total = session.answers.length;

  return {
    sessionId: session.id,
    total,
    correctCount,
    wrongCount: total - correctCount,
    accuracy: total === 0 ? 0 : correctCount / total,
    wrongWordIds: [...new Set(wrongAnswers.map((answer) => answer.wordId))],
    finishedAt,
  };
}

/** 当前题是否已经作答（用于显示反馈、防止重复提交）。 */
export function getAnswerForCurrentQuestion(
  session: QuizSession,
): QuizAnswer | undefined {
  const question = session.questions[session.currentIndex];
  if (!question) return undefined;
  return session.answers.find((answer) => answer.questionId === question.id);
}
