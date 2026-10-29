import { useCallback, useEffect, useRef, useState } from 'react';
import type { Word, WordInput } from '../types';
import { createId } from '../lib/id';
import { applyAnswerToWord, loadWords, saveWords } from '../lib/storage';

function normalizeEnglishKey(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
}

function makeWord(input: WordInput, createdAt: number): Word {
  return {
    id: createId(),
    en: input.en.trim(),
    zh: input.zh.trim(),
    phonetic: input.phonetic?.trim() || undefined,
    note: input.note?.trim() || undefined,
    tag: input.tag?.trim() || undefined,
    createdAt,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    mastered: false,
  };
}

/**
 * 词库状态与 localStorage 的连接层。
 * 初次读取只加载不写回，避免损坏数据被空词库覆盖。
 */
export function useWordbook() {
  // useState 的惰性初始化保证 localStorage 只在挂载时读取一次。
  const [initial] = useState(loadWords);
  const [words, setWords] = useState<Word[]>(initial.words);
  const [storageError, setStorageError] = useState<string | null>(initial.error);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const lastSavedJson = useRef(JSON.stringify(initial.words));

  useEffect(() => {
    const serialized = JSON.stringify(words);
    // 初次渲染（含 StrictMode 的重复挂载）不产生无意义的写入。
    if (serialized === lastSavedJson.current) return;

    const result = saveWords(words);
    if (result.ok) {
      lastSavedJson.current = serialized;
      setStorageError(null);
      setLastSavedAt(Date.now());
    } else {
      setStorageError(result.error);
    }
  }, [words]);

  const addWord = useCallback((input: WordInput): Word => {
    const word = makeWord(input, Date.now());
    setWords((previous) => [word, ...previous]);
    return word;
  }, []);

  const addWords = useCallback((inputs: WordInput[]): number => {
    const now = Date.now();
    // 逐条递增时间戳，保证“最近添加”排序稳定。
    const newWords = inputs.map((input, index) => makeWord(input, now + index));
    if (newWords.length === 0) return 0;
    setWords((previous) => [...newWords, ...previous]);
    return newWords.length;
  }, []);

  const updateWord = useCallback((id: string, input: WordInput) => {
    setWords((previous) =>
      previous.map((word) =>
        word.id === id
          ? {
              ...word,
              en: input.en.trim(),
              zh: input.zh.trim(),
              phonetic: input.phonetic?.trim() || undefined,
              note: input.note?.trim() || undefined,
              tag: input.tag?.trim() || undefined,
            }
          : word,
      ),
    );
  }, []);

  const deleteWord = useCallback((id: string) => {
    setWords((previous) => previous.filter((word) => word.id !== id));
  }, []);

  /**
   * 每答一题立即记录，刷新前的已答数据也会保存。
   * 掌握度、连续答对、正确/错误次数全部在这里更新。
   */
  const recordAnswer = useCallback((wordId: string, isCorrect: boolean) => {
    setWords((previous) =>
      previous.map((word) =>
        word.id === wordId ? applyAnswerToWord(word, isCorrect) : word,
      ),
    );
  }, []);

  /** 查找重复英文（忽略大小写与多余空格），用于添加前的二次确认。 */
  const findDuplicate = useCallback(
    (en: string, excludeId?: string): Word | undefined => {
      const key = normalizeEnglishKey(en);
      if (!key) return undefined;
      return words.find(
        (word) => word.id !== excludeId && normalizeEnglishKey(word.en) === key,
      );
    },
    [words],
  );

  return {
    words,
    storageError,
    lastSavedAt,
    addWord,
    addWords,
    updateWord,
    deleteWord,
    recordAnswer,
    findDuplicate,
  };
}
