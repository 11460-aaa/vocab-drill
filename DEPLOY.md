# 部署上线保姆级教程

本项目是**纯静态前端**，构建后没有服务器、数据库或环境变量。部署只需要：

- 构建命令：`npm run build`
- 发布目录：`dist`
- Node.js：>= 20.19（`netlify.toml` 已指定 Netlify 使用 Node 22）
- 环境变量：无
- API Key：无

项目已包含：

- `base: './'`：构建产物使用相对资源路径，部署在根路径或子路径都能加载；
- `vercel.json`：Vercel 的 Vite 构建配置；
- `netlify.toml`：Netlify 的构建命令、发布目录和 Node 版本；
- 页面切换使用 React 状态，没有 URL 路由，因此**不需要 SPA rewrite / 404 重写**。

> 重要：部署解决的是「随时随地打开网站」，不是「多设备同步数据」。
> 词库保存在浏览器 localStorage 里，电脑、手机、localhost、线上域名各自拥有独立数据。
> 换到新域名或新设备后，词库默认是空的，需要重新录入或使用批量导入。

---

## 第 0 步：先在本机构建一次

打开终端（Windows PowerShell / macOS Terminal）：

```bash
cd C:\Users\lhm54\Documents\deepseek-harness\default-workspace\vocab-drill
npm install
npm run build
```

构建成功后项目里会出现：

```text
vocab-drill/
└─ dist/
   ├─ index.html
   └─ assets/
```

`dist` 就是最终要部署的网站。不要上传整个项目源码目录去当静态网站（否则访问到的是源码，而不是编译后的页面）。

---

## 方案一：Netlify Drop 拖拽部署（最简单，无需 GitHub）

适合：只想要一个免费网址，马上能在手机上打开。

1. 本机执行 `npm run build`，确认已生成 `dist` 文件夹。
2. 电脑浏览器打开 Netlify Drop：<https://app.netlify.com/drop>
3. 把 **`dist` 文件夹本身**拖进页面中央的上传区域。
   - ✅ 拖 `dist`
   - ❌ 不要拖 `index.html`
   - ❌ 不要拖 `vocab-drill` 项目根目录
4. 等待几秒，页面会显示部署完成的网址，通常是：

   ```text
   https://随机名字.netlify.app
   ```

5. 用手机浏览器打开这个网址，检查首页、添加词、刷新后数据是否还在。
6. **建议立刻注册 / 登录 Netlify，并认领（claim）这个站点。**
   - 未登录/未认领的拖拽站点通常不适合作为长期网址；
   - 登录后在站点设置中可以重命名，例如把随机名字改成 `my-vocab`，得到：

   ```text
   https://my-vocab.netlify.app
   ```

7. 以后修改了代码怎么办？
   - 重新执行 `npm run build`；
   - 回到 Netlify 对应站点，把新的 `dist` 文件夹重新拖拽上去；
   - 拖拽部署是「手动覆盖」方式，不会自动跟随 Git 更新。

### Netlify Drop 检查清单

- 打开后是「拾词」界面，不是文件列表；
- 控制台无红色报错；
- 刷新页面后仍是同一个网站；
- 手机上能正常输入和答题。

---

## 方案二：Vercel Drop 拖拽部署（无需 GitHub）

Vercel 也提供拖拽部署入口：<https://vercel.com/drop>

1. 本机执行 `npm run build`。
2. 打开 <https://vercel.com/drop>。
3. 按页面提示拖入 **`dist` 文件夹**。
4. 如果页面要求登录，用 GitHub / Google / 邮箱注册一个免费 Hobby 账号即可。
5. 部署完成后会得到类似下面的网址：

   ```text
   https://随机项目名.vercel.app
   ```

6. 在项目设置中可以重命名项目、绑定自定义域名。
7. 更新网站：修改代码 → `npm run build` → 重新拖拽新的 `dist`。

> Vercel Drop 适合快速发布；如果你希望以后每次 push 代码都自动部署，请使用下面的方案三。
> `vercel.json` 只对 Git / Vercel CLI 这种「平台负责构建」的方式生效；拖拽 `dist` 时部署的是已经构建好的静态文件，不需要它再构建一遍。

---

## 方案三：GitHub → Vercel 自动部署（长期使用最推荐）

适合：以后会持续修改代码，希望 push 后自动上线。

### 3.1 把项目推到 GitHub

先在 GitHub 网页创建一个**空仓库**，例如 `vocab-drill`。创建时不要勾选自动生成 README、.gitignore 或 License，避免和本地冲突。

然后在本机执行：

```bash
cd C:\Users\lhm54\Documents\deepseek-harness\default-workspace\vocab-drill

git init
git add .
git commit -m "feat: initial vocab-drill"

git branch -M main
git remote add origin https://github.com/你的GitHub用户名/vocab-drill.git
git push -u origin main
```

说明：

- `.gitignore` 已排除 `node_modules/` 和 `dist/`，不会把依赖和构建产物提交上去；
- 如果 `git` 提示未安装，请先安装 Git for Windows；
- 如果 GitHub 让你登录，按浏览器提示授权即可。

### 3.2 在 Vercel 导入仓库

1. 打开 <https://vercel.com/new>；
2. 使用 GitHub 登录并授权 Vercel 访问仓库；
3. 在仓库列表中选择 `vocab-drill`，点击 **Import**；
4. 配置项目：
   - **Framework Preset**：选择 `Vite`（通常会自动识别）；
   - **Root Directory**：
     - 如果 GitHub 仓库根目录就是本项目（根目录能看到 `package.json`），保持 `./`；
     - 如果仓库根目录下还有一层 `vocab-drill/`，把它填成 `vocab-drill`；
   - **Build Command**：`npm run build`（`vercel.json` 已配置）；
   - **Output Directory**：`dist`（`vercel.json` 已配置）；
   - **Environment Variables**：不填；
5. 点击 **Deploy**；
6. 部署完成后得到 `https://项目名.vercel.app`，手机可以直接访问。

### 3.3 以后更新

```bash
git add .
git commit -m "update words feature"
git push
```

Vercel 会自动检测 push、重新构建并上线。无需手动上传。

---

## 方案四：GitHub → Netlify 自动部署

适合：你更喜欢 Netlify，或已经在使用 Netlify。

1. 按「方案三 3.1」把项目推到 GitHub。
2. 打开 Netlify 的站点列表：<https://app.netlify.com/start>
3. 选择 **Import an existing project** → **GitHub** → 选择 `vocab-drill` 仓库。
4. 填写构建配置：
   - **Base directory**：
     - 仓库根目录就是项目：留空；
     - 项目在子目录：填 `vocab-drill`；
   - **Build command**：`npm run build`
   - **Publish directory**：`dist`
   - `netlify.toml` 已经提供了这些值，正常情况下会自动填充；
5. 点击 **Deploy**。
6. 以后向 GitHub push 代码，Netlify 会自动重新构建。

---

## 方案五：Vercel CLI（不用 GitHub 的自动部署方式）

如果你只是想从本机命令上线，并希望以后一条命令更新：

```bash
cd C:\Users\lhm54\Documents\deepseek-harness\default-workspace\vocab-drill

# 第一次会打开浏览器登录
npx vercel login

# 部署一个预览地址
npx vercel

# 部署到正式环境
npx vercel --prod
```

首次执行时：

- 项目名可以直接回车使用默认值；
- Framework Preset 选择 Vite；
- 构建命令与输出目录按默认即可，`vercel.json` 也会提供；
- 不要覆盖 Build Command / Output Directory。

之后修改完代码，重新执行 `npx vercel --prod` 即可更新。

---

## 部署后的验证清单

在手机上按顺序检查：

1. 打开线上网址，页面样式正常，没有白屏；
2. 添加 2～3 个词；
3. 刷新页面，词还在；
4. 设置抽 2 个，完整答一轮；
5. 查看统计和错题本；
6. 用电脑浏览器打开同一个线上网址，确认可以正常打开（数据不会与手机同步，这是预期行为）；
7. 用手机「添加到主屏幕」可以当作 Web App 快捷方式使用（不是 PWA 安装，但打开更方便）。

---

## 常见问题

### 1. 部署后打开是文件目录 / 显示源码？

拖错了目录。请拖 `dist`，而不是项目根目录或 `index.html`。

### 2. Vercel / Netlify 显示 “No package.json found”？

仓库根目录不是项目根目录。请在项目设置中把 **Root Directory / Base directory** 设为 `vocab-drill`，或者把项目本身放到仓库根目录后重新部署。

### 3. 页面能打开，但资源 404 / 白屏？

本项目已经配置 `base: './'`，正常不会出现。若出现，请确认：

- 构建产物确实是 `dist/`；
- 没有把 `dist` 里的 `assets` 文件夹漏传；
- 没有手动改过 `vite.config.ts` 的 `base`。

### 4. 手机上数据是空的，电脑上的数据也不见了？

不是 bug。`localStorage` 按「浏览器 + 域名」隔离：

- 手机和电脑不共享；
- `localhost` 和线上域名不共享；
- Netlify 和 Vercel 的域名之间也不共享。

当前纯前端方案不支持云同步。若需要多设备共用词库，需要加入后端/云数据库或第三方同步服务（会改变“无需登录、无 API Key”的设定），可以在后续版本中单独实现。

### 5. 如何把旧词迁移到新站点？

当前导入格式是「每行 `英文,中文`」的文本，不支持直接导入 JSON 备份。可以：

1. 从旧站点导出一份 JSON / CSV 作为备份；
2. 打开 JSON，把词条的 `en` 和 `zh` 拼成如下格式，粘贴到新站点的「批量导入」：

   ```text
   apple,苹果
   resilient,有韧性的；能迅速恢复的
   ```

3. 学习数据（正确次数、错题记录）不会随文本导入迁移，只会导入词条本身。

### 6. 想绑定自己的域名？

- Vercel：项目 → Settings → Domains → 添加域名，按提示配置 DNS；
- Netlify：Site configuration → Domain management → Add a domain，按提示配置 DNS；
- DNS 生效可能需要几分钟到几小时，HTTPS 证书通常由平台自动签发。

### 7. 免费额度够用吗？

这个项目是纯静态站点，没有函数、数据库和图片处理，只消耗静态托管流量和构建次数，个人使用通常远低于免费额度。具体配额以平台当前价格页为准。

---

## 官方入口

- Netlify Drop：<https://app.netlify.com/drop>
- Netlify 官方部署文档：<https://docs.netlify.com/deploy/create-deploys/>
- Netlify Drop 快速开始：<https://docs.netlify.com/start/quickstarts/netlify-drop-quickstart/>
- Vercel Drop：<https://vercel.com/drop>
- Vercel Drop 官方文档：<https://vercel.com/docs/drop>
- Vercel 新建项目：<https://vercel.com/new>
- Vite 静态部署说明：<https://vite.dev/guide/static-deploy>
