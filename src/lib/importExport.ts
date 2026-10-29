import type { Word } from '../types';

/**
 * 批量导入解析与 CSV / JSON 导出。
 * 解析器只负责识别与标记问题，不直接修改词库，便于先在界面中预览。
 */

export type ImportRowStatus = 'new' | 'duplicate' | 'error';

export interface ParsedImportRow {
  lineNumber: number;
  raw: string;
  en: string;
  zh: string;
  status: ImportRowStatus;
  message?: string;
}

export interface ImportPreview {
  rows: ParsedImportRow[];
  total: number;
  newCount: number;
  duplicateCount: number;
  errorCount: number;
}

const HEADER_ROW = /^(?:english|word|英文|单词)\s*[,，\t]\s*(?:chinese|meaning|中文|释义)$/i;
const LIST_PREFIX = /^\s*(?:[-*•]|\d+[.)、])\s+/;

function normalizeDuplicateKey(value: string): string {
  return value.trim().toLocaleLowerCase();
}

/** 去掉粘贴时常见的列表符号，避免把 “- apple” 当成英文。 */
function stripListPrefix(line: string): string {
  return line.replace(LIST_PREFIX, '').trim();
}

/**
 * 拆分一行。
 * 优先级：Tab > 英文逗号/中文逗号 > 中文起始位置 > 第一段空白。
 * “英文 中文”这种空格分隔写法依靠首个中文字符定位，因此也支持
 * “give up 放弃” 这类含空格的英文短语。
 */
function splitImportLine(line: string): { en: string; zh: string } {
  const tabIndex = line.indexOf('\t');
  if (tabIndex >= 0) {
    return {
      en: line.slice(0, tabIndex).trim(),
      zh: line.slice(tabIndex + 1).trim(),
    };
  }

  const commaIndexes = [line.indexOf(','), line.indexOf('，')].filter((index) => index >= 0);
  if (commaIndexes.length > 0) {
    const commaIndex = Math.min(...commaIndexes);
    return {
      en: line.slice(0, commaIndex).trim(),
      zh: line.slice(commaIndex + 1).trim(),
    };
  }

  const cjkIndex = line.search(/[\u3400-\u9fff]/u);
  if (cjkIndex > 0) {
    return {
      en: line.slice(0, cjkIndex).trim(),
      zh: line.slice(cjkIndex).trim(),
    };
  }

  const spaceMatch = line.match(/^(\S+)\s+(.+)$/u);
  if (spaceMatch) {
    return { en: spaceMatch[1].trim(), zh: spaceMatch[2].trim() };
  }

  return { en: line.trim(), zh: '' };
}

/**
 * 解析批量导入文本。
 * - 每行一个词；
 * - 支持 Tab、英文逗号、中文逗号、空格分隔；
 * - 空行自动忽略；
 * - 自动识别常见表头；
 * - 标记词库中已存在的重复词，以及文本内部重复。
 */
export function parseImportText(text: string, existingWords: Word[]): ImportPreview {
  const existingKeys = new Set(existingWords.map((word) => normalizeDuplicateKey(word.en)));
  const seenKeys = new Map<string, number>();
  const rows: ParsedImportRow[] = [];
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const trimmed = rawLine.trim();
    if (!trimmed) return;
    // 常见表头不当作错误行（允许前面有空行）。
    if (HEADER_ROW.test(trimmed)) return;

    const line = stripListPrefix(trimmed);
    if (!line) return;

    const { en, zh } = splitImportLine(line);

    if (!en && !zh) {
      rows.push({
        lineNumber,
        raw: rawLine,
        en,
        zh,
        status: 'error',
        message: '空行或无法识别的格式',
      });
      return;
    }
    if (!en) {
      rows.push({
        lineNumber,
        raw: rawLine,
        en,
        zh,
        status: 'error',
        message: '缺少英文词条',
      });
      return;
    }
    if (!zh) {
      rows.push({
        lineNumber,
        raw: rawLine,
        en,
        zh,
        status: 'error',
        message: '缺少中文释义（请用逗号、Tab 或空格分隔）',
      });
      return;
    }

    const key = normalizeDuplicateKey(en);
    const existing = existingKeys.has(key);
    const previousLine = seenKeys.get(key);

    if (existing) {
      rows.push({
        lineNumber,
        raw: rawLine,
        en,
        zh,
        status: 'duplicate',
        message: '词库中已有相同英文',
      });
      return;
    }

    if (previousLine) {
      rows.push({
        lineNumber,
        raw: rawLine,
        en,
        zh,
        status: 'duplicate',
        message: `与本段第 ${previousLine} 行重复`,
      });
      return;
    }

    seenKeys.set(key, lineNumber);
    rows.push({ lineNumber, raw: rawLine, en, zh, status: 'new' });
  });

  const newCount = rows.filter((row) => row.status === 'new').length;
  const duplicateCount = rows.filter((row) => row.status === 'duplicate').length;
  const errorCount = rows.filter((row) => row.status === 'error').length;

  return { rows, total: rows.length, newCount, duplicateCount, errorCount };
}

/** 读取预览中可导入的行；includeDuplicates 控制是否连重复词一起导入。 */
export function getImportableRows(
  preview: ImportPreview,
  includeDuplicates: boolean,
): ParsedImportRow[] {
  return preview.rows.filter(
    (row) => row.status === 'new' || (includeDuplicates && row.status === 'duplicate'),
  );
}

const CSV_HEADERS = [
  'id',
  'en',
  'zh',
  'phonetic',
  'note',
  'tag',
  'createdAt',
  'correctCount',
  'wrongCount',
  'streak',
  'mastered',
  'lastReviewedAt',
] as const;

function escapeCsvCell(value: string | number | boolean | undefined): string {
  if (value === undefined) return '';
  const text = String(value);
  // 引号、逗号、换行都要包在双引号里；内部双引号转义为两个双引号。
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/** 生成带 BOM 的 UTF-8 CSV，方便 Excel 正确识别中文。 */
export function wordsToCsv(words: Word[]): string {
  const rows = words.map((word) =>
    CSV_HEADERS.map((header) => escapeCsvCell(word[header])).join(','),
  );
  return `\uFEFF${CSV_HEADERS.join(',')}\r\n${rows.join('\r\n')}`;
}

/** JSON 备份包含版本号与导出时间，词条字段完整保留。 */
export function wordsToJson(words: Word[]): string {
  return JSON.stringify(
    {
      app: '拾词',
      version: 1,
      exportedAt: new Date().toISOString(),
      words,
    },
    null,
    2,
  );
}

/** 触发浏览器下载。只在前端运行，不请求任何外部服务。 */
export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // 释放对象 URL，避免重复导出造成内存占用。
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function exportFilename(extension: 'json' | 'csv', date = new Date()): string {
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
  return `拾词-生词本-${stamp}.${extension}`;
}
