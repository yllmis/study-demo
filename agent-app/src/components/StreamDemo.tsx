'use client'

// ============================================
// 流式响应演示
// ============================================

import { useState } from 'react'

export function StreamDemo() {
  const [chunks, setChunks] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const startStream = async () => {
    setChunks([])
    setLoading(true)

    try {
      const res = await fetch('/api/stream')
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        // 解析 SSE 格式：data: {...}\n\n
        const lines = text.split('\n').filter(line => line.startsWith('data: '))

        for (const line of lines) {
          const data = line.replace('data: ', '')
          setChunks(prev => [...prev, data])
        }
      }
    } catch (err) {
      setChunks(prev => [...prev, `Error: ${err}`])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border p-4 rounded">
      <button
        onClick={startStream}
        disabled={loading}
        className="bg-purple-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Streaming...' : 'Start Stream'}
      </button>
      <div className="mt-4 space-y-1">
        {chunks.map((chunk, i) => (
          <div key={i} className="bg-gray-100 p-2 rounded text-sm">
            {chunk}
          </div>
        ))}
      </div>
    </div>
  )
}
