import type { Word, WordStats } from '../types';

/** 汇总当前词库的统计数字。 */
export function getWordStats(words: Word[]): WordStats {
  const total = words.length;
  const mastered = words.filter((word) => word.mastered).length;
  const totalCorrect = words.reduce((sum, word) => sum + word.correctCount, 0);
  const totalWrong = words.reduce((sum, word) => sum + word.wrongCount, 0);
  const attempts = totalCorrect + totalWrong;

  return {
    total,
    mastered,
    due: total - mastered,
    totalCorrect,
    totalWrong,
    accuracy: attempts === 0 ? 0 : totalCorrect / attempts,
  };
}

/**
 * 错题本：答错过、且当前未被掌握的词。
 * 已掌握的词即使曾经答错，也不再进入错题本。
 */
export function getWrongBook(words: Word[]): Word[] {
  return words
    .filter((word) => word.wrongCount > 0 && !word.mastered)
    .sort(
      (a, b) =>
        b.wrongCount - a.wrongCount ||
        (b.lastReviewedAt ?? 0) - (a.lastReviewedAt ?? 0) ||
        b.createdAt - a.createdAt,
    );
}

/** 获取全部标签（去重、按中文排序）。 */
export function getAllTags(words: Word[]): string[] {
  const tags = new Set<string>();
  words.forEach((word) => {
    if (word.tag) tags.add(word.tag);
  });
  return [...tags].sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

/** 按标签统计词数，供设置页展示。 */
export function getTagCounts(words: Word[]): Array<{ tag: string; count: number }> {
  const counts = new Map<string, number>();
  words.forEach((word) => {
    if (!word.tag) return;
    counts.set(word.tag, (counts.get(word.tag) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-CN'));
}

/** 答题正确率的显示文本。没有作答记录时显示 —。 */
export function formatAccuracy(accuracy: number, attempts: number): string {
  if (attempts === 0) return '—';
  return `${Math.round(accuracy * 100)}%`;
}

/** 把时间格式化为“刚刚 / 3 分钟前 / 8 月 12 日”等短文本。 */
export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '还没有复习过';

  const delta = Date.now() - timestamp;
  if (delta < 60 * 1000) return '刚刚复习';
  if (delta < 60 * 60 * 1000) return `${Math.floor(delta / 60000)} 分钟前复习`;
  if (delta < 24 * 60 * 60 * 1000) return `${Math.floor(delta / 3600000)} 小时前复习`;

  const date = new Date(timestamp);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日复习`;
}
