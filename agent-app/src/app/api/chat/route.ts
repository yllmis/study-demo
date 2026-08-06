// ============================================
// Chat Route Handler — 使用 Vercel AI SDK
// ============================================

import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

// 创建 Mimo 客户端（OpenAI 兼容格式）
const mimo = createOpenAI({
  baseURL: process.env.MIMO_BASE_URL,
  apiKey: process.env.MIMO_API_KEY,
})

export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = streamText({
    model: mimo('mimo-v2.5-pro'),
    system: '你是一个有帮助的助手。',
    messages,
  })

  return result.toUIMessageStreamResponse()
}
