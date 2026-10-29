# 拾词 · 个人生词抽背

一个纯前端的个人生词抽背网站：自己录入英文 / 中文释义，按设定数量随机抽题，只显示题干的一侧，由你输入答案，即时判定并记录掌握情况。

数据只保存在浏览器 `localStorage` 中，不需要后端、不需要登录、不使用任何 API Key，可直接部署到任意静态托管平台。

## 功能一览

- **生词本**：添加、搜索、标签筛选、行内编辑、二次确认删除
- **批量导入**：逗号 / Tab / 空格分隔，导入前实时预览，标出错误行与重复词
- **导出备份**：完整 JSON、Excel 友好的 UTF-8 CSV
- **抽背设置**：数量、英译中 / 中译英 / 随机混合、全部 / 未掌握 / 错题本 / 标签范围、是否打乱
- **答题流程**：进度、回车提交、即时判定、完整词条反馈、手动进入下一题
- **本次小结**：正确率、错题列表、重练错题、再来一组
- **学习统计**：总词数、已掌握、待复习、累计正确率、掌握进度
- **错题本**：自动维护「答错过且尚未掌握」的词
- **健壮性**：localStorage 异常兜底、空状态引导、刷新不丢词库和学习记录
- **响应式**：手机与桌面均可用，答题页为低干扰专注模式

## 技术栈

- React 18 + TypeScript
- Vite 7
- Tailwind CSS 3
- localStorage（无后端）
- Vitest + Testing Library（21 个逻辑 / 集成测试）

没有引入 UI 组件库，所有按钮、弹窗、图标、开关均为项目内原生实现。

## 快速开始

环境要求：Node.js **>= 20.19**，npm 9+。

```bash
# 1. 进入项目目录
cd vocab-drill

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

打开终端中显示的地址（默认 <http://localhost:5173>）即可使用。

### 手机 / 局域网预览

`vite.config.ts` 已配置：

```ts
server: {
  host: '0.0.0.0',
  port: 5173,
  strictPort: true,
}
```

因此开发服务器会监听所有网卡，同一 Wi-Fi 下的手机可以直接访问。

1. 手机和电脑连接**同一个 Wi-Fi / 局域网**；
2. 电脑终端运行 `npm run dev`；
3. 查电脑局域网 IPv4：
   - Windows：运行 `ipconfig`，找到当前 Wi-Fi 适配器（如「无线局域网适配器 WLAN」）下的「IPv4 地址」；
   - macOS：运行 `ipconfig getifaddr en0`；
   - Linux：运行 `hostname -I`；
4. 手机浏览器访问 `http://电脑局域网IP:5173/`，例如 `http://192.168.1.23:5173/`。

注意：

- 手机上不要填 `localhost` 或 `127.0.0.1`，那会指向手机自身；
- 优先使用 Wi-Fi / WLAN 的 IPv4，不要选 VPN、虚拟机、Clash 等虚拟网卡的地址；
- 如果打不开，确认 Windows 防火墙允许 Node.js 入站，或临时切换网络配置；路由器开启「AP 隔离」时手机与电脑也可能无法互访；
- 局域网访问和线上部署都不会自动同步数据：手机的 `localStorage` 是独立的，首次打开会是空词库。

### 构建与本地预览

```bash
npm run build
npm run preview
```

构建产物在 `dist/`。`vite.config.ts` 中 `base: './'`，因此 `dist` 可部署到：

- GitHub Pages（子路径也可以）
- Netlify / Vercel
- Cloudflare Pages
- 任意 Nginx / 静态文件服务器
- 本地 `file://` 直接打开不保证可用，建议通过静态服务器访问

项目已包含平台配置：

- `vercel.json`：Vite 构建命令与 `dist` 输出目录；
- `netlify.toml`：Netlify 构建命令、发布目录与 Node 版本；
- 本站使用客户端状态切换、没有 URL 路由，因此**不需要** SPA rewrite / 404 重写规则。

完整部署步骤见 [DEPLOY.md](DEPLOY.md)：包含 Netlify Drop / Vercel Drop 拖拽部署，以及 GitHub 导入长期部署的保姆级教程。

### 测试

```bash
npm test          # 运行全部测试
npm run test:watch
```

## 使用说明

1. **添加生词**：在首页表单填写英文、中文释义即可。音标、备注、标签为选填。
2. **开始抽背**：点击「开始抽背」进入设置页，选择数量、方向、范围和顺序。
3. **答题**：输入答案后按 Enter 或点击「提交答案」；判定后须点击「下一题」，不会自动跳转。
4. **查看结果**：完成全部题目后查看正确率与错题明细，可直接「重练错题」。
5. **复盘**：在「统计 · 错题本」中查看累计数据和需要巩固的词。

页面切换使用 React 状态（客户端状态切换），没有依赖 URL 路由。刷新页面会回到首页，但**词库与已有学习记录不会丢失**；未完成的当前抽背会话需重新开始，已经作答的题会保留记录。

## 批量导入格式

每行一个词，格式为 `英文 + 分隔符 + 中文释义`。支持：

| 分隔方式 | 示例 |
| --- | --- |
| 英文逗号 | `apple,苹果` |
| 中文逗号 | `apple，苹果` |
| Tab | `apple	苹果` |
| 空格 | `give up 放弃` |
| 多项中文释义 | `apple,苹果；苹果树` |

额外规则：

- 空行自动忽略；
- 常见表头（如 `英文,中文`、`English,Chinese`）自动忽略；
- 行首的 `-`、`*`、`•`、`1.` 等列表符号会自动去掉；
- 英文短语含空格时也能正确解析，例如 `look after 照顾`；
- 词库中已存在（忽略大小写、首尾空格）的英文会标记为「重复」，默认跳过；可勾选「连重复行一起导入」；
- 缺少英文或中文的行会标为「错误」并给出原因，不会被静默导入；
- 预览最多显示前 100 行，导入时会处理全部有效行。

导入后仍可在列表中行内编辑补充音标、备注和标签。

## 答案判定规则

判定逻辑集中在 `src/lib/answer.ts`，核心目标是宽容匹配「是否答出了正确含义」。

- 忽略大小写、首尾空格和多余空格；
- 忽略中英文标点差异（`，。；、/`、英文句点与逗号等）以及全角 / 半角差异；
- 中文释义按 `;` `；` `/` `／` `,` `，` `、` `|` 分隔，答出**任意一个义项**即正确；
- 中文义项允许带词性或括号说明：`n. 苹果（水果）` 接受 `苹果`；
- 也接受把多个义项连着写出来（标点与空格被忽略后匹配完整释义）；
- 中译英允许简单复数差异：`apple / apples`、`study / studies`、`box / boxes`；
- 判定是归一化后的**完整匹配**，不是模糊子串匹配；同义改写需要在中文释义中补充为义项。

## 掌握度与统计口径

每答一题都会立即更新该词的学习数据：

| 字段 | 规则 |
| --- | --- |
| `correctCount` | 答对 +1 |
| `wrongCount` | 答错 +1 |
| `streak` | 答对 +1；答错清零 |
| `mastered` | `streak >= 3` 时为 `true` |
| `lastReviewedAt` | 更新为本次作答时间 |

- **已掌握**：连续答对 3 次。已掌握后答错会清零连击并重新变为未掌握。
- **待复习**：总词数 − 已掌握数。
- **累计正确率**：所有词的历史答对次数 ÷（答对次数 + 答错次数）；没有记录时显示 `—`。
- **错题本**：`wrongCount > 0 && !mastered` 的词，按错误次数与最近复习时间排序。

## 数据存储

- localStorage key：`vocab-drill.words.v1`
- 存储结构：

```json
{
  "version": 1,
  "words": [
    {
      "id": "uuid",
      "en": "apple",
      "zh": "苹果；苹果树",
      "phonetic": "ˈæpəl",
      "note": "An apple a day...",
      "tag": "水果",
      "createdAt": 1730000000000,
      "correctCount": 2,
      "wrongCount": 1,
      "streak": 1,
      "mastered": false,
      "lastReviewedAt": 1730000000000
    }
  ]
}
```

注意事项：

- 数据属于**当前浏览器 + 当前域名**。`localhost:5173`、局域网 IP、Netlify / Vercel 域名之间互不共享。
- **部署上线不会把电脑或手机的数据同步过去**，也不会让手机与电脑共享学习记录。纯前端 localStorage 方案没有跨设备同步能力；每个设备、每个站点域名都是独立词库。
- 清除浏览器站点数据、使用无痕模式的临时会话、更换浏览器或设备都会导致数据不可见。
- 建议定期用首页的「导出 JSON」备份；CSV 适合在表格软件中查看。
- 读取损坏数据、存储被禁用或空间不足时，界面会显示醒目提示，不会白屏；已有数据不会被静默覆盖。
- 整个应用不发起任何业务网络请求。

## 项目结构

```text
vocab-drill/
├─ index.html
├─ package.json
├─ package-lock.json
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.app.json
├─ tsconfig.node.json
├─ tailwind.config.js
├─ postcss.config.js
├─ netlify.toml
├─ vercel.json
├─ .gitignore
├─ LICENSE
├─ README.md
├─ DEPLOY.md
├─ src/
│  ├─ main.tsx                 # React 入口
│  ├─ App.tsx                  # 页面状态、抽背会话编排、答题记录
│  ├─ index.css                # Tailwind 入口与全局样式
│  ├─ types.ts                 # Word / QuizConfig / QuizSession 等类型
│  ├─ components/
│  │  ├─ AppShell.tsx          # 品牌头部、导航、专注模式布局
│  │  ├─ WordForm.tsx          # 添加 / 编辑表单、重复词确认
│  │  ├─ WordList.tsx          # 搜索、标签筛选、行内编辑、删除
│  │  ├─ ImportDialog.tsx      # 批量导入解析预览弹窗
│  │  ├─ StatsGrid.tsx         # 四项核心统计卡片
│  │  ├─ EmptyState.tsx        # 统一空状态
│  │  ├─ TagBadge.tsx
│  │  ├─ Toast.tsx
│  │  ├─ Icons.tsx             # 内联 SVG 图标
│  │  └─ ui/
│  │     ├─ Button.tsx
│  │     ├─ Modal.tsx          # 焦点圈定 / Esc / 滚动锁定
│  │     └─ ConfirmDialog.tsx
│  ├─ hooks/
│  │  ├─ useWordbook.ts        # 词库 CRUD、学习记录、持久化
│  │  └─ useToast.ts
│  ├─ lib/
│  │  ├─ answer.ts             # 归一化与答案判定
│  │  ├─ quiz.ts               # 筛选、随机抽题、混合方向、小结
│  │  ├─ storage.ts            # localStorage 容错读写、掌握度计算
│  │  ├─ stats.ts              # 统计、错题本、标签
│  │  ├─ importExport.ts       # 导入解析、JSON / CSV 导出
│  │  ├─ constants.ts
│  │  └─ id.ts
│  └─ pages/
│     ├─ LibraryPage.tsx       # 首页 / 生词本
│     ├─ SetupPage.tsx         # 抽背设置
│     ├─ QuizPage.tsx          # 答题页
│     ├─ ResultPage.tsx        # 结果页
│     └─ StatsPage.tsx         # 统计 & 错题本
└─ tests/
   ├─ setup.ts
   ├─ answer.test.ts           # 判定规则 / 掌握度
   ├─ quiz.test.ts             # 范围过滤 / 抽题 / 方向 / 错题重练
   ├─ import.test.ts           # 导入解析 / CSV 转义
   └─ App.test.tsx             # 添加→抽背→统计→错题本等完整流程
```

## 自查结果

仓库内已包含并通过以下自动化验证（`npm test`，21 个测试全部通过）：

- 添加 3 个词 → 设置抽 2 个 → 故意答错 1 题、答对 1 题 → 完成小结
- 核对结果页错题列表
- 进入统计页核对累计正确率与错题本
- 读取 localStorage，逐字段校验答对 / 答错词的 `correctCount`、`wrongCount`、`streak`、`mastered`、`lastReviewedAt`
- 重复英文提示与「仍然添加」二次确认
- 批量导入预览与写入
- 行内编辑、删除二次确认
- 数量超过可用词数时的确认弹窗并按实际数量开始
- 答案判定的标点、多义项、复数、词性 / 括号兼容
- 掌握度连续答对 3 次升级、答错清零
- 抽题范围过滤、混合方向均衡、关闭打乱后保持词库顺序

另外使用 Chrome 在 1440 / 1024 / 768 / 390 / 360 / 320 宽度下验证了首页、设置页和答题页无横向溢出，控制台无运行时报错。

## 设计说明

- 视觉以米白、墨绿、杏黄为主，英文词条使用衬线字体突出「词」的存在感。
- 答题页进入专注模式：隐藏主导航和页脚，仅保留进度、题干、输入与反馈。
- 所有关键逻辑均拆分为纯函数（`src/lib`），便于测试与后续扩展。
- 未引入任何 API Key 服务、统计脚本或远程字体，离线也能正常渲染。

## License

MIT。可自由修改与自用。
