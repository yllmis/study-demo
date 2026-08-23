'use client'

// ============================================
// 第3课：表单、事件、列表渲染
// ============================================

import { useState } from 'react'

interface Todo {
  id: number
  text: string
  done: boolean
}

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [input, setInput] = useState('')

  // 表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault() // 阻止页面刷新，Go 的表单处理不需要这个
    if (!input.trim()) return

    const newTodo: Todo = {
      id: Date.now(),
      text: input,
      done: false,
    }
    setTodos([...todos, newTodo]) // 展开运算符，类似 Go 的 append
    setInput('') // 清空输入框
  }

  // 切换完成状态
  const toggleTodo = (id: number) => {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)))
  }

  // 删除
  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  return (
    <div className="border p-4 rounded">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={input} // 受控组件：值由 state 控制
          onChange={(e) => setInput(e.target.value)} // 输入变化时更新 state
          placeholder="Add a task..."
          className="border px-2 py-1 rounded flex-1"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-1 rounded">
          Add
        </button>
      </form>

      {/* 列表渲染：用 map，Go 里是 for range */}
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-center gap-2">
            <input type="checkbox" checked={todo.done} onChange={() => toggleTodo(todo.id)} />
            <span className={todo.done ? 'line-through text-gray-400' : ''}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)} className="text-red-500 text-sm">
              Delete
            </button>
          </li>
        ))}
      </ul>

      {todos.length === 0 && <p className="text-gray-400">No tasks yet.</p>}
    </div>
  )
}
