# DSH Plugin Hub · DeepSeek Harness 插件聚合系统

一个放在 `D:\DSH-PluginHub\` 的**零依赖**插件聚合系统：自动抓取最新的
[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)（`dsh`）插件目录，
计算 **TOP 榜单**，并给每个插件提供**可直接加载**的 `dsh plugin add` 直装命令与 GitHub 链接。

> DeepSeek Harness = 一切都以插件（plugin）组织 —— 模型、工具、沙箱、会话存储、UI、甚至 agent 循环本身都是插件。
> 官方插件目录由 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) 维护（约 2000+ 插件，自动更新）。

---

## 快速开始（Windows）

| 想做什么 | 操作 |
| --- | --- |
| 拉取最新插件 + 刷新榜单看板 | 双击 `update.bat`（或命令行运行 `node lib\update.mjs`） |
| 在浏览器里打开看板 | 双击 `serve.bat`（自动开 `http://127.0.0.1:4545`），或直接双击 `index.html` |
| 拿到机读榜单数据 | 看 `data\top.json` / `data\catalog.json` |

`index.html` 是**自包含**的（数据内嵌），断网也能双击打开；需要在线最新数据时运行一次 `update.bat`。

---

## 直接加载 link 是什么

每张插件卡片的复制按钮即「直接加载链接」，例如：

```sh
# 已发布到 npm 的插件
dsh plugin --profile web add dshmarket

# 仅 GitHub 发布（走 git 源）
dsh plugin --profile web add github:owner/repo

# 子目录（monorepo）插件
dsh plugin --profile web add github:owner/repo#path:/packages/sub
```

命令已由官方目录预置在 `catalog.json` 的 `install` 字段里；缺省时会自动按 `npm` → `github:` 回退生成。
复制后回到 DeepSeek Harness 的终端粘贴执行即可完成加载。

---

## 榜单口径

| 榜单 | 说明 |
| --- | --- |
| 🔥 热门 | 综合热度分 = `2·log10(1+30日下载) + log10(1+星标)` |
| ⬇ 下载 | 30 日 npm 下载量（最能反映单个插件真实使用量） |
| ⭐ 星标 | GitHub 仓库 star（monorepo 为整个仓库的 star） |
| 🆕 新晋 | 最近 7 天新上榜，按热度排序 |

看板顶部另有搜索框 + 分类筛选，可对全部插件自由检索。

---

## 目录结构

```
D:\DSH-PluginHub\
├─ index.html           # 生成的自包含聚合看板（数据内嵌）
├─ serve.mjs            # 零依赖静态服务器（node serve.mjs [端口]）
├─ serve.bat / update.bat
├─ site\
│  └─ template.html     # 看板模板（build 时注入数据）
├─ lib\
│  ├─ fetch.mjs         # 抓取官方 plugins.json（npm tarball 备用 + 本地缓存兜底）
│  ├─ rank.mjs          # 排名算法（热门/下载/星标/新晋）
│  ├─ build.mjs         # 生成 data/top.json 与 index.html
│  └─ update.mjs        # 一键编排：抓取 → 建榜 → 出看板
└─ data\
   ├─ catalog.json      # 最新官方目录快照（2171 插件，含 install 命令）
   ├─ top.json          # 四张 TOP100 榜单（机读）
   └─ meta.json         # 抓取来源/时间元信息
```

---

## 数据源与更新

- **首选**：`https://awesome-dsh-plugin.com/plugins.json`（官方自动生成，每日刷新）。
- **备用**：npm 包 `dsh-plugin-catalog`（走 npm registry/镜像，适合国内网络）。
- **兜底**：本地 `data/catalog.json` 缓存（离线也能打开看板）。

抓取/构建均只使用 **Node.js 内置模块**（`fetch`、`fs`、`http`、`tar`），无需 `npm install`。

---

## 环境要求

- Node.js ≥ 18（本机已装 `node` 即可；`update.bat` 直接调用）。
- 备用源解包用系统 `tar`（Windows 10 1809+ 自带）。

---

## 安全提示

插件会以你的权限在本机运行**第三方代码**，可读取文件、使用凭证、联网。
榜单收录 ≠ 安全审查；安装前请先点击卡片上的 **GitHub ↗** 审阅源码。