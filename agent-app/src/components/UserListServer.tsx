// ============================================
// 第5课：Server Component（服务端组件）
// ============================================
//
// 没有 'use client' → 默认就是 Server Component
//
// Server Component vs Client Component：
//
// |                    | Server Component     | Client Component      |
// |--------------------|---------------------|-----------------------|
// | 运行位置           | 服务端              | 浏览器                |
// | 能用 useState?     | ❌ 不能             | ✅ 能                 |
// | 能用事件处理?      | ❌ 不能             | ✅ 能                 |
// | 能直接访问数据库?  | ✅ 能               | ❌ 不能               |
// | 能用 async/await?  | ✅ 能               | ❌ 不能               |
// | 发送到浏览器的 JS? | 不发送（0 JS）      | 发送（有 JS bundle）  |
//
// 怎么选？
// - 需要交互（点击、输入）→ Client Component
// - 只是展示数据 → Server Component
// - 需要访问数据库/API 密钥 → Server Component

// Server Component 可以是 async 函数！
export async function UserListServer() {
  // 这里可以直接访问数据库、调用 API（不会暴露给浏览器）
  // const users = await db.query("SELECT * FROM users")

  // 模拟数据库查询
  await new Promise(resolve => setTimeout(resolve, 100))
  const users = [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ]

  return (
    <div className="border p-4 rounded">
      <h3 className="font-bold mb-2">Server Component: User List</h3>
      <p className="text-sm text-gray-500 mb-2">
        This data is fetched on the server. No JS sent to browser.
      </p>
      <ul className="space-y-1">
        {users.map(user => (
          <li key={user.id}>
            {user.name} ({user.role})
          </li>
        ))}
      </ul>
    </div>
  )
}
