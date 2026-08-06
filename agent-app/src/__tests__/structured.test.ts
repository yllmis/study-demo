import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseTask } from '@/lib/structured'

// mock 全局 fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

describe('parseTask', () => {
  // 非法结构应重试
  it('非法结构：缺少字段时重试', async () => {
    // mock：第一次返回缺少字段的 JSON，第二次返回完整 JSON
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ task: { title: '测试任务' } }), // 缺少 priority、dueDate 等
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          task: {
            title: '测试任务',
            priority: 'high',
            dueDate: null,
            assignee: null,
            status: 'todo',
          },
        }),
      })

    const result = await parseTask('测试任务')

    // 断言：成功
    expect(result.success).toBe(true)
    // 断言：请求了两次（第一次失败，第二次成功）
    expect(result.attempts).toBe(2)
  })

  // API Key 错误不重试
  it('API Key 错误：直接失败，不重试', async () => {
    // mock：fetch 返回 401
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })

    const result = await parseTask('测试任务')

    // 断言：失败
    expect(result.success).toBe(false)
    // 断言：只请求了一次（不重试）
    expect(result.attempts).toBe(1)
  })

  // 网络超时有限重试
  it('网络超时：重试但不超过限制', async () => {
    // mock：始终抛出超时错误
    mockFetch.mockRejectedValue(new Error('timeout'))

    const result = await parseTask('测试任务')

    // 断言：失败
    expect(result.success).toBe(false)
    // 断言：总共请求了 3 次（默认 maxRetries=2，所以 1+2=3）
    expect(result.attempts).toBe(3)
  })
})
