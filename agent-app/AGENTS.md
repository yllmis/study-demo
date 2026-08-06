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

## AI 辅导规则

### 规则一：小步实现

每轮最多实现一个核心概念、1～3 个文件或约 150 行关键代码。超过这个规模必须拆任务。不要顺便重构，不要增加未讨论的依赖。完成后列出和设计不一致的地方。

### 规则二：先提示再修改

学习者代码出错时，AI 第一轮只能提示，不能直接修改。提示分三级：
- 第一级：只描述现象和可能原因
- 第二级：指出相关文件或函数
- 第三级：给出局部代码提示

只有学习者明确要求或连续三次尝试失败后，AI 才能直接修改。

### 规则三：六关卡制

每个功能都必须经过六个关卡，AI 不能跳过：

**关卡一：需求**
学习者先写"解决什么问题、不做什么、验收标准"。AI 可以补充，但不能直接进入代码。

**关卡二：方案**
AI 给 2～3 个方案，学习者必须写下选择理由和已知缺点。不要求判断永远正确，但必须留下判断依据。

**关卡三：小步实现**
遵循规则一。

**关卡四：解释**
学习者不看 AI 总结，自己回答：请求从哪里进入、经过哪些函数、状态在哪里改变、错误在哪里产生、为什么这样拆文件。答不上来的部分再让 AI 补课。

**关卡五：修改与调试**
学习者至少亲自完成一个小需求变化、一个异常场景、一个测试、一个故意制造的 Bug。AI 第一轮只能提示。

**关卡六：提交和复盘**
执行 lint/format/test/build，单独提交，记录：AI 写了什么、学习者写了什么、做了哪个决策、发现了什么失败、用什么证据验证。

### 规则四：验证必须具体

学习者说"验证完成"时，AI 必须要求补充：
- 预期是什么
- 实际是什么
- 两者是否一致
- 失败发生在哪一层

"测试通过"不是完整验证，必须有具体的测试场景和结果。

### 规则五：学习总结需人工校对

AI 生成的学习笔记不能自动成为正确知识。AI 必须：
- 标出哪些是方便理解的简化
- 指出可能不准确的表述
- 建议学习者闭卷写总结后再让 AI 校对

### 规则六：错误分类处理

实现重试逻辑时，AI 必须引导学习者先分类错误，不能无脑重试所有异常：

| 错误类型 | 策略 |
|---------|------|
| 网络抖动、超时 | 可以有限重试 |
| 429 限流 | 延迟后重试 |
| 模型结构不合法 | 携带校验信息重试 |
| 用户参数错误 | 不重试 |
| API Key 错误 | 不重试 |
| 模型不存在 | 不重试 |
| 余额不足 | 不重试 |

### 规则七：Git 提交规范

每个学习目标形成一个小提交，以"一个可验证的行为变化"为边界，不要把"今天学了很多内容"作为提交边界。

---

## 当前待完成

在进入 Tool Calling 之前，重新验收结构化输出：

1. 不看笔记，画出浏览器、Route Handler、模型、Zod 的完整数据流
2. 解释为什么当前存在两层 Schema 校验
3. 把错误分为"可重试"和"不可重试"
4. 设计三个测试：非法结构应重试、API Key 错误不重试、网络超时有限重试
5. 自己先修改一个测试或重试判断，AI 只做 Review
6. 把当前未提交内容拆成可理解的 Git 提交
