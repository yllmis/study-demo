'use client'

// ============================================
// 多工具测试页面 — 测试工具选择
// ============================================

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

export default function ToolsPage() {
  const [input, setInput] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/tools',
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

  // 测试用例
  const testCases = [
    { label: '搜索错误日志', prompt: '帮我搜一下最近的错误日志' },
    { label: '查询服务状态', prompt: 'order-service 运行状态怎么样？' },
    { label: '计算错误率', prompt: '最近1小时的错误率是多少？' },
    { label: '不该调工具', prompt: '今天天气怎么样？' },
    { label: '参数不完整', prompt: '帮我查一下日志' },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">多工具选择 — Tool Calling</h1>

      {/* 说明 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="font-medium mb-2">可用工具：</p>
        <ul className="text-sm space-y-1">
          <li>
            • <code>search_logs</code> — 搜索日志（关键词、日志级别）
          </li>
          <li>
            • <code>get_service_status</code> — 查询服务状态
          </li>
          <li>
            • <code>calculate_error_rate</code> — 计算错误率
          </li>
        </ul>
      </div>

      {/* 测试用例 */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium text-blue-800 mb-2">测试场景：</p>
        <div className="flex flex-wrap gap-2">
          {testCases.map((tc) => (
            <button
              key={tc.label}
              onClick={() => {
                setInput(tc.prompt)
              }}
              className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              {tc.label}
            </button>
          ))}
        </div>
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
            <p className="text-xs text-gray-500 mb-1">{msg.role === 'user' ? '你' : 'AI'}</p>

            {/* 显示工具调用 */}
            {msg.parts?.map((part, i) => {
              if (isToolCall(part.type)) {
                const toolPart = part as { type: string; input?: unknown; output?: unknown }
                return (
                  <div
                    key={i}
                    className="my-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm"
                  >
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
          placeholder="输入问题，测试工具选择..."
          disabled={isLoading}
          className="flex-1 border rounded-lg px-4 py-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {isLoading ? '处理中...' : '发送'}
        </button>
      </form>
    </div>
  )
}
