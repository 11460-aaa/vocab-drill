/**
 * 全局类型定义。
 * 词库本身只依赖 Word；抽背会话相关的类型用于页面之间的数据传递。
 */

export interface Word {
  id: string;
  /** 英文/词条，必填 */
  en: string;
  /** 中文释义，必填；多个义项用 ; / , 等分隔 */
  zh: string;
  /** 音标，可选 */
  phonetic?: string;
  /** 备注/例句，可选 */
  note?: string;
  /** 分组标签，可选 */
  tag?: string;
  createdAt: number;

  /** 学习数据 */
  correctCount: number;
  wrongCount: number;
  /** 当前连续答对次数 */
  streak: number;
  /** streak >= 3 时置为 true */
  mastered: boolean;
  lastReviewedAt?: number;
}

/** 新增/编辑表单的原始输入 */
export interface WordInput {
  en: string;
  zh: string;
  phonetic?: string;
  note?: string;
  tag?: string;
}

export type QuizDirection = 'en-zh' | 'zh-en' | 'mixed';
export type QuestionDirection = 'en-zh' | 'zh-en';
export type StudyScope = 'all' | 'unmastered' | 'wrong' | 'tag';

export interface QuizConfig {
  count: number;
  direction: QuizDirection;
  scope: StudyScope;
  /** scope 为 tag 时使用 */
  tag?: string;
  shuffle: boolean;
}

export interface QuizQuestion {
  id: string;
  wordId: string;
  direction: QuestionDirection;
}

export interface QuizAnswer {
  questionId: string;
  wordId: string;
  direction: QuestionDirection;
  userAnswer: string;
  isCorrect: boolean;
  answeredAt: number;
}

export interface QuizSession {
  id: string;
  config: QuizConfig;
  questions: QuizQuestion[];
  answers: QuizAnswer[];
  /** 当前正在作答的题目下标（答题后不会自动前进） */
  currentIndex: number;
  startedAt: number;
}

export interface QuizResult {
  sessionId: string;
  total: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  wrongWordIds: string[];
  finishedAt: number;
}

export type AppView = 'library' | 'setup' | 'quiz' | 'result' | 'stats';

export interface WordStats {
  total: number;
  mastered: number;
  due: number;
  totalCorrect: number;
  totalWrong: number;
  accuracy: number;
}
