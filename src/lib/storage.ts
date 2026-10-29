import type { Word } from '../types';
import { createId } from './id';
import { MASTERY_STREAK, STORAGE_KEY } from './constants';

/**
 * localStorage 读写层。
 * 所有异常都转换成可展示的中文错误，界面不会因为存储损坏或隐私模式而崩溃。
 */

interface StoredPayload {
  version: 1;
  words: Word[];
}

export interface LoadResult {
  words: Word[];
  error: string | null;
}

export interface SaveResult {
  ok: boolean;
  error: string | null;
}

function asFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

/**
 * 把来自 localStorage 的任意值收敛成合法 Word。
 * 数据损坏时尽量保留可用字段，而不是让整个词库不可用。
 */
function sanitizeWord(raw: unknown, index: number): Word | null {
  if (!raw || typeof raw !== 'object') return null;

  const record = raw as Record<string, unknown>;
  const en = asOptionalString(record.en);
  const zh = asOptionalString(record.zh);
  if (!en || !zh) return null;

  const streak = asFiniteNumber(record.streak, 0);
  const createdAt = asFiniteNumber(record.createdAt, Date.now() + index);

  return {
    id: asOptionalString(record.id) ?? createId(),
    en,
    zh,
    phonetic: asOptionalString(record.phonetic),
    note: asOptionalString(record.note),
    tag: asOptionalString(record.tag),
    createdAt,
    correctCount: asFiniteNumber(record.correctCount, 0),
    wrongCount: asFiniteNumber(record.wrongCount, 0),
    streak,
    // 掌握状态由连续答对次数唯一决定，避免持久化的字段互相矛盾。
    mastered: streak >= MASTERY_STREAK,
    lastReviewedAt:
      record.lastReviewedAt === undefined
        ? undefined
        : asFiniteNumber(record.lastReviewedAt, 0) || undefined,
  };
}

/** 读取词库。支持数组和 { version, words } 两种历史格式。 */
export function loadWords(): LoadResult {
  if (typeof window === 'undefined') {
    return { words: [], error: null };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { words: [], error: null };

    const parsed: unknown = JSON.parse(raw);
    const list = Array.isArray(parsed)
      ? parsed
      : parsed &&
          typeof parsed === 'object' &&
          Array.isArray((parsed as StoredPayload).words)
        ? (parsed as StoredPayload).words
        : null;

    if (!list) {
      return {
        words: [],
        error: '本地词库格式异常，已暂时以空词库启动；原数据仍保留在浏览器中。',
      };
    }

    const seenIds = new Set<string>();
    const words: Word[] = [];
    list.forEach((item, index) => {
      const word = sanitizeWord(item, index);
      if (!word) return;
      // 防御损坏数据中的重复 ID，避免更新时命中多个词。
      if (seenIds.has(word.id)) {
        word.id = createId();
      }
      seenIds.add(word.id);
      words.push(word);
    });

    return { words, error: null };
  } catch (error) {
    console.warn('[拾词] 读取本地词库失败：', error);
    return {
      words: [],
      error:
        '无法读取本地词库（可能禁用了网站存储或数据已损坏），已暂时以空词库启动。',
    };
  }
}

/** 写入词库。若存储空间不足或被浏览器禁用，返回错误供界面提示。 */
export function saveWords(words: Word[]): SaveResult {
  if (typeof window === 'undefined') {
    return { ok: false, error: '当前环境不支持本地存储。' };
  }

  try {
    const payload: StoredPayload = { version: 1, words };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return { ok: true, error: null };
  } catch (error) {
    console.warn('[拾词] 写入本地词库失败：', error);
    return {
      ok: false,
      error:
        '保存失败：浏览器存储空间可能已满，或网站存储被禁用。当前修改只存在于本页面，刷新后可能丢失。',
    };
  }
}

/**
 * 更新单个词的学习记录。
 * 掌握度规则：连续答对 3 次 => 已掌握；答错一次连续记录归零，同时取消掌握。
 */
export function applyAnswerToWord(
  word: Word,
  isCorrect: boolean,
  reviewedAt = Date.now(),
): Word {
  const streak = isCorrect ? word.streak + 1 : 0;

  return {
    ...word,
    correctCount: word.correctCount + (isCorrect ? 1 : 0),
    wrongCount: word.wrongCount + (isCorrect ? 0 : 1),
    streak,
    mastered: streak >= MASTERY_STREAK,
    lastReviewedAt: reviewedAt,
  };
}
