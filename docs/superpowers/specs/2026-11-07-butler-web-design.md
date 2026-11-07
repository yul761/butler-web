# Butler 宣传页设计

日期：2026-11-07
状态：待用户审批（builder check 后已按用户 2026-11-07 的三项决定修订：截图做法、上线分工、文案以 README 为准）
放置：建好 `butler-web` 仓库后，移到该仓库的 `docs/superpowers/specs/` 下并提交（在那之前先放在 `~/.butler/workspaces/BTL-180/butler-web-spike/`）。

## 1. 这是什么，为什么做

给 Butler（`github.com/yul761/butler`，MIT 开源的桌面应用，用来同时管理很多个 Claude Code session）做一个单页宣传网站，地址 `butler.statecore.io`。

用途有两个，同样重要：

- **个人名片。** 放到用户的 LinkedIn 和简历上。看的人多半是招聘方或面试官，从链接点进来，停留几十秒，可能再点去 GitHub 看代码。页面要让人一眼觉得「这个人做了个很厉害的东西」。
- **让真有需要的人来用。** 同时开很多 Claude Code 的开发者看完要能下载、装上、用起来。

语气是**个人开源项目主页**：坦诚、具体，讲清楚它解决什么麻烦、怎么用，最后是「去 GitHub 下载」。不是商业产品的营销页。

参考：用户给 Remi 做过的同类页面 `/Users/yuchenlin/Code/StateCore-App/remi-web`（线上 `https://remi.statecore.io`）。部署方式和工程形态照它来，视觉风格**不照它**（见第 4 节）。

## 2. 核心信息

整页只讲两件事，其他内容都是佐证：

1. **同时管很多个。** 一个 epic 下面可以有十来个 Claude Code session 同时在跑，你不用挨个盯。
2. **知识互通。** session 之间共用分层的本地记忆：后端 session 记下的接口改动，前端 session 读得到；epic 层会把每个 feature 的进展带给下一个 feature；总控能随时看到每个 session 在做什么。

**措辞的分寸（硬性要求）：** 互通靠的是「记下（remember）→ 读到（recall）」，不是 session 之间实时对话。Butler 也明确不让 session 互相往终端里打字。页面上不能写成「实时协作」「彼此对话」之类，懂行的人一看就会觉得夸大。

**用户的真实用法（页面按这个讲，不能讲错）：**
- ticket 早就在 Jira 里了，是产品写的。Butler **不拆 ticket**，也**不直接连 Jira**：读 Jira 的是用户自己的 Claude Code，通过它自己的 Jira MCP。
- 用户在 epic session 里跟 Claude 一起，把这些现成的 ticket 归成几个 feature，理清先后和前后端的配合。
- 理清之后，用户点进某个 feature、打开它的总控；总控用 `create_ticket` 建好 Butler ticket，再给每个 ticket 开 session 去干活。Butler 不会替你自动打开总控。
- 用户在「现在」页处理「需要你」的事；每晚的交接和共享记忆让上下文一直接得上。

## 3. 目标、非目标、反目标

**目标**
- 首屏有「哇」的感觉。用户看过会动的首屏试做后说「味道对了」，这一版就是标准。
- 招聘方 30 秒内看懂 Butler 是什么、难在哪里。
- 开发者能顺利找到下载链接，并知道 macOS 第一次打开会被拦、怎么放行。
- 中英双语，跟随浏览器语言，可以手动切换。

- **信息要给够（用户已定，优先于紧凑）**：不追求一屏看完或页面短。看完整页的人要能弄清 Butler 做什么、怎么用、记忆怎么分层、数据怎么走、怎么装。宁可多一节、多几句说明，也不要为了简洁把关键信息砍掉或只留链接。

**非目标**
- 不做文档站。详细用法链接到 GitHub README。
- 不做博客、更新日志、注册、统计埋点、评论。
- 不自动拉取 GitHub 的版本号或 star 数（不加任何运行时网络请求）。

**反目标（做到这些就算失败，哪怕页面能跑）**
- 夸大能力：写成 Butler 直连 Jira、会自动拆 ticket、session 之间实时对话。
- 营销腔：「颠覆」「10 倍效率」「立即购买」这类话。
- 截图里露出用户真实的项目名、ticket 号或公司信息。
- 演示数字没有标明是示例，让人以为是真实统计。

## 4. 已经定下来的

### 4.1 工程形态与部署（照 Remi 的做法，用户未反对）
- 单个静态 `index.html` 加一个 `assets/` 目录，**没有构建步骤**，不引入框架。允许内联 CSS 和 JS。
- 新建**公开**仓库 `butler-web`，放在 `/Users/yuchenlin/Code/StateCore-App/butler-web`（跟 `remi-web` 并排），远端 `github.com/yul761/butler-web`。由建造者创建并 push。
- 部署在用户**个人** Vercel 账号下，由建造者创建项目并部署到 production、绑定域名 `butler.statecore.io`。
- Namecheap 上给 `statecore.io` 加 `butler` 的 CNAME **由用户自己做**（建造者没有权限）。计划的最后一步是把要填的记录值交给用户，并在用户加好后验证域名生效。
- README 写法参照 `remi-web/README.md`：一句话说明、语言选择规则、部署方式、本地预览命令。

### 4.2 语言
- 跟 Remi 一样的规则：`?lang=en|zh` 优先，其次是访客上次手动选的（localStorage），最后看浏览器语言（`zh*` 用中文，其他用英文）。首次绘制前就定好语言，避免闪烁。
- 每一句文案都有中英两版，用 `.zh` / `.en` 类切换显示。`<title>` 和 `<html lang>` 跟着切换。

### 4.3 视觉风格
- 深色背景，Butler 品牌蓝 `#2f6fdf`（亮一点的蓝 `#6b9cf0`），绿色表示「读到 / 正常」，琥珀色表示「需要你」。全页统一这套配色，不跟 Remi 的暖色调。
- Logo 用 Butler 应用图标（`/Users/yuchenlin/Code/Butler/build-resources/icon.png`）。试做里用 SVG 重画了一个，正式版可以直接用原图导出的 favicon、apple-touch-icon 和 og 图。

### 4.4 页面结构（从上到下，用户已认可）

**0. 顶栏**：logo + 「Butler」，右边是 GitHub 链接和 EN / 中文 切换。

**1. 首屏（会动，已定）**
- 以试做 `~/.butler/workspaces/BTL-180/butler-web-spike/hero-spike.html` 为准，效果照搬，代码可以重写。
- 标题：「一群 Claude Code 同时开工，谁做了什么，大家都知道。」/「Many Claude Code sessions. One shared memory.」
- 副标题、两个按钮（下载、在 GitHub 上看源码）照试做。
- 一行小字要以 README 为准，**不能**写「数据只存在你自己的电脑上」：README 写明数据会经由你自己的 `claude` 发出，开到最高隐私级别时个人 API 也会收到原文片段和真实 ticket 号。改成「MIT 开源 · 记忆和状态存在本机 · 用你自己登录的 claude」一类准确的说法，最终措辞由建造者定，但必须能在 README 里找到依据。
- 动画：
  - 左右各 4 个终端在滚动 Claude Code 风格的输出，右上角的状态标签随内容变化（写代码 / 读代码 / 跑测试 / 等 CI / 思考中 / 需要你）。
  - 中间是「共享记忆」卡片。
  - 约每 6 秒一次「写 → 读」：源终端打出 `remember("…")` 并亮蓝框，光点沿连线飞进记忆卡；卡片上新增一条；绿色光点飞向目标终端，目标终端打出 `recall → …` 并照着改代码。
  - 约每 15 秒，有一个终端亮琥珀框提问，记忆卡上方弹出「⚑ 需要你 · 1」，几秒后显示已确认。
- **不压缩首屏高度（用户已定）**：不追求笔记本一屏看完，首屏按试做的高度来。
- **已修，正式版要保留**：终端列宽固定（`minmax(0, 1fr)` 加 `min-width: 0`），长输出用省略号截断，不能把布局撑宽。
- 窄屏（≤980px）：记忆卡在上，只显示 4 个终端，隐藏连线。≤560px 时单列。
- `prefers-reduced-motion` 下不播放动画，显示一帧静止画面。
- 动画里的 ticket 号、项目名、记忆内容全是虚构的（「结账改版」「CART-12」之类）。

**2. 实际用法：从 Jira 到一组干活的 session**
- 一张横向流程图加三四步短文案：
  1. Jira 里已有的 ticket
  2. 在 epic session 里理成几个 feature
  3. 点进 feature、打开总控，总控建好 ticket 并给每个 ticket 开 session（不写成「一句话开工」，Butler 不会替你自动开总控）
  4. 你只处理「需要你」
- 必须写明：Jira 是你自己的 Claude Code 通过 Jira MCP 读的，Butler 本身不连 Jira（Linear、GitLab 同理）。

**3. 三层记忆：「互通」是怎么做到的**
- 一张分层图：
  - epic 记忆：规划、各 feature 的进展；
  - feature 记忆：前后端约定、谁负责什么；
  - ticket 记忆：各自的进度和决定；
  - 另外还有一份跨 ticket 共享的 workspace 经验。
- 讲清楚下层的 session 读得到上层，比如新 feature 的总控开工时会拿到同一个 epic 里其他 feature 的进展。
- 再补一句：总控能随时查看每个 session 当前在做什么（`list_sessions` / `session_activity`）。
- 可以把首屏的「后端改接口 → 前端读到」作为具体例子再讲一遍，用静态的两栏终端。

**4. 「现在」页 / 需要你**
- 一张 Butler 真实界面的截图：「现在」页，「需要你」置顶，按 epic / feature / ticket 分组，每行显示正在做什么、PR 和 CI 状态、持续时长。
- 截图用**虚构的演示数据**截（见 4.5），不能出现用户的真实项目。截图旁标注「演示数据」/「Demo data」。

**5. Token 用量**
- 照 Butler「现在」页底部的用量区做一张卡片，展开状态，配上醒目的大数字。
- 字段必须跟 Butler 实际提供的一致：
  - 近 7 天 token 总数、缓存读取占比、上下文超过 20 万的轮次占比；
  - 按类型：ticket session / 总控 / 子 agent / 后台任务；
  - 按模型：按价格折算的占比。
- 文案来源：`Butler/src/renderer/src/strings.ts:306` 和 `strings-en.ts:302`。
- README 目前没提这个功能。按第 5 节「以 README 为准」，要在 Butler 仓库给 README 补一句用量统计的说明（单独一个小 PR），宣传页才写这一块。
- **用演示数字**（用户已定），卡片上要标明「示例数据」/「Sample data」。数字要合理，比如 7 天几亿 token、缓存读取占九成左右。具体数值由建造者定。

**6. 本地优先 / 开源**
- 四五个短点，内容都来自 README，不能多写：
  - 数据在本机 SQLite；
  - 没有 Butler 账号，不需要 Jira 或 GitHub 登录；
  - Butler 唯一的联网代码是可选的个人 LLM API 隐私网关，有 lint 规则把关；
  - 除了你点「安装 hook」那一次，不改你的 Claude Code 配置；
  - MIT 开源。

**7. 安装**
- 下载按钮指向 `https://github.com/yul761/butler/releases/latest`，不在页面上写死版本号。
- 列出发布物的种类：macOS Apple silicon 的 `.dmg` / `.zip`，Windows x64 的 `Setup .exe`。
- 系统要求：macOS Apple silicon 或 Windows 10/11 x64；装好并登录了 Claude Code；`PATH` 里有 Git。
- 首次打开的放行说明：
  - macOS：没有做 Apple 公证，要在「隐私与安全性」里点「仍要打开」，或者在终端执行 `xattr -dr com.apple.quarantine /Applications/Butler.app`；
  - Windows：SmartScreen 弹窗时点「更多信息 → 仍要运行」。
- 详细说明链接到 README。

**8. 结尾**：一句收尾的话，加上下载和 GitHub 两个按钮，然后是页脚。

### 4.5 截图怎么做（用户已定：真界面 + 喂假数据）
- 「现在」页的行是实时算出来的（session 的 transcript、输出和子进程，真正在等的提问，`gh` 读到的 PR），只往 SQLite 里放假数据，截出来会是「已停下」「PR 状态不可用」。所以**不**走「只放 SQLite 假数据」这条路，也不跑 fake-claude 或真 session。
- 做法：用隔离环境启动真的 Butler 界面，在 IPC 这一层喂一份虚构的 `NowView` 数据（stub 掉主进程返回「现在」页数据的那个 handler），再截图。界面是真的，状态是摆出来的，所以页面上标注「演示数据」。
- 隔离环境：设 `BUTLER_HOME`（会顺带换 Electron 的用户目录，避免单实例锁冲突），需要时也设 `CLAUDE_CONFIG_DIR`。用 `BUTLER_LANG` 分别截中文和英文界面。
- stub 只为截图临时加，不进 Butler 仓库的主干（或只作为默认关闭的开发开关，二选一由建造者定，倾向前者）。
- 虚构数据：一个 epic、两三个 feature、八九个 ticket，名字和首屏动画保持一致（结账改版、CART-12……）。
- 截图导出成 webp 放进 `assets/`，中英各一张，跟着页面语言切换。

## 5. 约束
- 纯静态页，不能有运行时第三方请求（不用 CDN 字体、统计、GitHub API），图片全部放在本地 `assets/`。
- 页面内容不能和 README 冲突。凡是写到功能，都要能在 README 里找到依据（用户已确认 README 优先）。README 缺的就先补 README（如 token 用量），说法比 README 强的就改弱（如首屏小字、开工流程）。
- 不能出现用户真实的公司、项目、ticket 信息。
- 手机宽度可以正常看：16px 左右的左右边距，不能横向滚动。

## 6. 留给建造者决定的
- 第 2、3、5、6 节的具体排版、图表画法和动效（有就行，但要克制，主角是首屏）。
- 演示数据的具体内容和用量数字。
- 文案的最终措辞。不能违背第 2 节的分寸和第 3 节的反目标；中文要像正常人说话。
- og 图（社交分享预览图）的样式。
