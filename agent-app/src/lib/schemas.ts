// ============================================
// Task Schema — 定义模型输出的 JSON 结构
// ============================================
//
// Zod 的作用：
// 1. 定义数据结构（类似 TypeScript 的 type）
// 2. 运行时校验（TypeScript 只在编译时检查）
// 3. 自动推导 TypeScript 类型

import { z } from 'zod'

// 定义 Task 的 Schema
export const TaskSchema = z.object({
  title: z.string().min(1, '标题不能为空'),

  priority: z.enum(['low', 'medium', 'high'], {
    message: 'priority 必须是 low/medium/high 之一',
  }),

  // nullable()：字段必须存在，值可以是 null
  // regex()：正则校验日期格式
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是 YYYY-MM-DD')
    .nullable()
    .describe('截止日期，未知时填 null'),

  assignee: z
    .string()
    .nullable()
    .describe('负责人，未知时填 null'),

  status: z.enum(['todo', 'in_progress', 'done'], {
    message: 'status 必须是 todo/in_progress/done 之一',
  }),
}).strict()  // strict()：禁止多余字段

// 从 Schema 自动推导 TypeScript 类型
// 等价于手写 type Task = { title: string; priority: ... }
export type Task = z.infer<typeof TaskSchema>
