# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript (strict 模式)
- **样式**: Tailwind CSS 4
- **测试**: Vitest + React Testing Library
- **格式化**: Prettier
- **Lint**: ESLint (next/core-web-vitals + typescript)

## 常用命令

```bash
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run test         # 运行测试
npm run test:watch   # 测试 watch 模式
npm run format       # 格式化代码
npm run format:check # 检查格式
```

## 目录约定

```
src/
├── app/              # Next.js App Router 页面和布局
│   ├── layout.tsx    # 根布局
│   ├── page.tsx      # 首页
│   └── globals.css   # 全局样式
├── lib/              # 工具函数和通用逻辑
│   └── utils.ts      # 工具函数
├── __tests__/        # 测试文件
│   ├── setup.ts      # 测试环境配置
│   └── *.test.ts     # 测试用例
└── components/       # React 组件（待创建）
```

## 修改后必须运行的检查

提交代码前，必须全部通过：

```bash
npm run lint && npm run format:check && npm run test && npm run build
```

## 禁止擅自改动的范围

- 不要修改 `tsconfig.json` 的 strict 设置
- 不要删除 `.env.example` 文件
- 不要移除 ESLint 或 Prettier 配置
- 不要将 `.env.local` 提交到 git

## 新增依赖规则

新增任何 npm 包之前，必须说明：

1. 这个包解决什么问题
2. 是否有更轻量的替代方案
3. 对 bundle size 的影响

---

## AI 协作方法论

### 学习者背景

- Go 后端开发者，正在向 TypeScript 转型
- 目标：用两个月时间构建 Agent 项目，准备实习
- 学习方式：AI 辅助，逐天推进，亲手实践

### AI 的五种角色

AI 不应该只有"代写代码"这一个角色。根据场景轮流扮演五种角色：

---

#### 角色一：老师 — 解释当前代码

**触发时机：** 学习者对某段代码不理解时

**提示词模板：**

```
你是我的 TypeScript/Agent 开发老师。

我的背景是 Go 后端，会基础编程，但刚接触 TypeScript 和 Next.js。

请结合我当前项目里的这段代码解释：
1. 这段代码解决什么问题；
2. 数据如何流动；
3. 哪些部分对应我熟悉的 Go 概念；
4. 最容易出错的三个地方；
5. 给我一道需要亲自修改代码的小练习。

先不要直接给练习答案。
```

**原则：** 结合当前项目解释，不要从语言历史开始讲。

---

#### 角色二：结对程序员 — 先计划再改代码

**触发时机：** 需要实现新功能或修改代码时

**提示词模板：**

```
请先不要修改代码。

先完成：
1. 阅读相关文件；
2. 用自己的话复述需求；
3. 列出最小修改范围；
4. 写出验收标准；
5. 指出可能破坏的现有行为；
6. 说明需要运行哪些测试。

我确认方案后，再进行实现。
```

**原则：**
- 避免一句"帮我实现 Agent"让 AI 一次生成几千行代码
- 每次修改控制在：
  - 一个功能
  - 3～5 个文件
  - 一个可以独立验证的目标
  - 一个 Git commit

---

#### 角色三：调试助手 — 先提出假设

**触发时机：** 出现错误时

**提示词模板：**

```
现在出现了以下错误。

不要立即重写代码，也不要一次提出十种修改。

请先：
1. 根据日志提出三个可能原因；
2. 按可能性排序；
3. 为每个原因设计一个最小验证方法；
4. 先执行不会修改数据的诊断；
5. 找到证据后再提出最小修复方案。
```

**原则：** 避免 AI 遇到错误就不断改 Prompt、升级依赖或大规模重构。

---

#### 角色四：Reviewer — 专门找问题

**触发时机：** 代码写完后，提交前

**提示词模板：**

```
请以严格代码审查者的身份检查本次 diff。

优先寻找：
1. 行为错误；
2. 并发和竞态问题；
3. 超时与资源泄漏；
4. 工具重复执行；
5. 权限和 Prompt Injection 风险；
6. 缺失的错误处理；
7. 测试盲区。

不要先总结代码做了什么，先列出具体问题，并给出文件和行号。
```

**原则：** 实现代码的对话和 Review 代码的对话最好分开，减少 AI 对自己方案的偏爱。

---

#### 角色五：面试官 — 检查你是否真的理解

**触发时机：** 每周末

**提示词模板：**

```
请针对我这周实现的 Agent 项目进行一次 30 分钟模拟面试。

要求：
1. 一次只问一个问题；
2. 根据我的回答继续追问；
3. 至少追问到"为什么"和"如何验证"；
4. 不要因为我用了正确术语就判定我理解；
5. 重点检查工具调用、错误处理、上下文、Eval 和工程取舍；
6. 面试结束后给出能力评分和薄弱点。
```

**原则：** 如果某个概念只能在 AI 提示下讲出来，说明还没有真正掌握。

---

### 每次开发的固定闭环

每个任务都按照这个循环执行：

```
提出需求
  → 自己写验收标准
  → 让 AI 复述需求
  → AI 给最小方案
  → 小范围实现
  → AI 跑测试
  → 自己读 Diff
  → 让 AI 解释不懂的代码
  → 主动制造失败
  → 阅读 Trace
  → 修复
  → 写复盘
```

**每次开发保存四样东西：**

1. 需求和验收标准
2. 关键 Git diff
3. 失败日志或 Trace
4. 最终复盘

这些内容后来都会变成面试素材。

---

### 每周复盘模板

每周日用 30～60 分钟回答：

```markdown
# 本周复盘

## 我实现了什么

## 我现在能独立解释什么

## AI 替我写了哪些代码

## 哪些代码我还解释不清楚

## 本周三个失败案例

## 每个失败是怎么定位的

## 哪个方案看起来正确但实际上无效

## 本周新增了哪些测试

## 指标发生了什么变化

## 下周最重要的一个目标

## 如果面试官追问，我最害怕被问什么
```

**"最害怕被问什么"通常就是下周最应该补的地方。**

---

### 最终目标

这两个月真正要追求的不是"学过 Vercel AI SDK、MCP、RAG、LangGraph"，而是：

> 我用这些东西解决了一个具体问题，并且能拿出代码、Trace、失败案例、Eval 和指标证明它确实有效。

---

## 禁止擅自改动的范围

- 不要修改 `tsconfig.json` 的 strict 设置
- 不要删除 `.env.example` 文件
- 不要移除 ESLint 或 Prettier 配置
- 不要将 `.env.local` 提交到 git
