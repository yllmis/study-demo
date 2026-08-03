'use client'

// ============================================
// 第4课：useEffect — 副作用处理
// ============================================

import { useState, useEffect } from 'react'

interface User {
  id: number
  name: string
  email: string
}

export function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // useEffect — 处理副作用（API 调用、订阅、定时器等）
  // Go 里没有对应概念，最接近的是 init() 函数或 goroutine
  //
  // 语法：useEffect(() => { ... }, [依赖项])
  // - 空数组 []：只在组件挂载时执行一次
  // - 有依赖项：依赖项变化时执行
  // - 不传：每次渲染都执行（一般不用）

  useEffect(() => {
    // 模拟 API 调用
    const fetchUsers = async () => {
      try {
        setLoading(true)
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500))

        const mockUsers: User[] = [
          { id: 1, name: 'Alice', email: 'alice@example.com' },
          { id: 2, name: 'Bob', email: 'bob@example.com' },
          { id: 3, name: 'Charlie', email: 'charlie@example.com' },
        ]
        setUsers(mockUsers)
      } catch (err) {
        setError('Failed to fetch users')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])  // 空依赖 → 只执行一次，类似 Go 的 init()

  if (loading) return <p>Loading...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold mb-2">User List</h3>
      <ul className="space-y-1">
        {users.map(user => (
          <li key={user.id}>
            {user.name} - {user.email}
          </li>
        ))}
      </ul>
    </div>
  )
}
