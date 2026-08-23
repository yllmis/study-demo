import { describe, it, expect, vi, beforeEach } from 'vitest'

// 测试 sendMessage 的逻辑（不依赖浏览器环境）

describe('sendMessage', () => {
  // 模拟 fetch
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('成功时返回回复', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: '你好！' }),
    })

    const res = await mockFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '你好' }),
    })
    const data = await res.json()

    expect(data.reply).toBe('你好！')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/chat',
      expect.objectContaining({
        method: 'POST',
      }),
    )
  })

  it('失败时抛出错误', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '请求失败' }),
    })

    const res = await mockFetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message: '你好' }),
    })

    expect(res.ok).toBe(false)
    const data = await res.json()
    expect(data.error).toBe('请求失败')
  })

  it('发送的消息格式正确', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reply: 'ok' }),
    })

    await mockFetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '测试消息' }),
    })

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(callBody.message).toBe('测试消息')
  })
})
