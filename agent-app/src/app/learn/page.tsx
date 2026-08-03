// ============================================
// 学习首页：汇总所有示例
// ============================================
// 这是 Server Component（没有 'use client'）

import { Greeting } from '@/components/Greeting'
import { Counter } from '@/components/Counter'
import { TodoApp } from '@/components/TodoApp'
import { UserList } from '@/components/UserList'
import { UserListServer } from '@/components/UserListServer'
import { ApiDemo } from '@/components/ApiDemo'
import { StreamDemo } from '@/components/StreamDemo'

export default function LearnPage() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">React/Next.js 学习示例</h1>

      {/* 1. 组件和 Props */}
      <section>
        <h2 className="text-xl font-semibold mb-2">1. 组件和 Props</h2>
        <Greeting name="Alice" age={25}>
          <p>This is children content (like Vue slot)</p>
        </Greeting>
      </section>

      {/* 2. State 和事件 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">2. State 和事件</h2>
        <Counter />
      </section>

      {/* 3. 表单和列表 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">3. 表单和列表渲染</h2>
        <TodoApp />
      </section>

      {/* 4. useEffect */}
      <section>
        <h2 className="text-xl font-semibold mb-2">4. useEffect</h2>
        <UserList />
      </section>

      {/* 5. Server vs Client Component */}
      <section>
        <h2 className="text-xl font-semibold mb-2">5. Server vs Client Component</h2>
        <div className="grid grid-cols-2 gap-4">
          <UserListServer />
          <UserList />
        </div>
      </section>

      {/* 6. 前端调用后端 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">6. 前端调用后端 API</h2>
        <ApiDemo />
      </section>

      {/* 7. 流式响应 */}
      <section>
        <h2 className="text-xl font-semibold mb-2">7. 流式响应</h2>
        <StreamDemo />
      </section>
    </div>
  )
}
