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
