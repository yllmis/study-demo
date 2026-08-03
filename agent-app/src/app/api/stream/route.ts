// ============================================
// 第7课：流式响应（Streaming）
// ============================================
//
// 普通响应：等所有数据准备好，一次性返回
// 流式响应：数据一块一块返回，边生成边发送
//
// 典型场景：AI 对话、大文件导出、实时日志
// Go 里对应：http.Flusher + chunked transfer encoding

export async function GET() {
  // 创建一个 ReadableStream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // 模拟分块发送数据
      for (let i = 1; i <= 5; i++) {
        const chunk = JSON.stringify({ chunk: i, data: `Part ${i} of the response` })
        controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))

        // 模拟延迟（像 AI 逐字生成）
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',    // SSE 格式
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
