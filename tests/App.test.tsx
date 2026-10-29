import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../src/App';
import { STORAGE_KEY } from '../src/lib/constants';
import type { Word } from '../src/types';

const WORDS = [
  { en: 'apple', zh: '苹果', tag: '水果' },
  { en: 'banana', zh: '香蕉' },
  { en: 'cherry', zh: '樱桃', tag: '水果' },
];

async function addWord(
  user: ReturnType<typeof userEvent.setup>,
  entry: (typeof WORDS)[number],
) {
  await user.type(screen.getByPlaceholderText('例如：serendipity'), entry.en);
  await user.type(
    screen.getByPlaceholderText('例如：意外发现珍宝的运气；机缘巧合'),
    entry.zh,
  );
  if (entry.tag) {
    await user.type(screen.getByPlaceholderText('例如：雅思 / 阅读'), entry.tag);
  }
  await user.click(
    within(screen.getByRole('main')).getByRole('button', { name: '添加到生词本' }),
  );
  await screen.findByText(entry.en);
}

function readStoredWords(): Word[] {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw) as { words?: Word[] } | Word[];
  return Array.isArray(parsed) ? parsed : (parsed.words ?? []);
}

/**
 * 完整用户路径自查：
 * 添加 3 个词 → 设置抽 2 个 → 答对 1 题 / 答错 1 题 → 查看结果和错题本。
 */
describe('抽背完整流程', () => {
  it('添加、抽背、记录统计和错题本', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('还没有生词')).toBeInTheDocument();

    for (const entry of WORDS) {
      await addWord(user, entry);
    }
    expect(screen.getAllByText('生词列表')).toHaveLength(1);

    // 进入设置页，把数量从默认 10 改为 2。
    await user.click(
      within(screen.getByRole('main')).getAllByRole('button', { name: /开始抽背/ })[0],
    );
    expect(await screen.findByText('这次，想抽几个？')).toBeInTheDocument();

    const countInput = within(screen.getByRole('main')).getByRole('spinbutton', {
      name: '每次抽背数量',
    });
    await user.clear(countInput);
    await user.type(countInput, '2');

    await user.click(
      within(screen.getByRole('main')).getByRole('button', { name: '开始抽背' }),
    );

    // 第一题：故意答错。
    const firstInput = await screen.findByLabelText('输入中文释义');
    const firstWord = WORDS.find((entry) => screen.queryByText(entry.en));
    expect(firstWord).toBeTruthy();
    const wrongWord = firstWord!;

    await user.type(firstInput, '完全不对的答案');
    await user.click(screen.getByRole('button', { name: /提交答案/ }));
    expect(await screen.findByText('这次还差一点。')).toBeInTheDocument();
    expect(screen.getAllByText(wrongWord.zh).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: /下一题/ }));

    // 第二题：答对。题目从剩余词中随机抽取。
    const secondInput = await screen.findByLabelText('输入中文释义');
    const secondWord = WORDS.filter((entry) => entry.en !== wrongWord.en).find((entry) =>
      screen.queryByText(entry.en),
    );
    expect(secondWord).toBeTruthy();
    const correctWord = secondWord!;

    await user.type(secondInput, correctWord.zh);
    await user.click(screen.getByRole('button', { name: /提交答案/ }));
    expect(await screen.findByText('答对了，记忆又牢了一点。')).toBeInTheDocument();

    // 最后一题手动进入小结。
    await user.click(screen.getByRole('button', { name: /查看本次小结/ }));
    expect(await screen.findByRole('heading', { name: '本次小结' })).toBeInTheDocument();
    expect(screen.getByText('本次出错的词')).toBeInTheDocument();
    expect(screen.getByText(wrongWord.en)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重练错题（1）/ })).toBeInTheDocument();

    // 查看统计 & 错题本。
    await user.click(screen.getByRole('button', { name: /查看错题本/ }));
    expect(
      await screen.findByRole('heading', { name: '统计 & 错题本' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(wrongWord.en).length).toBeGreaterThan(0);
    expect(screen.queryByText(correctWord.en)).not.toBeInTheDocument();

    // 校验 localStorage 中的学习数据。
    await waitFor(() => {
      const stored = readStoredWords();
      expect(stored).toHaveLength(3);

      const wrong = stored.find((word) => word.en === wrongWord.en)!;
      expect(wrong.wrongCount).toBe(1);
      expect(wrong.correctCount).toBe(0);
      expect(wrong.streak).toBe(0);
      expect(wrong.mastered).toBe(false);
      expect(wrong.lastReviewedAt).toBeTypeOf('number');

      const correct = stored.find((word) => word.en === correctWord.en)!;
      expect(correct.correctCount).toBe(1);
      expect(correct.wrongCount).toBe(0);
      expect(correct.streak).toBe(1);
      expect(correct.mastered).toBe(false);
    });
  });

  it('批量导入会先预览，再写入词库', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /批量导入/ }));
    const textarea = screen.getByLabelText('粘贴文本');
    await user.type(textarea, 'apple,苹果\nbanana\t香蕉');

    const importButton = await screen.findByRole('button', { name: '导入 2 个词' });
    await user.click(importButton);

    await waitFor(() => {
      expect(readStoredWords()).toHaveLength(2);
    });
    expect(await screen.findByText('banana')).toBeInTheDocument();
  });

  it('可以行内编辑，并在二次确认后删除词条', async () => {
    const user = userEvent.setup();
    render(<App />);
    await addWord(user, { en: 'apple', zh: '苹果' });

    await user.click(screen.getByRole('button', { name: '编辑 apple' }));
    const zhInput = screen.getByDisplayValue('苹果');
    await user.clear(zhInput);
    await user.type(zhInput, '苹果；苹果树');
    await user.click(screen.getByRole('button', { name: '保存修改' }));

    expect(await screen.findByText('苹果；苹果树')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '删除 apple' }));
    expect(await screen.findByText('删除这个生词？')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '确认删除' }));

    await waitFor(() => {
      expect(readStoredWords()).toHaveLength(0);
    });
    expect(screen.getByText('还没有生词')).toBeInTheDocument();
  });

  it('请求数量超过可用词数时询问并可按实际数量开始', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (const entry of WORDS) {
      await addWord(user, entry);
    }

    await user.click(
      within(screen.getByRole('main')).getAllByRole('button', { name: /开始抽背/ })[0],
    );
    await screen.findByText('这次，想抽几个？');
    await user.click(
      within(screen.getByRole('main')).getByRole('button', { name: '开始抽背' }),
    );

    expect(await screen.findByText('可用词数不足')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '按 3 个开始' }));

    expect(
      await screen.findByRole('progressbar', { name: '进度：第 1 题，共 3 题' }),
    ).toBeInTheDocument();
  });

  it('重复英文会先提示，确认后仍可添加', async () => {
    const user = userEvent.setup();
    render(<App />);

    await addWord(user, { en: 'apple', zh: '苹果' });

    await user.type(screen.getByPlaceholderText('例如：serendipity'), 'Apple');
    await user.type(
      screen.getByPlaceholderText('例如：意外发现珍宝的运气；机缘巧合'),
      '苹果公司',
    );
    await user.click(
      within(screen.getByRole('main')).getByRole('button', { name: '添加到生词本' }),
    );

    expect(await screen.findByText('这个英文已经存在')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '仍然添加' }));

    await waitFor(() => {
      expect(readStoredWords()).toHaveLength(2);
    });
  });
});
