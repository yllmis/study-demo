// ============================================
// 练习：任务管理器数据处理层
// ============================================
//
// 需求：实现一个简单的任务管理器，包含以下功能：
//
// 1. 定义 Task 接口（id, title, status, priority, createdAt）
//    - status: "todo" | "in_progress" | "done"
//    - priority: "low" | "medium" | "high"
//
// 2. 实现 filterTasks 函数
//    - 参数：Task[] 和筛选条件（status?、priority?）
//    - 返回：符合条件的任务列表
//
// 3. 实现 sortTasks 函数
//    - 参数：Task[] 和排序字段（"createdAt" | "priority"）
//    - priority 排序：high > medium > low
//    - createdAt 按时间倒序（最新的在前）
//
// 4. 实现 async fetchTasks 函数
//    - 模拟异步读取（用 Promise + setTimeout）
//    - 返回预设的 Task[]
//    - 如果传入 invalid = true，抛出 NotFoundError
//
// 5. 自定义 NotFoundError，继承 Error
//
// 先自己写，写完看下面的测试用例，预测每个测试的输出，
// 然后运行 npm run test 验证。

// --- 从这里开始写 ---

export interface Task {
  id: number
  title: string
  status: 'todo' | 'in_progress' | 'done'
  priority: 'low' | 'medium' | 'high'
  createdAt: Date
}

type TaskFilter = {
  status?: Task['status']
  priority?: Task['priority']
}

export function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  if (filter.status) {
    tasks = tasks.filter((task) => task.status === filter.status)
  }
  if (filter.priority) {
    tasks = tasks.filter((task) => task.priority === filter.priority)
  }
  return tasks
}

export function sortTasks(tasks: Task[], sortBy: 'createdAt' | 'priority'): Task[] {
  const sortedTasks = [...tasks]

  if (sortBy === 'createdAt') {
    return sortedTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  const priorityOrder: Record<Task['priority'], number> = {
    high: 3,
    medium: 2,
    low: 1,
  }

  return sortedTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
}

export async function fetchTasks(invalid: boolean = false): Promise<Task[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (invalid) {
        reject(new NotFoundError('Tasks', 0))
      } else {
        resolve([
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
        ])
      }
    }, 1000)
  })
}

export class NotFoundError extends Error {
  constructor(resourceName: string, id: number) {
    super(`${resourceName} not found with ID ${id}`)
    this.name = 'NotFoundError'
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}
