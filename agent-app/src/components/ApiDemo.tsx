'use client'

// ============================================
// 前端调用后端接口
// ============================================

import { useState } from 'react'

export function ApiDemo() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // 调用 GET /api/hello
  const callGetApi = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hello?name=Alice') // 相对路径，自动指向当前域名
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setResult(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  // 调用 POST /api/hello
  const callPostApi = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/hello', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Bob' }),
      })
      const data = await res.json()
      setResult(JSON.stringify(data, null, 2))
    } catch (err) {
      setResult(`Error: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border p-4 rounded">
      <div className="flex gap-2 mb-4">
        <button
          onClick={callGetApi}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          GET /api/hello
        </button>
        <button
          onClick={callPostApi}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          POST /api/hello
        </button>
      </div>
      {result && <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto">{result}</pre>}
    </div>
  )
}
