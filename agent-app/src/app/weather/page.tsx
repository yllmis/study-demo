'use client'

// ============================================
// 天气查询页面 — 测试 Tool Calling
// ============================================

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export default function WeatherPage() {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'vague' | 'clear'>('vague')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/weather',
      body: { mode }, // 传给服务端，选择哪个 Schema
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  // 获取消息文本内容（取最后一个非空的 text 部分）
  const getTextContent = (parts: Array<{ type: string; text?: string }>) => {
    const textParts = parts.filter((p) => p.type === 'text' && p.text)
    return textParts.length > 0 ? textParts[textParts.length - 1].text || '' : ''
  }

  // 判断是否是工具调用
  const isToolCall = (type: string) => type.startsWith('tool-')

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">天气查询 — Tool Calling</h1>

      {/* Schema 切换 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="font-medium mb-2">选择 Schema 版本：</p>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="vague"
              checked={mode === 'vague'}
              onChange={() => setMode('vague')}
            />
            <span>模糊 Schema</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="clear"
              checked={mode === 'clear'}
              onChange={() => setMode('clear')}
            />
            <span>清晰 Schema</span>
          </label>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {mode === 'vague'
            ? '模糊模式：参数名模糊，没有约束，模型可能传错参数'
            : '清晰模式：参数名明确，有 enum 约束，模型传参更准确'}
        </p>
      </div>

      {/* 提示 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium text-blue-800">试试这些问法：</p>
        <ul className="mt-1 text-blue-600 space-y-1">
          <li>• 查一下兰州天气</li>
          <li>• 北京今天天气怎么样？</li>
          <li>• 深圳明天会下雨吗？</li>
        </ul>
      </div>

      {/* 消息列表 */}
      <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-100 ml-12' : 'bg-gray-100 mr-12'
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">
              {msg.role === 'user' ? '你' : 'AI'}
            </p>

            {/* 调试：显示原始数据 */}
            <details className="mb-2">
              <summary className="text-xs text-gray-400 cursor-pointer">调试信息</summary>
              <pre className="mt-1 text-xs bg-gray-200 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(msg, null, 2)}
              </pre>
            </details>

            {/* 显示工具调用 */}
            {msg.parts?.map((part, i) => {
              if (isToolCall(part.type)) {
                const toolPart = part as { type: string; input?: unknown; output?: unknown }
                return (
                  <div key={i} className="my-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                    <p className="font-medium text-yellow-800">
                      🔧 工具调用：{part.type.replace('tool-', '')}
                    </p>
                    <pre className="mt-1 text-xs text-yellow-700">
                      参数：{JSON.stringify(toolPart.input, null, 2)}
                    </pre>
                    <pre className="mt-1 text-xs text-green-700">
                      结果：{JSON.stringify(toolPart.output, null, 2)}
                    </pre>
                  </div>
                )
              }
              return null
            })}

            {/* 显示文本内容 */}
            {getTextContent(msg.parts as Array<{ type: string; text?: string }>) && (
              <p className="whitespace-pre-wrap">
                {getTextContent(msg.parts as Array<{ type: string; text?: string }>)}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 输入框 */}
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入城市名查询天气..."
          disabled={isLoading}
          className="flex-1 border rounded-lg px-4 py-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? '查询中...' : '查询'}
        </button>
      </form>
    </div>
  )
}
