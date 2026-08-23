'use client'

// ============================================
// 聊天界面 — 使用 Vercel AI SDK
// ============================================
//
// useChat hook 自动处理：
// - 消息列表管理
// - 流式接收回复（逐字显示）
// - 发送/中断请求
// - 错误状态

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export default function ChatPage() {
  const [input, setInput] = useState('')

  const {
    messages, // 消息列表
    sendMessage, // 发送消息
    status, // 'submitted' | 'streaming' | 'ready' | 'error'
    stop, // 中断生成
    error, // 错误信息
    regenerate, // 重试（重新生成最后一条回复）
  } = useChat({
    transport: new DefaultChatTransport({ api: '/api/chat' }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // 提交处理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    sendMessage({ text: input.trim() })
    setInput('')
  }

  // 从 parts 中提取文本内容
  const getTextContent = (parts: Array<{ type: string; text?: string }>) => {
    const textPart = parts.find((p) => p.type === 'text')
    return textPart?.text || ''
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat</h1>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg max-w-[80%] ${
              msg.role === 'user' ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-200 text-black'
            }`}
          >
            {getTextContent(msg.parts)}
          </div>
        ))}

        {/* 错误提示 */}
        {status === 'error' && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg">
            {error?.message || '请求失败'}
            <button
              onClick={() => regenerate()}
              className="ml-4 bg-red-500 text-white px-3 py-1 rounded-lg"
            >
              重试
            </button>
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          disabled={isLoading}
          className="flex-1 border rounded-lg px-4 py-2 disabled:opacity-50"
        />
        {isLoading ? (
          <button
            type="button"
            onClick={stop}
            className="bg-red-500 text-white px-6 py-2 rounded-lg"
          >
            停止
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            发送
          </button>
        )}
      </form>
    </div>
  )
}
