import { describe, it, expect } from 'vitest'
import { TaskSchema } from '@/lib/schemas'

describe('TaskSchema', () => {
  // 正常情况
  it('校验通过：完整数据', () => {
    const data = {
      title: '写API文档',
      priority: 'high',
      dueDate: '2026-08-07',
      assignee: '小明',
      status: 'todo',
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  // 可选字段为 null
  it('校验通过：可选字段为 null', () => {
    const data = {
      title: '写API文档',
      priority: 'high',
      dueDate: null,
      assignee: null,
      status: 'todo',
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(true)
  })

  // 缺少必填字段
  it('校验失败：缺少 title', () => {
    const data = {
      priority: 'high',
      dueDate: null,
      assignee: null,
      status: 'todo',
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  // 非法枚举
  it('校验失败：priority 为非法值', () => {
    const data = {
      title: '写API文档',
      priority: 'urgent', // 不在 low/medium/high 里
      dueDate: null,
      assignee: null,
      status: 'todo',
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('low/medium/high')
    }
  })

  // 日期格式错误
  it('校验失败：日期格式错误', () => {
    const data = {
      title: '写API文档',
      priority: 'high',
      dueDate: '明天下午', // 不是 YYYY-MM-DD
      assignee: null,
      status: 'todo',
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('YYYY-MM-DD')
    }
  })

  // 多余字段（strict 模式）
  it('校验失败：多余字段', () => {
    const data = {
      title: '写API文档',
      priority: 'high',
      dueDate: null,
      assignee: null,
      status: 'todo',
      extra: '多余字段', // strict 模式会拒绝
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(false)
  })

  // status 非法
  it('校验失败：status 为非法值', () => {
    const data = {
      title: '写API文档',
      priority: 'high',
      dueDate: null,
      assignee: null,
      status: 'completed', // 不在 todo/in_progress/done 里
    }
    const result = TaskSchema.safeParse(data)
    expect(result.success).toBe(false)
  })
})
