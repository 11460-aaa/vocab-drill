import { describe, expect, it } from 'vitest';
import {
  checkAnswer,
  getChineseAnswerKeys,
  normalizeAnswer,
} from '../src/lib/answer';
import { applyAnswerToWord } from '../src/lib/storage';
import type { Word } from '../src/types';

describe('答案匹配', () => {
  it('忽略大小写、空格和标点', () => {
    expect(normalizeAnswer('  Hello,   World!  ')).toBe('helloworld');
    const word = { en: 'Hello, World!', zh: '你好，世界。' };
    expect(checkAnswer(word, 'en-zh', ' 你好 世界 ')).toMatchObject({ isCorrect: true });
    expect(checkAnswer(word, 'zh-en', 'hello   world')).toMatchObject({ isCorrect: true });
  });

  it('中文多义项答出任意一个即正确', () => {
    const word = { en: 'present', zh: '礼物；现在 / 出席，呈现' };
    expect(checkAnswer(word, 'en-zh', '礼物').isCorrect).toBe(true);
    expect(checkAnswer(word, 'en-zh', '现在').isCorrect).toBe(true);
    expect(checkAnswer(word, 'en-zh', '出席').isCorrect).toBe(true);
    expect(checkAnswer(word, 'en-zh', '过去的').isCorrect).toBe(false);
  });

  it('支持带词性和括号的义项', () => {
    expect(getChineseAnswerKeys('n. 苹果（水果）；v. 珍惜')).toContain('苹果');
    expect(getChineseAnswerKeys('n. 苹果（水果）')).toContain('n苹果');
  });

  it('英文允许简单复数差异', () => {
    expect(checkAnswer({ en: 'apple', zh: '苹果' }, 'zh-en', 'apples').isCorrect).toBe(true);
    expect(checkAnswer({ en: 'apples', zh: '苹果' }, 'zh-en', 'apple').isCorrect).toBe(true);
    expect(checkAnswer({ en: 'study', zh: '学习' }, 'zh-en', 'studies').isCorrect).toBe(true);
    expect(checkAnswer({ en: 'box', zh: '盒子' }, 'zh-en', 'boxes').isCorrect).toBe(true);
    expect(checkAnswer({ en: 'class', zh: '班级' }, 'zh-en', 'clas').isCorrect).toBe(false);
  });

  it('空答案不通过', () => {
    expect(checkAnswer({ en: 'apple', zh: '苹果' }, 'en-zh', '   ').isCorrect).toBe(false);
  });
});

function makeWord(overrides: Partial<Word> = {}): Word {
  return {
    id: 'w1',
    en: 'apple',
    zh: '苹果',
    createdAt: 1,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    mastered: false,
    ...overrides,
  };
}

describe('掌握度计算', () => {
  it('连续答对三次后标记为已掌握', () => {
    let word = makeWord();
    word = applyAnswerToWord(word, true, 100);
    expect(word.streak).toBe(1);
    expect(word.mastered).toBe(false);

    word = applyAnswerToWord(word, true, 200);
    word = applyAnswerToWord(word, true, 300);
    expect(word.streak).toBe(3);
    expect(word.mastered).toBe(true);
    expect(word.correctCount).toBe(3);
    expect(word.lastReviewedAt).toBe(300);
  });

  it('答错会清零连续记录并取消掌握', () => {
    let word = makeWord({ correctCount: 3, streak: 3, mastered: true });
    word = applyAnswerToWord(word, false, 500);
    expect(word.wrongCount).toBe(1);
    expect(word.streak).toBe(0);
    expect(word.mastered).toBe(false);
  });
});
