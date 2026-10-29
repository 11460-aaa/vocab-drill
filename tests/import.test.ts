import { describe, expect, it } from 'vitest';
import type { Word } from '../src/types';
import { parseImportText, wordsToCsv } from '../src/lib/importExport';

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

describe('批量导入解析', () => {
  it('支持逗号、Tab 和空格分隔', () => {
    const preview = parseImportText(
      'apple,苹果\nbanana\t香蕉\ngive up 放弃',
      [],
    );
    expect(preview.errorCount).toBe(0);
    expect(preview.rows.map((row) => [row.en, row.zh])).toEqual([
      ['apple', '苹果'],
      ['banana', '香蕉'],
      ['give up', '放弃'],
    ]);
  });

  it('标记缺少中文、空字段和重复项', () => {
    const preview = parseImportText(
      ['apple,苹果', 'apple,苹果', 'banana', 'cherry,樱桃'].join('\n'),
      [makeWord({ en: 'Cherry' })],
    );
    expect(preview.rows[0].status).toBe('new');
    expect(preview.rows[1].status).toBe('duplicate');
    expect(preview.rows[2].status).toBe('error');
    expect(preview.rows[2].message).toContain('缺少中文释义');
    expect(preview.rows[3].status).toBe('duplicate');
    expect(preview.newCount).toBe(1);
    expect(preview.errorCount).toBe(1);
  });

  it('忽略表头、空行和列表符号', () => {
    const preview = parseImportText('\n英文,中文\n- apple,苹果\n\n', []);
    expect(preview.rows).toHaveLength(1);
    expect(preview.rows[0].en).toBe('apple');
  });
});

describe('CSV 导出', () => {
  it('转义引号、逗号与换行，并带 BOM', () => {
    const csv = wordsToCsv([
      makeWord({ en: 'a,b', zh: '含"引号"\n和换行' }),
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"a,b"');
    expect(csv).toContain('"含""引号""\n和换行"');
  });
});
