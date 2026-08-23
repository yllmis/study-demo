// ============================================
// 工具执行层通用工具
// ============================================
//
// 三个核心能力：
// 1. 缓存去重 — 相同工具+相同参数直接返回缓存
// 2. 真正重试 — 区分可重试/不可重试错误，实际执行重试
// 3. 调用限制 — 每个工具最多调用 N 次

// ============================================
// 1. 缓存去重
// ============================================

function stableStringify(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj)
  }
  const sorted = Object.keys(obj as Record<string, unknown>)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = (obj as Record<string, unknown>)[key]
        return acc
      },
      {} as Record<string, unknown>,
    )
  return JSON.stringify(sorted)
}

export function createCacheKey(toolName: string, params: unknown): string {
  return `${toolName}:${stableStringify(params)}`
}

export function getFromCache<T>(cache: Map<string, T>, key: string): T | undefined {
  return cache.get(key)
}

export function setCache<T>(cache: Map<string, T>, key: string, value: T): void {
  cache.set(key, value)
}

// ============================================
// 2. 错误分类
// ============================================

export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase()

  // 网络超时
  if (message.includes('timeout') || message.includes('超时')) {
    return true
  }

  // 临时 5xx
  if (message.includes('500') || message.includes('502') || message.includes('503')) {
    return true
  }

  // 临时限流
  if (message.includes('429') || message.includes('rate limit') || message.includes('限流')) {
    return true
  }

  // 其他错误不可重试
  return false
}

// ============================================
// 3. 带重试的执行器
// ============================================

export interface RetryConfig {
  maxRetries: number
  delayMs: number
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
}

export interface ExecuteResult {
  result: unknown
  retries: number
  error?: string
}

export async function executeWithRetry(
  fn: () => Promise<unknown>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
): Promise<ExecuteResult> {
  let lastError: Error | null = null
  let retries = 0

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await fn()
      return { result, retries }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // 不可重试的错误，立即返回
      if (!isRetryableError(lastError)) {
        return {
          result: { error: lastError.message },
          retries: 0,
          error: lastError.message,
        }
      }

      // 可重试，但已用完重试次数
      retries = attempt + 1
      if (attempt < config.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, config.delayMs))
      }
    }
  }

  // 所有重试都失败
  return {
    result: { error: lastError?.message || '执行失败' },
    retries,
    error: lastError?.message || '执行失败',
  }
}

// ============================================
// 4. 调用次数限制
// ============================================

export class ToolCallLimiter {
  private counts = new Map<string, number>()
  private limit: number

  constructor(limit: number) {
    this.limit = limit
  }

  canCall(toolName: string): boolean {
    const count = this.counts.get(toolName) || 0
    return count < this.limit
  }

  increment(toolName: string): void {
    const count = this.counts.get(toolName) || 0
    this.counts.set(toolName, count + 1)
  }

  getCount(toolName: string): number {
    return this.counts.get(toolName) || 0
  }

  getCounts(): Record<string, number> {
    return Object.fromEntries(this.counts)
  }
}
