'use client'

// ============================================
// Agent Loop 测试页面（带 Trace 查看）
// ============================================
//
// 学习重点：观察 Agent Loop 的执行过程和 Trace
//
// Trace：用户一次请求的完整过程
// Turn：模型一次处理（可能调用工具）

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useEffect, useCallback } from 'react'

interface ErrorSimulation {
  timeout: boolean
  emptyResult: boolean
  longContent: boolean
  internalError: boolean
}

interface ToolCall {
  name: string
  params: unknown
  result: unknown
  duration_ms: number
  error?: string
  retries: number
}

interface Turn {
  step: number
  input: string
  output: string
  tool_calls: ToolCall[]
  duration_ms: number
}

interface Trace {
  run_id: string
  model_name: string
  start_time: string
  end_time: string
  total_duration_ms: number
  turns: Turn[]
  token_usage: {
    prompt_tokens: number
    completion_tokens: number
  }
}

export default function AgentPage() {
  const [input, setInput] = useState('')
  const [errorSim, setErrorSim] = useState<ErrorSimulation>({
    timeout: false,
    emptyResult: false,
    longContent: false,
    internalError: false,
  })
  const [traces, setTraces] = useState<Trace[]>([])
  const [showTraces, setShowTraces] = useState(false)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/agent',
      body: { errorSimulation: errorSim },
    }),
  })

  const isLoading = status === 'submitted' || status === 'streaming'

  // 获取 Trace 记录
  const fetchTraces = useCallback(async () => {
    try {
      const res = await fetch('/api/trace')
      const data = await res.json()
      setTraces(data.traces || [])
    } catch (err) {
      console.error('Failed to fetch traces:', err)
    }
  }, [])

  // 消息更新时刷新 Trace
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      // 延迟一下，等待 Trace 写入文件
      const timer = setTimeout(fetchTraces, 500)
      return () => clearTimeout(timer)
    }
  }, [isLoading, messages.length, fetchTraces])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input.trim() })
    setInput('')
  }

  // 切换错误模拟
  const toggleErrorSim = (key: keyof ErrorSimulation) => {
    setErrorSim((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // 获取消息文本内容（取最后一个非空的 text 部分）
  const getTextContent = (parts: Array<{ type: string; text?: string }>) => {
    const textParts = parts.filter((p) => p.type === 'text' && p.text)
    return textParts.length > 0 ? textParts[textParts.length - 1].text || '' : ''
  }

  // 判断是否是工具调用
  const isToolCall = (type: string) => type.startsWith('tool-')

  // 统计工具调用次数
  const countToolCalls = (parts: Array<{ type: string }>) => {
    return parts.filter((p) => isToolCall(p.type)).length
  }

  // 测试用例
  const testCases = [
    { label: '简单查询', prompt: 'order-service 状态怎么样？' },
    { label: '多工具调用', prompt: '帮我查一下最近的错误日志，还有 payment-service 的状态' },
    { label: '复杂分析', prompt: '分析一下系统健康状况：查错误日志、服务状态、错误率' },
    { label: '不需要工具', prompt: '什么是微服务架构？' },
  ]

  // 错误模拟配置
  const errorSimOptions = [
    { key: 'timeout' as const, label: '网络超时', description: '模拟网络请求超时' },
    { key: 'emptyResult' as const, label: '返回空结果', description: '模拟查询无数据' },
    { key: 'longContent' as const, label: '返回内容过长', description: '模拟返回数据过多' },
    { key: 'internalError' as const, label: '工具内部异常', description: '模拟工具代码出错' },
  ]

  // 格式化时间
  const formatTime = (iso: string) => {
    if (!iso) return '-'
    return new Date(iso).toLocaleTimeString('zh-CN')
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Agent Loop 测试</h1>

      {/* 说明 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="font-medium mb-2">Agent Loop 安全限制：</p>
        <ul className="text-sm space-y-1">
          <li>• 最大步骤数：5 Turn</li>
          <li>• 总超时：2 分钟</li>
          <li>• 工具调用次数：每个工具最多 5 次</li>
        </ul>
        <p className="font-medium mt-3 mb-2">可用工具：</p>
        <ul className="text-sm space-y-1">
          <li>
            • <code>search_logs</code> — 搜索日志
          </li>
          <li>
            • <code>get_service_status</code> — 查询服务状态
          </li>
          <li>
            • <code>calculate_error_rate</code> — 计算错误率
          </li>
        </ul>
      </div>

      {/* 错误模拟 */}
      <div className="mb-4 p-4 bg-red-50 rounded-lg">
        <p className="font-medium mb-2 text-red-800">错误模拟：</p>
        <div className="grid grid-cols-2 gap-2">
          {errorSimOptions.map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={errorSim[opt.key]}
                onChange={() => toggleErrorSim(opt.key)}
                className="rounded"
              />
              <span className="font-medium">{opt.label}</span>
              <span className="text-gray-500">— {opt.description}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">开启后，下次请求会模拟对应的错误场景</p>
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
                const output = toolPart.output as Record<string, unknown> | undefined
                const hasError = output && typeof output === 'object' && 'error' in output

                return (
                  <div
                    key={i}
                    className={`my-2 p-2 border rounded text-sm ${
                      hasError ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <p className={`font-medium ${hasError ? 'text-red-800' : 'text-yellow-800'}`}>
                      {hasError ? '❌' : '🔧'} 工具调用：{part.type.replace('tool-', '')}
                    </p>
                    <pre
                      className={`mt-1 text-xs ${hasError ? 'text-red-700' : 'text-yellow-700'}`}
                    >
                      参数：{JSON.stringify(toolPart.input, null, 2)}
                    </pre>
                    <pre className={`mt-1 text-xs ${hasError ? 'text-red-700' : 'text-green-700'}`}>
                      {hasError ? '错误' : '结果'}：{JSON.stringify(toolPart.output, null, 2)}
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

            {/* 统计信息 */}
            {msg.role === 'assistant' && msg.parts && (
              <p className="text-xs text-gray-400 mt-2">
                工具调用次数：{countToolCalls(msg.parts as Array<{ type: string }>)}
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
          placeholder="输入问题，测试 Agent Loop..."
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

      {/* Trace 查看器 */}
      <div className="mt-8">
        <button
          onClick={() => {
            setShowTraces(!showTraces)
            if (!showTraces) fetchTraces()
          }}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {showTraces ? '隐藏' : '查看'} Trace 记录 ({traces.length})
        </button>

        {showTraces && (
          <div className="mt-4 space-y-4">
            {traces.length === 0 ? (
              <p className="text-sm text-gray-500">暂无 Trace 记录</p>
            ) : (
              traces.map((trace) => (
                <div
                  key={trace.run_id}
                  className="p-4 bg-gray-900 text-green-400 rounded-lg text-xs font-mono"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-yellow-400">Run: {trace.run_id}</span>
                    <span className="text-gray-500">{formatTime(trace.start_time)}</span>
                  </div>
                  <div className="text-gray-400 mb-2">
                    Model: {trace.model_name} | Duration: {trace.total_duration_ms}ms | Token:{' '}
                    {trace.token_usage.prompt_tokens}+{trace.token_usage.completion_tokens}
                  </div>

                  {trace.turns.map((turn) => (
                    <div key={turn.step} className="ml-4 mt-2 p-2 bg-gray-800 rounded">
                      <div className="text-blue-400">
                        Turn {turn.step} ({turn.duration_ms}ms)
                      </div>
                      <div className="text-gray-300 mt-1">
                        Input: {turn.input.substring(0, 80)}...
                      </div>
                      <div className="text-gray-300">Output: {turn.output.substring(0, 80)}...</div>

                      {turn.tool_calls.length > 0 && (
                        <div className="mt-2">
                          <span className="text-purple-400">Tools:</span>
                          {turn.tool_calls.map((tc, i) => (
                            <div key={i} className="ml-4 mt-1">
                              <span className="text-yellow-400">{tc.name}</span>
                              <span className="text-gray-500">({tc.duration_ms}ms)</span>
                              {tc.error && <span className="text-red-400"> ERROR: {tc.error}</span>}
                              {tc.retries > 0 && (
                                <span className="text-orange-400"> retries: {tc.retries}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
