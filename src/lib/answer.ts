import type { QuestionDirection, Word } from '../types';

/**
 * 答案判定模块
 * ------------------------------------------------------------------
 * 判定目标：宽容地判断“用户是否答出了正确含义”，而不是做逐字符比较。
 *
 * 规则：
 * 1. 忽略大小写、首尾空格、多余空格；
 * 2. 忽略中英文标点（，。；、/ 等）差异；
 * 3. 中文释义按 ; / , 等分隔，答出任意一个义项即正确；
 * 4. 英文允许简单的复数差异（apple / apples、study / studies、box / boxes）。
 */

/** 匹配标点、符号与空白。NFKC 会先把全角字符折叠成半角。 */
const PUNCTUATION_OR_SPACE = /[\p{P}\p{S}\s]+/gu;

/** 把一行中文释义拆成多个义项。分隔符兼容中英文。 */
const ZH_SENSE_SEPARATOR = /[;；/／,，、|｜\n\r]+/;

const POS_PREFIX =
  /^(?:n|v|vt|vi|adj|adv|prep|conj|pron|num|art|aux|int)\.\s*/i;

/** 统一大小写、全半角、标点与空白，只保留用于比较的字符。 */
export function normalizeAnswer(value: string): string {
  return value
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(PUNCTUATION_OR_SPACE, '');
}

/** 去掉词性标注与括号补充后，得到一个更短的义项变体。 */
function cleanSense(sense: string): string[] {
  const variants = new Set<string>();
  const base = sense.trim();
  if (!base) return [];

  variants.add(base);

  const withoutPos = base.replace(POS_PREFIX, '').trim();
  if (withoutPos) variants.add(withoutPos);

  // “苹果（水果）” -> “苹果”，方便用户只答核心词义。
  const withoutParentheses = base.replace(/[（(][^）)]*[）)]/g, '').trim();
  if (withoutParentheses) variants.add(withoutParentheses);

  // 同时去掉词性和括号：“n. 苹果（水果）” -> “苹果”。
  const withoutDecorations = withoutParentheses.replace(POS_PREFIX, '').trim();
  if (withoutDecorations) variants.add(withoutDecorations);

  return [...variants];
}

/** 提取中文释义中所有可接受的答案（已归一化、去重、去空）。 */
export function getChineseAnswerKeys(zh: string): string[] {
  const keys = new Set<string>();

  // 也接受把多个义项连着写出来的答案。例如释义为“你好，世界”，
  // 用户输入“你好 世界”时，标点被忽略后应能与完整释义匹配。
  const whole = normalizeAnswer(zh);
  if (whole) keys.add(whole);

  for (const rawSense of zh.split(ZH_SENSE_SEPARATOR)) {
    for (const variant of cleanSense(rawSense)) {
      const normalized = normalizeAnswer(variant);
      if (normalized) keys.add(normalized);
    }
  }

  return [...keys];
}

/**
 * 生成英文答案的宽松变体（处理简单复数）。
 * 同时给原词和单数形式建集合，比较时取交集，因此
 * apple / apples、study / studies、box / boxes 都能互相匹配。
 */
function getEnglishVariants(normalized: string): Set<string> {
  const variants = new Set<string>([normalized]);

  if (!/^[a-z]+$/.test(normalized) || normalized.length < 3) {
    return variants;
  }

  if (normalized.endsWith('ies') && normalized.length > 4) {
    variants.add(`${normalized.slice(0, -3)}y`);
  }
  if (normalized.endsWith('es') && normalized.length > 4) {
    variants.add(normalized.slice(0, -2));
  }
  // 避免把 class、glass 这类以 ss 结尾的词误判成单数。
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    variants.add(normalized.slice(0, -1));
  }

  return variants;
}

export interface AnswerCheckResult {
  isCorrect: boolean;
  /** 归一化后的用户答案，便于调试和展示 */
  normalizedAnswer: string;
  /** 命中的规范答案（没有命中时为 null） */
  matched: string | null;
}

/** 判定一道题是否答对。direction 决定比较英文还是中文。 */
export function checkAnswer(
  word: Pick<Word, 'en' | 'zh'>,
  direction: QuestionDirection,
  rawAnswer: string,
): AnswerCheckResult {
  const normalizedAnswer = normalizeAnswer(rawAnswer);

  if (!normalizedAnswer) {
    return { isCorrect: false, normalizedAnswer, matched: null };
  }

  if (direction === 'en-zh') {
    // 英译中：用户输入中文，答出任一义项即可。
    const keys = getChineseAnswerKeys(word.zh);
    const matched = keys.find((key) => key === normalizedAnswer) ?? null;
    return { isCorrect: Boolean(matched), normalizedAnswer, matched };
  }

  // 中译英：用户输入英文，允许大小写、标点与简单复数差异。
  const targetKeys = getEnglishVariants(normalizeAnswer(word.en));
  const answerKeys = getEnglishVariants(normalizedAnswer);
  const matched = [...answerKeys].find((key) => targetKeys.has(key)) ?? null;

  return { isCorrect: Boolean(matched), normalizedAnswer, matched };
}

/** 答题反馈中展示的“正确答案”。 */
export function getExpectedAnswer(
  word: Pick<Word, 'en' | 'zh'>,
  direction: QuestionDirection,
): string {
  return direction === 'en-zh' ? word.zh : word.en;
}

/** 题干中展示的内容。 */
export function getPromptText(
  word: Pick<Word, 'en' | 'zh'>,
  direction: QuestionDirection,
): string {
  return direction === 'en-zh' ? word.en : word.zh;
}

/** 中文释义的义项数量，用于列表展示。 */
export function countChineseSenses(zh: string): number {
  return new Set(
    zh
      .split(ZH_SENSE_SEPARATOR)
      .map((item) => item.trim())
      .filter(Boolean),
  ).size;
}
