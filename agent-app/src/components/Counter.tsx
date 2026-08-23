'use client' // ← 关键！标记为 Client Component

// ============================================
// 第2课：State、事件处理
// ============================================

import { useState } from 'react'

// 'use client' 的含义：
// - 这个组件在浏览器端运行（不是服务端）
// - 可以用 useState、useEffect、事件处理
// - 没有 'use client' 的组件默认是 Server Component

export function Counter() {
  // useState — 声明状态变量
  // Go 里最接近的是 struct 字段 + 方法修改
  // const [值, 修改值的函数] = useState(初始值)
  const [count, setCount] = useState(0)

  // 事件处理函数
  // Go: func handleClick() { ... }
  // TS: const handleClick = () => { ... }
  const handleClick = () => {
    setCount(count + 1) // 触发重新渲染
    // setCount(prev => prev + 1)  // 函数式更新，更安全
  }

  return (
    <div className="border p-4 rounded">
      <p>Count: {count}</p>
      <button
        onClick={handleClick} // 绑定事件，Go 里没有这种写法
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        +1
      </button>
      <button
        onClick={() => setCount(0)} // 直接写箭头函数
        className="ml-2 bg-gray-500 text-white px-4 py-2 rounded"
      >
        Reset
      </button>
    </div>
  )
}
