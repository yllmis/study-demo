import { describe, it, expect } from 'vitest'
import { Task, filterTasks, sortTasks, fetchTasks, NotFoundError } from '@/lib/task-manager'

// 测试用的预设数据
const mockTasks: Task[] = [
  {
    id: 1,
    title: '写单元测试',
    status: 'todo',
    priority: 'high',
    createdAt: new Date('2026-07-28'),
  },
  {
    id: 2,
    title: '设计数据库',
    status: 'in_progress',
    priority: 'medium',
    createdAt: new Date('2026-07-27'),
  },
  {
    id: 3,
    title: '写文档',
    status: 'done',
    priority: 'low',
    createdAt: new Date('2026-07-29'),
  },
  {
    id: 4,
    title: '代码审查',
    status: 'todo',
    priority: 'medium',
    createdAt: new Date('2026-07-26'),
  },
]

// ==============================
// 测试 1：filterTasks
// ==============================
describe('filterTasks', () => {
  // 预测：filterTasks(mockTasks, { status: "todo" }) 返回什么？
  // 返回几条数据？分别是什么？
  it('按 status 筛选', () => {
    const result = filterTasks(mockTasks, { status: 'todo' })
    expect(result).toHaveLength(2)
    expect(result[0].title).toBe(/* 填入你预测的 title */ '写单元测试')
  })

  // 预测：filterTasks(mockTasks, { priority: "medium" }) 返回什么？
  it('按 priority 筛选', () => {
    const result = filterTasks(mockTasks, { priority: 'medium' })
    expect(result).toHaveLength(/* 填入 */ 2)
  })

  // 预测：同时按 status 和 priority 筛选呢？
  it('组合筛选', () => {
    const result = filterTasks(mockTasks, { status: 'todo', priority: 'medium' })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe(/* 填入 */ '代码审查')
  })

  // 预测：不传筛选条件，返回什么？
  it('无筛选条件返回全部', () => {
    const result = filterTasks(mockTasks, {})
    expect(result).toHaveLength(/* 填入 */ 4)
  })
})

// ==============================
// 测试 2：sortTasks
// ==============================
describe('sortTasks', () => {
  // 预测：按 createdAt 排序后，第一条和最后一条分别是什么？
  it('按 createdAt 倒序', () => {
    const result = sortTasks(mockTasks, 'createdAt')
    expect(result[0].title).toBe(/* 填入：最新的应该是哪条？ */ '写文档')
    expect(result[result.length - 1].title).toBe(/* 填入：最早的应该是哪条？ */ '代码审查')
  })

  // 预测：按 priority 排序后，顺序是什么？
  // high > medium > low
  it('按 priority 排序', () => {
    const result = sortTasks(mockTasks, 'priority')
    expect(result[0].priority).toBe(/* 填入 */ 'high')
    expect(result[1].priority).toBe(/* 填入 */ 'medium')
    expect(result[2].priority).toBe(/* 填入 */ 'medium')
    expect(result[3].priority).toBe(/* 填入 */ 'low')
  })
})

// ==============================
// 测试 3：fetchTasks（异步）
// ==============================
describe('fetchTasks', () => {
  // 预测：fetchTasks() 返回的数据有几条？
  it('异步返回任务列表', async () => {
    const tasks = await fetchTasks()
    expect(tasks).toHaveLength(/* 填入 */ 3)
    expect(tasks[0].title).toBe(/* 填入 */ '写单元测试')
  })

  // 预测：fetchTasks(true) 会抛出什么错误？
  it('无效请求抛出 NotFoundError', async () => {
    await expect(fetchTasks(true)).rejects.toThrow(/* 填入什么类型？ */ NotFoundError)
  })
})

// ==============================
// 测试 4：NotFoundError
// ==============================
describe('NotFoundError', () => {
  // 预测：new NotFoundError("User", 42) 的 message 是什么？
  it('包含资源名和 ID', () => {
    const error = new NotFoundError('User', 42)
    expect(error).toBeInstanceOf(/* 填入 */ NotFoundError)
    expect(error).toBeInstanceOf(/* 填入 */ Error)
    expect(error.message).toBe(/* 填入 */ 'User not found with ID 42')
  })
})
