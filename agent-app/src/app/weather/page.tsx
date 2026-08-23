'use client'

// ============================================
// 双工具天气 Agent 测试页面
// ============================================
//
// 学习重点：观察串行工具调用、缓存、重试

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState } from 'react'

interface ErrorSimulation {
  weatherTimeout: boolean
  airQualityFailure: boolean
}

export default function WeatherPage() {
  const [input, setInput] = useState('')
  const [errorSim, setErrorSim] = useState<ErrorSimulation>({
    weatherTimeout: false,
    airQualityFailure: false,
  })

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/weather',
      body: { errorSimulation: errorSim },
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

  // 统计工具调用次数
  const countToolCalls = (parts: Array<{ type: string }>) => {
    return parts.filter((p) => isToolCall(p.type)).length
  }

  // 测试用例
  const testCases = [
    { label: '只查天气', prompt: '北京今天天气怎么样？' },
    { label: '户外活动', prompt: '查询上海天气，并判断今天是否适合户外跑步。' },
    { label: '天气+空气质量', prompt: '深圳天气和空气质量如何？' },
    { label: '没有城市', prompt: '今天适合跑步吗？' },
    { label: '不支持的城市', prompt: '杭州天气怎么样？' },
  ]

  // 错误模拟配置
  const errorSimOptions = [
    { key: 'weatherTimeout' as const, label: '天气超时', description: '天气查询触发超时重试' },
    {
      key: 'airQualityFailure' as const,
      label: '空气质量失败',
      description: '空气质量查询返回 5xx 错误',
    },
  ]

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">双工具天气 Agent</h1>

      {/* 说明 */}
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <p className="font-medium mb-2">串行调用策略：</p>
        <ul className="text-sm space-y-1">
          <li>
            • <code>getWeather</code> — 天气、温度、降雨概率、风力
          </li>
          <li>
            • <code>getAirQuality</code> — AQI 指数、污染等级
          </li>
        </ul>
        <p className="text-sm text-gray-500 mt-2">
          涉及户外活动建议时，模型会先查天气，再查空气质量，最后综合判断。
        </p>
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
                onChange={() => setErrorSim((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
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
                const isFromCache = output && typeof output === 'object' && 'fromCache' in output

                return (
                  <div
                    key={i}
                    className={`my-2 p-2 border rounded text-sm ${
                      hasError
                        ? 'bg-red-50 border-red-200'
                        : isFromCache
                          ? 'bg-green-50 border-green-200'
                          : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <p
                      className={`font-medium ${
                        hasError
                          ? 'text-red-800'
                          : isFromCache
                            ? 'text-green-800'
                            : 'text-yellow-800'
                      }`}
                    >
                      {hasError ? '❌' : isFromCache ? '📦' : '🔧'} 工具调用：
                      {part.type.replace('tool-', '')}
                      {isFromCache && ' (缓存命中)'}
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
          placeholder="输入城市和问题，如：上海适合跑步吗？"
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
