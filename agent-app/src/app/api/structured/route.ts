// ============================================
// Structured Output Route Handler
// ============================================
//
// 接收自然语言，返回结构化 JSON

import { createOpenAI } from '@ai-sdk/openai'
import { generateObject } from 'ai'
import { NextResponse } from 'next/server'
import { TaskSchema } from '@/lib/schemas'

const mimo = createOpenAI({
  baseURL: process.env.MIMO_BASE_URL,
  apiKey: process.env.MIMO_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { input, errorHint } = await request.json()

    if (!input || typeof input !== 'string') {
      return NextResponse.json({ error: 'input 是必填字段' }, { status: 400 })
    }

    // 构建 prompt
    let systemPrompt = `你是一个任务解析助手。把用户的自然语言输入转换成 JSON 格式的任务。

要求：
1. 只返回 JSON，不要返回任何其他文字
2. 严格按照以下格式：
{
  "title": "任务标题",
  "priority": "low" | "medium" | "high",
  "dueDate": "YYYY-MM-DD" 或 null,
  "assignee": "负责人姓名" 或 null,
  "status": "todo" | "in_progress" | "done"
}
3. 未知的字段填 null
4. 日期必须是 YYYY-MM-DD 格式`

    // 重试时加上错误提示
    if (errorHint) {
      systemPrompt += `\n\n上次返回格式错误：${errorHint}。请严格按格式返回。`
    }

    // generateObject：调用模型，强制返回 JSON
    const { object } = await generateObject({
      model: mimo('mimo-v2.5-pro'),
      schema: TaskSchema,
      system: systemPrompt,
      prompt: input,
      maxOutputTokens: 500,
    })

    return NextResponse.json({ task: object })
  } catch (err) {
    const message = err instanceof Error ? err.message : '服务端错误'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
