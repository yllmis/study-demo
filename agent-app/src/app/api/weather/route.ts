// ============================================
// 天气查询工具 — Tool Calling 学习
// ============================================
//
// 方案 A：所有东西在一个文件里
// 学习重点：Tool Schema 的设计，不是工具功能

import { createOpenAI } from '@ai-sdk/openai'
import { streamText, tool, isStepCount, convertToModelMessages } from 'ai'
import { z } from 'zod'

const mimo = createOpenAI({
  baseURL: process.env.MIMO_BASE_URL,
  apiKey: process.env.MIMO_API_KEY,
})

// ============================================
// 模拟数据
// ============================================
const mockWeather: Record<string, { condition: string; temp: string }> = {
  北京: { condition: '晴', temp: '22-32°C' },
  上海: { condition: '多云', temp: '25-30°C' },
  兰州: { condition: '小雨', temp: '15-25°C' },
  深圳: { condition: '雷阵雨', temp: '26-33°C' },
}

// ============================================
// 工具定义：模糊 Schema
// ============================================
//
// 问题：
// 1. 参数名 location 太模糊（城市？地址？经纬度？）
// 2. 没有描述，模型不知道该传什么
// 3. time 没有格式要求
// 4. 没有 enum 约束，模型可能传任意值

const getWeatherVague = tool({
  description: '查天气',
  inputSchema: z.object({
    location: z.string(),
    time: z.string(),
  }),
  execute: async ({ location, time }) => {
    const data = mockWeather[location]
    if (!data) {
      return { error: `没有找到 ${location} 的天气数据` }
    }
    return { city: location, date: time, ...data }
  },
})

// ============================================
// 工具定义：清晰 Schema
// ============================================
//
// 改进：
// 1. 参数名 city 明确
// 2. 描述清楚，告诉模型传什么
// 3. enum 约束，只能传这几个城市
// 4. date 有默认值说明

const getWeatherClear = tool({
  description: '查询指定城市的天气信息',
  inputSchema: z.object({
    city: z
      .enum(['北京', '上海', '兰州', '深圳'])
      .describe('城市名称，只支持：北京、上海、兰州、深圳'),
    date: z
      .string()
      .describe('日期，格式：YYYY-MM-DD，默认今天'),
  }),
  execute: async ({ city, date }) => {
    const data = mockWeather[city]
    if (!data) {
      return { error: `没有找到 ${city} 的天气数据` }
    }
    return { city, date, ...data }
  },
})

// ============================================
// Route Handler
// ============================================
export async function POST(request: Request) {
  const { messages, mode } = await request.json()

  // 根据 mode 选择使用哪个 Schema
  const tools = mode === 'vague'
    ? { getWeather: getWeatherVague }
    : { getWeather: getWeatherClear }

  const result = streamText({
    model: mimo.chat('mimo-v2.5-pro'),
    system: '你是一个天气查询助手。当用户询问天气时，使用 getWeather 工具查询。',
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: isStepCount(3), // 允许模型调用工具后继续回复
  })

  return result.toUIMessageStreamResponse()
}
