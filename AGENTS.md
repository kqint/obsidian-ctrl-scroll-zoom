本文件为项目开发规范，适用于 AI 助手及贡献者。**专用部分仅当当前开发项目类型匹配时生效，否则请忽略。**修改完代码更新项目理解。

---

## 通用规范（所有项目必须遵守）

### 1. README 规范

- **禁止使用 emoji**：所有 README 文件（包括中英文版本）不得包含任何 emoji 字符。
- **多语言支持**：必须提供英文版并命名为`README.md` ，中文版并命名为 `README.zh-CN.md`。
- **模板要求**：`.ai/README_TEMPLATE.md`（如未提供，则保持清晰、简洁的结构，包含项目简介、功能、安装、使用、配置、贡献等章节）。
- **内容一致性**：中英文版本内容应保持同步更新，仅语言不同。

### 2. 代码国际化（i18n）

- **用户可见文本**：代码中所有面向用户的字符串（如 UI 标签、提示信息、错误消息等）必须通过 i18n 机制加载，**禁止硬编码**。
- **语言文件目录**：`locales/`
  - 支持语言要求：必须使用`en.json`（英语）、`zh-CN.json`（简体中文）的命名。
  - 文件格式：JSON 键值对，键名采用 `kebab-case` 或 `camelCase`，建议按功能模块嵌套。
- **调用方式**：在代码中使用统一的 i18n 函数，例如 `t("key.path")`。具体实现根据项目技术栈确定（如 `i18next`、`chrome.i18n` 或自定义 loader）。

### 3. 版本管理
禁止未经允许的情况下提交或推送，必须询问

---

## 专用规范

### 条件：Obsidian 插件开发

当项目为 Obsidian 插件时，除通用规范外，还需遵守以下规则：

- **构建要求**：开发完成后，**必须**使用构建工具（如 `esbuild`、`rollup`、`webpack`）将 `locales/` 目录下的所有语言文件打包进最终的 `main.js` 中。不允许在运行时从外部加载语言文件。
- **禁止直接内联**：**严禁**在 `main.js` 中以硬编码对象（如 `BUILT_IN_LOCALES = { en: {...}, zh: {...} }`）的方式直接嵌入语言数据。必须通过构建工具从独立的 `locales/*.json` 文件读取并打包，保持语言文件的独立性和可维护性。
- **版本管理**：
  - 每次发布前，**必须**更新 `manifest.json` 中的 `version` 字段（遵循语义化版本 `major.minor.patch`），禁止带v。
  - 构建产物 `main.js` **必须**添加到 `.gitignore`，不提交至 GitHub 仓库。
  - 发布时，通过 GitHub Releases 或 CI/CD 附上构建好的 `main.js`。

- **插件清单**：`manifest.json` 必须包含 `id`、`name`、`version`、`minAppVersion` 等标准字段。

### 条件：浏览器插件开发

当项目为浏览器插件（扩展）时，除通用规范外，还需遵守以下规则：

- **Manifest 版本**：使用 Manifest V3（除非有特殊兼容性需求）。
- **国际化 API**：必须使用 Chrome 扩展原生的 `chrome.i18n` API（或 Firefox 对应的 `browser.i18n`）。
  - 语言文件位置：`_locales/<locale>/messages.json`
  - 支持的语言至少包含 `en` 和 `zh_CN`。
- **权限声明**：仅请求必要的权限，避免过度索取

## 项目理解

### 项目概述
**Obsidian Zone Scroll Zoom** 是一个 Obsidian 桌面插件，实现基于鼠标位置的智能缩放功能：
- **鼠标在编辑器区域**：滚动 + 修饰键 → 调整**编辑器字体大小**
- **鼠标在非编辑器区域**：滚动 + 修饰键 → 调整**整个 Obsidian 界面缩放**

### 技术栈
- **语言**：TypeScript
- **构建工具**：esbuild
- **包管理**：npm
- **国际化**：自定义 i18n 系统，支持 JSON 格式翻译文件

### 目录结构
```
obsidian-zone-scroll-zoom/
├── src/
│   ├── main.ts          # 插件主入口，注册事件监听器
│   ├── settings.ts      # 插件设置界面
│   ├── types.ts         # TypeScript 类型定义
│   └── i18n.ts          # 国际化实现
├── locales/
│   ├── en.json          # 英文翻译
│   └── zh-CN.json       # 简体中文翻译
├── esbuild.config.mjs   # esbuild 构建配置
├── tsconfig.json        # TypeScript 配置
├── package.json         # 依赖和脚本
├── manifest.json        # 插件清单文件
└── .gitignore          # 忽略构建产物
```

### 核心功能模块
1. **事件处理** (`src/main.ts`)
   - 监听 `wheel` 事件，检测修饰键状态
   - 根据鼠标位置区分缩放区域（编辑器 vs 界面）
   - 显示实时缩放提示（OSD）

2. **设置界面** (`src/settings.ts`)
   - 语言选择（自动/英文/中文）
   - 修饰键配置（Ctrl、Shift、Alt 及其组合）
   - 缩放精度调整
   - 当前状态显示与重置功能

3. **国际化** (`src/i18n.ts`)
   - 根据用户设置或系统语言加载对应翻译
   - 支持变量插值（如 `{value}%`）
   - 翻译键层级结构（如 `settings.title`）

4. **类型系统** (`src/types.ts`)
   - 插件设置接口 `ZoneScrollZoomSettings`
   - 修饰键类型 `ModifierKey`
   - 语言设置类型 `LanguageSetting`
   - 翻译数据结构 `TranslationData`

### 构建流程
1. **开发模式**：`npm run dev` → `esbuild` 监听文件变化，生成带 sourcemap 的 `main.js`
2. **生产构建**：`npm run build` → `esbuild` 打包 TypeScript 和 JSON 文件，生成优化后的 `main.js`
3. **语言文件打包**：`esbuild` 通过 `loader: { '.json': 'json' }` 将 `locales/*.json` 内联到 bundle 中

### 发布规范
- 版本号：遵循语义化版本，更新 `manifest.json` 的 `version` 字段
- 构建产物：`main.js` 不提交到 git，通过 GitHub Releases 分发
- 发布包：包含 `main.js` 和 `manifest.json` 的 zip 文件

### 配置说明
- **用户配置**：保存在 `data.json` 中（自动生成）
- **插件清单**：`manifest.json` 定义插件元数据
- **构建配置**：`esbuild.config.mjs` 定义打包规则
- **TypeScript 配置**：`tsconfig.json` 启用严格类型检查

### 依赖关系
- **生产依赖**：无（纯 Obsidian API 调用）
- **开发依赖**：`obsidian`（类型定义）、`esbuild`、`typescript`、`tslib`、`@types/node`、`builtin-modules`

### 注意事项
- 插件仅支持桌面版 Obsidian（依赖 `electron` 的 `webFrame` API）
- 编辑器字体缩放使用 Obsidian 内部 API `vault.getConfig/setConfig`
- 界面缩放使用 `electron.webFrame.getZoomFactor/setZoomFactor`