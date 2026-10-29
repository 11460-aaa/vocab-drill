import { describe, expect, it } from 'vitest';
import type { QuizConfig, Word } from '../src/types';
import {
  buildQuizSession,
  buildRetrySession,
  getScopePool,
} from '../src/lib/quiz';

function makeWord(id: string, overrides: Partial<Word> = {}): Word {
  return {
    id,
    en: id,
    zh: `${id}-中文`,
    tag: undefined,
    createdAt: Number(id.replace(/\D/g, '')) || 1,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    mastered: false,
    ...overrides,
  };
}

const config: QuizConfig = {
  count: 2,
  direction: 'en-zh',
  scope: 'all',
  shuffle: true,
};

function seededRng(seed = 1) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('抽题逻辑', () => {
  it('按范围过滤词池', () => {
    const words = [
      makeWord('w1'),
      makeWord('w2', { mastered: true }),
      makeWord('w3', { wrongCount: 2 }),
      makeWord('w4', { tag: '雅思' }),
    ];
    expect(getScopePool(words, { ...config, scope: 'unmastered' })).toHaveLength(3);
    expect(getScopePool(words, { ...config, scope: 'wrong' })).toHaveLength(1);
    expect(getScopePool(words, { ...config, scope: 'tag', tag: '雅思' })).toHaveLength(1);
  });

  it('请求数量超过词池时自动截断，题目不重复', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')];
    const session = buildQuizSession(words, { ...config, count: 10 }, seededRng(3));
    expect(session.questions).toHaveLength(3);
    expect(new Set(session.questions.map((q) => q.wordId)).size).toBe(3);
    expect(session.config.count).toBe(3);
  });

  it('关闭打乱顺序时按词库原顺序出题', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')];
    const session = buildQuizSession(
      words,
      { ...config, count: 2, shuffle: false },
      seededRng(9),
    );
    const selectedIds = session.questions.map((q) => q.wordId);
    const originalIndices = selectedIds.map((id) => words.findIndex((word) => word.id === id));
    expect(originalIndices).toEqual([...originalIndices].sort((a, b) => a - b));
  });

  it('混合方向尽量保持两个方向均衡', () => {
    const words = Array.from({ length: 4 }, (_, index) => makeWord(`w${index + 1}`));
    const session = buildQuizSession(
      words,
      { ...config, count: 4, direction: 'mixed', shuffle: false },
      seededRng(5),
    );
    const directions = session.questions.map((q) => q.direction);
    expect(directions.filter((direction) => direction === 'en-zh')).toHaveLength(2);
    expect(directions.filter((direction) => direction === 'zh-en')).toHaveLength(2);
  });

  it('重练错题只包含指定词', () => {
    const words = [makeWord('w1'), makeWord('w2'), makeWord('w3')];
    const session = buildRetrySession(words, ['w1', 'w3'], 'en-zh', false);
    expect(session.questions.map((q) => q.wordId).sort()).toEqual(['w1', 'w3']);
    expect(session.config.scope).toBe('wrong');
  });
});
