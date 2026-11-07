# Butler 宣传页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 做出并上线 `butler.statecore.io`：一个中英双语、纯静态的 Butler 单页宣传网站。

**Architecture:** 照 `remi-web` 的做法：单个 `index.html`（内联 CSS/JS）加 `assets/`，没有构建步骤。一个零依赖的 Node 检查脚本 `tools/check.mjs` 充当这个页面的测试，用来拦截外部资源、营销腔和夸大说法、缺失的资源文件、中英文不成对。「现在」页的截图用 Butler 自带的 Playwright e2e 沙盒启动真界面：先通过 IPC 建好演示用的 epic/feature/ticket，再在主进程里把 `now:view` 和 `usage:summary` 两个 handler 换成虚构数据，然后截图。截图脚本放在 butler-web 仓库里，运行时临时拷进 Butler 的 `e2e/`，跑完删掉，所以不会进 Butler 主干。

**Tech Stack:** HTML/CSS/原生 JS，Node 20+ (`node:test`)，Butler 仓库里的 `@playwright/test` 1.64 + Electron 44，`cwebp`，`sips`，`gh`，Vercel MCP 工具。

**Spec:** `docs/superpowers/specs/2026-11-07-butler-web-design.md`（Task 1 之前在 `~/.butler/workspaces/BTL-180/butler-web-spike/`）。执行者两份都要读。

## Global Constraints

- 纯静态：没有运行时的第三方请求，不用 CDN 字体、统计脚本、GitHub API；图片都在本地 `assets/`。
- 每一句文案都要有中英两版，用 `.zh` / `.en` 类切换；`<title>` 和 `<html lang>` 也跟着切换。
- 语言的决定顺序：先看 `?lang=en|zh`，再看 localStorage 里 `butler-lang` 这个键，最后看浏览器语言（`zh*` 用中文，其他用英文）。在首次绘制之前定好。
- 配色：品牌蓝 `#2f6fdf`，亮蓝 `#6b9cf0`，绿色表示「读到 / 正常」，琥珀色表示「需要你」，深色背景。
- 措辞：互通只能写成「记下（remember）→ 读到（recall）」。禁止写「实时协作」「彼此对话」「自动拆 ticket」「直连 Jira」「一句话开工」「数据只存在你自己的电脑上」，以及营销腔（「颠覆」「10 倍」「立即购买」）。
- 功能描述必须能在 Butler README 里找到依据。README 里没有的先补 README，比 README 说得重的要改轻。
- 不能出现用户真实的公司、项目或 ticket。演示用的名字统一为「结账改版 / Checkout revamp」、`CART-12` 这一套。
- 演示数字要标「示例数据 / Sample data」，演示截图要标「演示数据 / Demo data」。
- 下载链接固定为 `https://github.com/yul761/butler/releases/latest`，页面上不写死版本号。
- 首屏不压缩高度。信息要给够，这一条优先于页面紧凑。
- 手机宽度下左右各约 16px 边距，不能横向滚动。`prefers-reduced-motion` 时首屏只显示一帧静止画面。

## Review Focus

1. **英文访客第一次打开时会闪一下中文。** 语言要在 `<head>` 里的同步脚本中定好，CSS 默认把两种语言都隐藏，直到 `html` 上有了 `is-zh` 或 `is-en`。测试放在 Task 2。
2. **窄屏（375px）横向滚动。** 首屏终端里的长行、流程图、截图都可能把页面撑宽。每个改版面的任务都要跑一遍 `scrollWidth <= innerWidth` 的检查（脚本见 Task 2 第 5 步）。
3. **localStorage 不可用**（隐私模式、被禁用）时，页面不能报错，也不能停在没有语言的状态。所有读写都要包在 try/catch 里。测试放在 Task 2。
4. **截图里混进真实数据。** 沙盒外的 Butler 数据目录绝不能被读到，截完后要人工核对图里没有真实名字。Task 5 有专门的一步。
5. **动画在后台标签页积压。** 切回标签页时，几十个光点和终端行不能一下子涌出来。动画用 rAF 的时间差驱动，`dt` 上限 100ms，`visibilitychange` 时暂停排期。测试放在 Task 3。

---

## File Structure

```
/Users/yuchenlin/Code/StateCore-App/butler-web/
  index.html                 整页：head 里的语言脚本、内联 CSS、各节 HTML、底部的动画和切换脚本
  README.md                  照 remi-web/README.md 写：一句话、语言规则、部署方式、本地预览、截图怎么重拍
  .gitignore                 .DS_Store、tools/private-terms.txt、tools/capture/out/
  assets/
    favicon.png  apple-touch-icon.png  icon-512.png  og.png
    now-zh.webp  now-en.webp           「现在」页截图
  tools/
    check.mjs                检查函数 + CLI（node tools/check.mjs，有问题时 exit 1）
    check.test.mjs           node:test 单测
    banned-terms.json        禁用说法（入库）
    private-terms.txt        用户真实的项目名或公司名，一行一个（不入库，可以没有这个文件）
    capture/
      now-capture.spec.ts    Playwright 截图 spec（在 Butler 的 e2e/ 里跑）
      demo-data.ts           虚构的 NowView / UsageSummary 构造函数
      run.sh                 拷进 Butler，跑完删掉，再转成 webp
  docs/superpowers/specs/2026-11-07-butler-web-design.md
  docs/superpowers/plans/2026-11-07-butler-web-plan.md
```

---

### Task 1: 建仓库和检查脚本

**Files:**
- Create: `index.html`（这一步只放最小骨架）、`README.md`、`.gitignore`、`assets/{favicon.png,apple-touch-icon.png,icon-512.png}`、`tools/check.mjs`、`tools/check.test.mjs`、`tools/banned-terms.json`
- Move: 设计文档和本计划移到 `docs/superpowers/{specs,plans}/`

**Interfaces:**
- Produces（`tools/check.mjs` 的具名导出，每个都返回 `string[]`，空数组表示没问题）：
  - `findExternalLoads(html: string): string[]`：凡是 `<script src>`、`<link rel=stylesheet|preload|icon href>`、`<img src>`、`<source srcset>`、CSS 里的 `url(...)`、JS 里的 `fetch(` 或 `XMLHttpRequest` 指向 `http(s)://` 或 `//` 的都报出来。`<a href>` 和 `<meta content>` 不报。
  - `findBannedPhrases(html: string, terms: string[]): string[]`：先去掉标签再做匹配，不区分大小写，报出命中的词。
  - `findMissingAssets(html: string, root: string): string[]`：凡是引用了 `assets/…` 但磁盘上没有这个文件的都报出来。
  - `findUnpairedLang(html: string): string[]`：在每个 `<section id="…">` 里（以及 `<header>`、`<footer>` 里），class 里带 `zh` 的元素个数要等于带 `en` 的个数，不相等就报出那一节的 id。
  - CLI：读入 `index.html`、`banned-terms.json`，如果有 `private-terms.txt` 也读入，打印所有问题，有问题时 exit 1。

- [ ] **Step 1:** `mkdir -p /Users/yuchenlin/Code/StateCore-App/butler-web && cd $_ && git init -b main`，再把 spec 和 plan 从 `~/.butler/workspaces/BTL-180/butler-web-spike/` 移到 `docs/superpowers/` 下，`hero-spike.html` 一起移到 `docs/superpowers/specs/hero-spike.html`（Task 3 的参照）。都用 mv，原处不留副本。
- [ ] **Step 2: 写失败的测试** `tools/check.test.mjs`：
  ```js
  test("external script is reported", () => assert.equal(findExternalLoads('<script src="https://cdn.x/a.js"></script>').length, 1));
  test("protocol-relative css url is reported", () => assert.equal(findExternalLoads('<style>a{background:url(//x.com/i.png)}</style>').length, 1));
  test("outbound <a> link is allowed", () => assert.deepEqual(findExternalLoads('<a href="https://github.com/yul761/butler">x</a>'), []));
  test("banned phrase matched in text, case-insensitive", () => assert.deepEqual(findBannedPhrases("<p>Real-Time Collaboration</p>", ["real-time collaboration"]), ["real-time collaboration"]));
  test("banned phrase inside attribute name is ignored", () => assert.deepEqual(findBannedPhrases('<p data-x="10x">ok</p>', ["10x"]), []));
  test("missing asset reported", () => assert.deepEqual(findMissingAssets('<img src="assets/nope.webp">', tmpdir), ["assets/nope.webp"]));
  test("unpaired zh in a section reported", () => assert.deepEqual(findUnpairedLang('<section id="a"><span class="zh">中</span></section>'), ["a"]));
  test("paired section passes", () => assert.deepEqual(findUnpairedLang('<section id="a"><span class="zh">中</span><span class="en">E</span></section>'), []));
  ```
- [ ] **Step 3:** 跑 `node --test tools/`，应该是 FAIL，报 `check.mjs` 不存在或导出缺失。
- [ ] **Step 4:** 实现 `tools/check.mjs`，用正则就够了，不引依赖。`banned-terms.json` 放入 Global Constraints 里禁用说法的中英两版：`实时协作` `彼此对话` `自动拆` `直连 Jira` `一句话开工` `数据只存在` `颠覆` `10 倍` `立即购买` `real-time collaboration` `talk to each other` `revolutionize` `10x` `buy now` `your data stays on your machine`。
- [ ] **Step 5:** 跑 `node --test tools/`，应该是 PASS。
- [ ] **Step 6:** 生成图标：`sips -z 32 32 …/Butler/build-resources/icon.png --out assets/favicon.png`，180 尺寸出 `apple-touch-icon.png`，512 尺寸出 `icon-512.png`。写最小骨架 `index.html`（doctype、charset、viewport、favicon 链接）；README 照 remi-web 的结构写；`.gitignore` 按上面的文件结构写。跑 `node tools/check.mjs`，应该 exit 0。
- [ ] **Step 7:** 提交：`git add -A && git commit -m "chore: scaffold butler-web with static checks"`

### Task 2: 页面骨架、语言切换、顶栏和页脚

**Files:** Modify `index.html`

**Interfaces:**
- Produces：`<head>` 里的同步脚本在 `<html>` 上加 `is-zh` 或 `is-en`，并设好 `lang`。底部脚本暴露 `setLang(lang: "zh"|"en", remember: boolean)`，后面各任务的动画也会读 `document.documentElement.classList.contains("is-zh")`。CSS 变量：`--bg --ink --muted --line --blue:#2f6fdf --blue-2:#6b9cf0 --green --amber`。各节使用固定的 id：`hero`、`flow`、`memory`、`now`、`usage`、`local`、`install`、`end`。

- [ ] **Step 1:** 照 remi-web `index.html:17-24` 和 `:264-280` 的写法实现语言选择，localStorage 的键改成 `butler-lang`，`<title>` 两版分别是「Butler — 一群 Claude Code，一份共享记忆」和「Butler — many Claude Code sessions, one shared memory」。CSS 里写 `.zh,.en{display:none}`，再写 `html.is-zh .zh{display:revert}` 和 `html.is-en .en{display:revert}`。
- [ ] **Step 2:** 顶栏：左边是 logo 加「Butler」，右边是 GitHub 链接和 EN / 中文 切换。页脚：MIT、GitHub、作者署名 Yuchen Lin。八个 section 先放空的占位，中英成对。
- [ ] **Step 3: 浏览器验证（Review Focus 1、3）**。`python3 -m http.server 8765` 起本地服务，用 chrome-devtools MCP 分别打开 `?lang=en`、`?lang=zh`，以及不带参数、模拟 `navigator.language='en-US'` 的情况。核对 `document.documentElement.className`，并在首帧截图里确认没有另一种语言的文字。再在页面加载前注入 `Object.defineProperty(window,'localStorage',{get(){throw new Error('x')}})`，重新加载，确认没有控制台报错，语言也定下来了。
- [ ] **Step 4:** 跑 `node tools/check.mjs`，应该 exit 0。
- [ ] **Step 5: 窄屏检查（Review Focus 2，后面每个改版面的任务都要重复这一步）**：把视口设成 375×812，执行 `document.documentElement.scrollWidth <= innerWidth`，结果应该是 `true`。
- [ ] **Step 6:** 提交：`feat: page shell with bilingual switch`

### Task 3: 首屏动画

**Files:** Modify `index.html`（`#hero` 这一节，以及底部的动画脚本）。参考 `docs/…/hero-spike.html`：在 Task 1 里把 spike 目录下的 `hero-spike.html` 一起移到 `docs/superpowers/specs/hero-spike.html`。

**Interfaces:**
- Consumes：Task 2 的语言类和 CSS 变量。
- Produces：动画只在 `#hero` 里运行，不往全局写任何东西。

- [ ] **Step 1:** 移植 spike 的结构和效果：左右各 4 个终端，状态标签有 写代码 / 读代码 / 跑测试 / 等 CI / 思考中 / 需要你 这几种；中间是共享记忆卡；大约每 6 秒一次 remember→recall 的光点飞行，大约每 15 秒弹一次「⚑ 需要你 · 1」。标题和副标题照 spike；两个按钮分别是下载（releases/latest）和 GitHub。
- [ ] **Step 2:** 底部小字改成「MIT 开源 · 记忆和状态存在本机 · 用你自己登录的 claude」/「MIT licensed · memory and state live on your machine · runs your own logged-in claude」。
- [ ] **Step 3:** 保留列宽修复：`grid-template-columns: minmax(0,1fr) …`，终端加 `min-width:0`，行内容加 `white-space:nowrap; overflow:hidden; text-overflow:ellipsis`。窄屏：≤980px 时记忆卡放在上面，只显示 4 个终端，隐藏连线；≤560px 时单列。
- [ ] **Step 4:** 加 `matchMedia('(prefers-reduced-motion: reduce)')` 的分支：直接渲染一帧填好内容的静止画面，不启动 rAF 和 setTimeout。
- [ ] **Step 5（Review Focus 5）:** 主循环用 rAF 的时间差驱动，`dt = Math.min(now - last, 100)`。`document.hidden` 为真时不排下一次 remember/needs-you 事件，回到前台时从当前时刻重新计时。
- [ ] **Step 6: 浏览器验证。** 在 1440×900 下截一张图，和 spike 并排对比效果。把视口改成 375，跑 Task 2 第 5 步的检查。打开 reduced-motion 模拟，确认画面是静止的（3 秒内截两张图，像素一致）。切到别的标签页 30 秒再切回来，用 `document.querySelectorAll('.spark').length` 检查，应该 ≤ 8。
- [ ] **Step 7:** 跑 `node tools/check.mjs`，exit 0。提交：`feat: animated hero`

### Task 4: 「实际用法」和「三层记忆」两节

**Files:** Modify `index.html`（`#flow`、`#memory`）

- [ ] **Step 1: `#flow`** 是一张横向的四步图，窄屏时改成竖排。文案的事实必须照下面写，措辞由建造者定：
  1. Jira 里已经有 ticket，是产品写的；
  2. 在 epic session 里，你和 Claude 把这些 ticket 理成几个 feature，epic session 用 `create_feature` 建出 feature 并写好规划；
  3. 你点进 feature、打开它的总控，总控通过 `create_ticket` 建 ticket，再用 `start_session` 给每个 ticket 开 session，Butler 不会替你打开总控；
  4. 你在「现在」页只处理「需要你」的那些。

  图下方要有一句话写明：Jira（以及 Linear、GitLab）是你自己的 Claude Code 通过它自己的 MCP 读的，Butler 本身不连任何 tracker。依据是 README 第 85-90 行。
- [ ] **Step 2: `#memory`** 是一张分层图：epic 记忆放规划和各 feature 的进展，feature 记忆（`butler-feature`）放前后端约定，ticket 记忆放进度和决定，另外有一份跨 ticket 的 workspace 经验。图后写：新 feature 的总控第一次打开时，会读到同一个 epic 里其他 feature 的进展（README 的 Epics 第 4 步）；总控可以随时用 `list_sessions` / `session_activity` 查看每个 session 在做什么。最后放一个静态的两栏终端例子：后端 `remember("POST /cart/apply-coupon 返回 { total, discount }")`，前端 `recall → …` 然后照着改代码。另写一行坦白的说明：session 之间不直接对话，靠的是记下和读到（README 的 Communication 那一条）。
- [ ] **Step 3:** 浏览器在 1440 和 375 两个宽度下各截一张图；跑窄屏检查；跑 `node tools/check.mjs`，exit 0。
- [ ] **Step 4:** 提交：`feat: flow and memory sections`

### Task 5: 「现在」页截图工具和 `#now` 这一节

**Files:**
- Create: `tools/capture/demo-data.ts`、`tools/capture/now-capture.spec.ts`、`tools/capture/run.sh`
- Create: `assets/now-zh.webp`、`assets/now-en.webp`
- Modify: `index.html`（`#now`）、`README.md`（加「重拍截图」一节）

**Interfaces:**
- Consumes（来自 Butler 仓库，spec 在 `Butler/e2e/` 下运行，所以 import 路径都相对于那里）：`./fixtures` 的 `test`、`expect`、`makeGitRepo`、`completeWizard`、`Sandbox`、`launch(s) → { app, page }`；`../src/shared/ipc` 的 `IPC`（`IPC.nowView === "now:view"`，`IPC.usageSummary === "usage:summary"`）；`../src/shared/types` 的 `NowView`、`NowRow`、`UsageSummary`；`../src/shared/activity` 的 `SessionActivity`。IPC 返回值的外层是 `{ ok: true, value }`（见 `src/main/ipc/result.ts`）。
- Produces：
  - `demoNowView(ids: { epicId: number; featureIds: number[] }, now: number): NowView`：一个 epic「结账改版 / Checkout revamp」，下面 2–3 个 feature、8–9 行。行要覆盖这些状态：至少 2 行 `needsYou`（一个提问、一个停在确认上）、`edit`/`test`/`ci`/`thinking` 各至少一行、带 open PR 且 CI 通过或进行中的行、一个 `idle` 行。`since` 设成 `now` 减去几分钟到一小时不等。ticket key 一律用 `CART-*`、`PAY-*` 这种虚构的。
  - `demoUsage(now: number): UsageSummary`：`sinceMs = now - 7d`，`totalTokens` 为几亿量级，`cacheReadShare` 约 0.9，`over200kShare` 约 0.1，`byKind` 四项和 `byModel` 都为 0..1 之间、加起来约等于 1。这些数字 Task 7 也要用。
  - `run.sh <butler-repo>`：拷贝 `now-capture.spec.ts` → `<butler>/e2e/zz-web-capture.spec.ts`，`demo-data.ts` → `<butler>/e2e/zz-web-demo-data.ts`（用 `trap` 保证退出时一定删掉）；构建产物缺的时候跑 `pnpm build && pnpm build:hook`；执行 `BUTLER_WEB_OUT=<abs out dir> pnpm exec playwright test e2e/zz-web-capture.spec.ts`；然后用 `cwebp -q 88` 把 `now-zh.png`、`now-en.png` 转成 `assets/*.webp`。

- [ ] **Step 1: 写 spec** `now-capture.spec.ts`，对 zh 和 en 各跑一个 `test`：
  1. `makeSandbox()`，设 `s.lang`；
  2. 在 `s.dir/shop` 下用 `makeGitRepo` 建 `frontend` 和 `backend`；
  3. 调 `launch(s)` 和 `completeWizard(page, s)`；
  4. 在渲染进程里用 `window.butler.invoke(...)` 走真实的创建通道，建 epic「结账改版」、两个 feature 并移进这个 epic、8 个 ticket，名字和 `demoNowView` 里的一致。具体通道名在 `src/shared/ipc.ts` 里查（`epicsCreate`、`featuresCreate`、把 feature 移进 epic 的那个通道、`ticketsCreate`），记下返回的 id；
  5. 调 `app.evaluate(({ ipcMain }, { view, usage }) => { ipcMain.removeHandler("now:view"); ipcMain.handle("now:view", () => ({ ok: true, value: view })); ipcMain.removeHandler("usage:summary"); ipcMain.handle("usage:summary", () => ({ ok: true, value: usage })); }, { view: demoNowView(ids, Date.now()), usage: demoUsage(Date.now()) })`；
  6. 把窗口设成 1440×900（`app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1440, 900))`），然后 `page.reload()`；
  7. 导航到「现在」页，等「需要你」区块出现，展开底部的用量区；
  8. 截图写到 `${process.env.BUTLER_WEB_OUT}/now-${lang}.png`。

  断言：页面上有 `S.nowNeedsYouCount(2)` 对应的文字；不出现 `S.nowPrUnavailable`。
- [ ] **Step 2:** 跑 `tools/capture/run.sh /Users/yuchenlin/Code/Butler`，应该是 2 passed，`assets/now-zh.webp` 和 `assets/now-en.webp` 都生成了。跑完 `git -C /Users/yuchenlin/Code/Butler status --porcelain` 应该没有任何输出，因为拷进去的 spec 已经删掉了。
- [ ] **Step 3（Review Focus 4）:** 打开两张图逐行核对：只能出现演示用的名字，路径里只能有沙盒目录，不能有 `/Users/yuchenlin` 或真实的仓库名。如果路径露出来，就在截图之前用 `page.addStyleTag` 把路径元素藏起来，或者裁掉。
- [ ] **Step 4:** `#now` 这一节：截图按页面语言切换（两个 `<img>`，分别带 `.zh` / `.en`，写好 `width`/`height`，加 `loading="lazy"`），右上角贴一个「演示数据 / Demo data」角标。旁边配三四句说明，依据是 README 的 Home page 一条：「需要你」置顶并说明三种原因（提问、确认、卡住），按 epic / feature / ticket 分组，每行显示在做什么、PR / CI 和持续时长，点一行就打开对应的终端。
- [ ] **Step 5:** README 加一节「重拍截图」，写上 `tools/capture/run.sh` 的用法和前置条件（Butler 仓库已经 `pnpm install`）。
- [ ] **Step 6:** 浏览器在 1440 和 375 两个宽度下验证，跑窄屏检查，跑 `node tools/check.mjs`，exit 0。
- [ ] **Step 7:** 提交：`feat: now-page screenshots from demo data`

### Task 6: Butler README 补一句 token 用量（Butler 仓库，单独一个 PR）

**Files:** Modify `/Users/yuchenlin/Code/Butler/README.md`，在 Home page 那一条（约第 75 行）的末尾补充。

- [ ] **Step 1:** 先读 `src/main/usage/usage-summary.ts`、`src/main/db/usage-repo.ts` 和采集用量的代码，弄清统计范围：哪些 session 算进来，子 agent 和后台任务（`headless`）是怎么来的。说法以代码为准。
- [ ] **Step 2:** 从 `main` 拉分支 `docs/readme-usage`。在 Home page 那一条末尾加一两句，内容是：页面底部有一行近 7 天的 token 用量，包括总数、缓存读取占比、上下文超过 20 万的轮次占比；展开后可以看按类型（ticket session、总控、子 agent、后台任务）和按模型的分布，占比按相对价格折算；只用来看占比，不换算金额。界面标签写法照 README 的惯例，中文在前、英文放括号里。
- [ ] **Step 3:** 提交时 message 末尾加 `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`；push 后执行 `gh pr create`，PR 描述末尾加 `🤖 Generated with [Claude Code](https://claude.com/claude-code)`。push 之后不要轮询 CI。

### Task 7: Token 用量、本地优先、安装、结尾，以及 og 图和 meta

**Files:** Modify `index.html`（`#usage`、`#local`、`#install`、`#end`、`<head>` 里的 meta）；Create `assets/og.png`

**Interfaces:** Consumes：Task 5 `demoUsage()` 里的数字（直接抄进 HTML，页面上和截图里显示的数字要一致）。

- [ ] **Step 1: `#usage`**：照 Butler 用量区的样子做一张展开状态的卡片，配一个醒目的大数字。字段和措辞取自 `Butler/src/renderer/src/strings.ts:306-309` 和 `strings-en.ts:302-305`：近 7 天 token 总数、缓存读取占比、上下文超过 20 万的轮次占比；按类型分 ticket session / 总控 / 子 agent / 后台任务；按模型分，按价格折算。卡片上标「示例数据 / Sample data」。这一节要等 Task 6 的 PR 合并之后才上线（见 Task 8 第 1 步）。
- [ ] **Step 2: `#local`**：六个短点，都来自 README，不能多写：
  - 数据在本机 SQLite；
  - 没有 Butler 账号，也不要 Jira / GitHub 登录；
  - 数据只经由你自己的 `claude` 离开本机；如果你配置了个人 API，在最高隐私级别下它也会收到数据，每次调用都记在审计页上；
  - 唯一的联网代码是这个隐私网关，有 lint 规则把关；
  - 除了你点「安装 hook」那一次，不改你的 Claude Code 配置；
  - MIT 开源。

  第三点要照 README 第 6 行写准确。
- [ ] **Step 3: `#install`**：下载按钮指向 releases/latest。发布物列出 macOS Apple silicon 的 `.dmg` / `.zip` 和 Windows x64 的 `Setup .exe`。系统要求：macOS Apple silicon 或 Windows 10/11 x64；装好并登录了 Claude Code；`PATH` 里有 Git。放行说明：macOS 到「隐私与安全性」里点「仍要打开」，或者执行 `xattr -dr com.apple.quarantine /Applications/Butler.app`（放在代码块里，带复制按钮）；Windows 在 SmartScreen 里点「更多信息 → 仍要运行」。最后附上 README 的 Install 和 First run 两节的链接。写之前先和 README 第 91-160 行逐条核对。
- [ ] **Step 4: `#end`**：一句收尾的话，加下载和 GitHub 两个按钮。
- [ ] **Step 5: meta 和 og 图**：`description`、`og:title`、`og:description`、`og:image=https://butler.statecore.io/assets/og.png`、`twitter:card=summary_large_image`，统一用英文。`og.png` 是 1200×630：在本地用 chrome-devtools 打开首屏，用 reduced-motion 的静止帧截图，再裁成这个尺寸。
- [ ] **Step 6: 通读一遍。** 中英文各从头读到尾，按 spec 第 3 节的反目标逐条核对。在 1440 和 375 两个宽度下截整页图，跑窄屏检查，跑 `node tools/check.mjs`，exit 0。
- [ ] **Step 7:** 提交：`feat: usage, local-first, install sections and social meta`

### Task 8: 发布

- [ ] **Step 1:** 确认 Task 6 的 PR 已经合并：`gh pr view <n> --repo yul761/butler --json state`，`state` 应该是 `MERGED`。没合并就先停在这里告诉用户，不要上线用量那一节。
- [ ] **Step 2:** `gh repo create yul761/butler-web --public --source . --push --description "Landing page for Butler"`。
- [ ] **Step 3:** 用 Vercel MCP 在用户的**个人**账号下（先用 `list_teams` 或 `get_auth_user` 确认是哪个账号）建项目，并关联 GitHub 仓库 `yul761/butler-web`：不选 framework，不设 build command，输出目录是仓库根目录，部署到 production。如果关联 GitHub 不成功，退回到让用户执行 `! npx vercel@latest login`，之后再执行 `npx vercel@latest --prod`。
- [ ] **Step 4:** `add_project_domain` 加上 `butler.statecore.io`，再用 `get_domain_config` 拿到要填的 CNAME 记录值，告诉用户去 Namecheap 加：Host 填 `butler`，Value 填刚才拿到的值。
- [ ] **Step 5:** 用户说加好之后，执行 `curl -sI https://butler.statecore.io`，应该返回 200；再用浏览器打开 `?lang=en` 和 `?lang=zh` 各看一遍。
- [ ] **Step 6:** 更新 README 里的部署说明（Vercel 项目名、DNS 记录），提交并 push。
