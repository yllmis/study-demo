// ============================================
// 第6课：Route Handler（API 路由）
// ============================================
//
// Go 里：http.HandleFunc("/api/hello", handler)
// Next.js：在 app/api/xxx/route.ts 里导出 GET/POST/PUT/DELETE 函数
//
// 文件路径 = URL 路径
// src/app/api/hello/route.ts → /api/hello

import { NextRequest, NextResponse } from 'next/server'

// GET /api/hello
export async function GET(request: NextRequest) {
  // NextRequest 扩展了原生 Request，多了 cookies、nextUrl 等
  // 类似 Go 的 *http.Request

  // 读取查询参数
  const name = request.nextUrl.searchParams.get('name') || 'World'

  return NextResponse.json({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  })
}

// POST /api/hello
export async function POST(request: NextRequest) {
  // 读取请求体（类似 Go 的 json.NewDecoder(r.Body).Decode(&data)）
  const body = await request.json()
  const { name } = body

  if (!name) {
    return NextResponse.json(
      { error: 'name is required' },
      { status: 400 }
    )
  }

  return NextResponse.json(
    { message: `Created greeting for ${name}` },
    { status: 201 }
  )
}

// 其他 HTTP 方法同理：
// export async function PUT(request: NextRequest) { ... }
// export async function DELETE(request: NextRequest) { ... }
