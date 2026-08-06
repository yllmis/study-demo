'use client'

// ============================================
// 结构化输出页面
// ============================================

import { useState } from 'react'
import { parseTask } from '@/lib/structured'
import type { Task } from '@/lib/schemas'

export default function StructuredOutputPage() {
  const [input, setInput] = useState('')
  const [task, setTask] = useState<Task | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    setLoading(true)
    setError(null)
    setTask(null)
    setAttempts(0)

    const result = await parseTask(input.trim())

    setAttempts(result.attempts)

    if (result.success) {
      setTask(result.task!)
    } else {
      setError(result.error || '解析失败')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">结构化输出</h1>

      {/* 输入区域 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入任务描述，例如：&#10;帮我创建一个任务：写API文档，优先级高，明天截止，交给小明"
          disabled={loading}
          rows={4}
          className="w-full border rounded-lg px-4 py-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="mt-2 bg-blue-500 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? '解析中...' : '解析'}
        </button>
      </form>

      {/* 结果展示 */}
      {task && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h2 className="font-semibold mb-2 text-green-800">
            解析成功（第 {attempts} 次尝试）
          </h2>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">标题：</span>{task.title}</p>
            <p><span className="font-medium">优先级：</span>
              <span className={
                task.priority === 'high' ? 'text-red-600' :
                task.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }>
                {task.priority}
              </span>
            </p>
            <p><span className="font-medium">截止日期：</span>{task.dueDate || '未设置'}</p>
            <p><span className="font-medium">负责人：</span>{task.assignee || '未设置'}</p>
            <p><span className="font-medium">状态：</span>{task.status}</p>
          </div>

          {/* 原始 JSON */}
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-gray-500">查看原始 JSON</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-xs overflow-auto">
              {JSON.stringify(task, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* 错误展示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="font-semibold mb-2 text-red-800">
            解析失败（尝试 {attempts} 次）
          </h2>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
