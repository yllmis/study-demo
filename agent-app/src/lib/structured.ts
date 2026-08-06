// ============================================
// 结构化输出调用逻辑 + 重试
// ============================================
//
// 负责：调用 API、校验结果、失败重试

import { TaskSchema, type Task } from './schemas'

interface ParseResult {
  success: boolean
  task?: Task
  error?: string
  attempts: number
}

// 调用 API 获取结构化输出
async function callAPI(input: string, errorHint?: string): Promise<unknown> {
  const res = await fetch('/api/structured', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ input, errorHint }),
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || '请求失败')
  }

  return data.task
}

// 解析 + 重试逻辑
export async function parseTask(
  input: string,
  maxRetries = 2,
): Promise<ParseResult> {
  let lastError = ''

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 1. 调用 API
      const raw = await callAPI(input, attempt > 0 ? lastError : undefined)

      // 2. Zod 校验
      const result = TaskSchema.safeParse(raw)

      if (result.success) {
        // 校验通过
        return {
          success: true,
          task: result.data,
          attempts: attempt + 1,
        }
      }

      // 校验失败，记录错误信息用于重试
      const issues = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      lastError = issues

    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误'

      // 不可重试的错误：API Key 错误、余额不足等
      if (message.includes('401') || message.includes('Unauthorized')) {
        return {
          success: false,
          error: message,
          attempts: attempt + 1,
        }
      }

      // 其他错误：记录，继续重试
      lastError = message
    }
  }

  // 所有重试都失败
  return {
    success: false,
    error: lastError,
    attempts: maxRetries + 1,
  }
}
