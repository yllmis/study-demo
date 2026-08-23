// ============================================
// 双工具天气 Agent — 串行调用
// ============================================
//
// 执行层能力：
// 1. 缓存去重 — 相同工具+相同参数直接返回缓存
// 2. 真正重试 — 区分可重试/不可重试错误
// 3. 调用限制 — 每个工具最多 5 次
// 4. 错误模拟 — 验证重试和降级

import { createOpenAI } from '@ai-sdk/openai'
import { streamText, tool, isStepCount, convertToModelMessages } from 'ai'
import { z } from 'zod'
import {
  createCacheKey,
  getFromCache,
  setCache,
  executeWithRetry,
  ToolCallLimiter,
} from '@/lib/tool-utils'

const mimo = createOpenAI({
  baseURL: process.env.MIMO_BASE_URL,
  apiKey: process.env.MIMO_API_KEY,
})

// ============================================
// 模拟数据
// ============================================

const mockWeather: Record<
  string,
  { condition: string; temp: string; rainProbability: string; wind: string }
> = {
  北京: { condition: '晴', temp: '22-32°C', rainProbability: '10%', wind: '北风2级' },
  上海: { condition: '多云', temp: '25-30°C', rainProbability: '30%', wind: '东南风3级' },
  兰州: { condition: '小雨', temp: '15-25°C', rainProbability: '70%', wind: '西风2级' },
  深圳: { condition: '雷阵雨', temp: '26-33°C', rainProbability: '85%', wind: '南风3级' },
}

const mockAirQuality: Record<string, { aqi: number; level: string }> = {
  北京: { aqi: 85, level: '良' },
  上海: { aqi: 52, level: '良' },
  兰州: { aqi: 120, level: '轻度污染' },
  深圳: { aqi: 35, level: '优' },
}

// ============================================
// 城市枚举
// ============================================

const SUPPORTED_CITIES = ['北京', '上海', '兰州', '深圳'] as const

// ============================================
// 错误模拟配置
// ============================================

export interface ErrorSimulation {
  weatherTimeout: boolean
  airQualityFailure: boolean
}

// ============================================
// 工具业务逻辑（可独立测试）
// ============================================

export function getWeatherData(
  city: string,
  date: string,
  errorSim?: ErrorSimulation,
): {
  city: string
  date: string
  condition: string
  temp: string
  rainProbability: string
  wind: string
} {
  if (errorSim?.weatherTimeout) {
    throw new Error('timeout: 网络请求超时')
  }
  const data = mockWeather[city]
  if (!data) {
    throw new Error(`没有找到 ${city} 的天气数据`)
  }
  return { city, date, ...data }
}

export function getAirQualityData(
  city: string,
  errorSim?: ErrorSimulation,
): { city: string; aqi: number; level: string } {
  if (errorSim?.airQualityFailure) {
    throw new Error('503: 空气质量服务暂时不可用')
  }
  const data = mockAirQuality[city]
  if (!data) {
    throw new Error(`没有找到 ${city} 的空气质量数据`)
  }
  return { city, ...data }
}

// ============================================
// 工具定义
// ============================================

const TOOL_CALL_LIMIT = 5

export function createTools(errorSim?: ErrorSimulation) {
  const cache = new Map<string, unknown>()
  const limiter = new ToolCallLimiter(TOOL_CALL_LIMIT)

  const getWeather = tool({
    description: '查询指定城市的天气信息，包括天气状况、温度、降雨概率和风力',
    inputSchema: z.object({
      city: z.enum(SUPPORTED_CITIES).describe('城市名称，只支持：北京、上海、兰州、深圳'),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须是 YYYY-MM-DD')
        .optional()
        .describe('日期，格式：YYYY-MM-DD，默认今天'),
    }),
    execute: async ({ city, date }) => {
      const params = { city, date: date || '今天' }
      const cacheKey = createCacheKey('getWeather', params)

      // 1. 检查缓存
      const cached = getFromCache(cache, cacheKey)
      if (cached !== undefined) {
        return { ...(cached as Record<string, unknown>), fromCache: true }
      }

      // 2. 检查调用次数
      if (!limiter.canCall('getWeather')) {
        return { error: `getWeather 调用次数已达上限（${TOOL_CALL_LIMIT}次）` }
      }
      limiter.increment('getWeather')

      // 3. 带重试的执行
      const { result, error } = await executeWithRetry(async () => {
        return getWeatherData(city, params.date, errorSim)
      })

      // 4. 成功则写入缓存
      if (!error) {
        setCache(cache, cacheKey, result)
      }

      return result
    },
  })

  const getAirQuality = tool({
    description: '查询指定城市的空气质量信息，包括 AQI 指数和污染等级',
    inputSchema: z.object({
      city: z.enum(SUPPORTED_CITIES).describe('城市名称，只支持：北京、上海、兰州、深圳'),
    }),
    execute: async ({ city }) => {
      const params = { city }
      const cacheKey = createCacheKey('getAirQuality', params)

      // 1. 检查缓存
      const cached = getFromCache(cache, cacheKey)
      if (cached !== undefined) {
        return { ...(cached as Record<string, unknown>), fromCache: true }
      }

      // 2. 检查调用次数
      if (!limiter.canCall('getAirQuality')) {
        return { error: `getAirQuality 调用次数已达上限（${TOOL_CALL_LIMIT}次）` }
      }
      limiter.increment('getAirQuality')

      // 3. 带重试的执行
      const { result, error } = await executeWithRetry(async () => {
        return getAirQualityData(city, errorSim)
      })

      // 4. 成功则写入缓存
      if (!error) {
        setCache(cache, cacheKey, result)
      }

      return result
    },
  })

  return { getWeather, getAirQuality }
}

// ============================================
// System Prompt
// ============================================

const SYSTEM_PROMPT = `你是一个天气和空气质量查询助手，帮助用户查询天气并判断是否适合户外活动。

## 可用工具
1. getWeather — 查询天气（天气状况、温度、降雨概率、风力）
2. getAirQuality — 查询空气质量（AQI 指数、污染等级）

## 工具调用规则

### 必须调用 getWeather 的情况
- 用户明确询问天气（"今天天气怎么样"、"会下雨吗"）
- 用户询问户外活动建议（"适合跑步吗"、"能户外运动吗"）

### 必须调用 getAirQuality 的情况
- 用户询问是否适合户外活动（跑步、运动、出行等）
- 用户明确询问空气质量

### 可以不调用 getAirQuality 的情况
- 用户只问天气，没有涉及户外活动或健康建议

### 串行调用
- 如果需要两个工具，先调用 getWeather，再调用 getAirQuality

## 输入校验
- 如果用户没有指定城市，回复："请告诉我你想查询哪个城市"
- 如果城市不在支持列表中，回复："暂不支持该城市，目前支持：北京、上海、兰州、深圳"

## 错误处理
- 工具返回 { error: "..." }，必须告诉用户错误信息，不要猜测数据
- 两个工具都失败：告诉用户"查询失败，请稍后重试"
- 天气成功但空气质量失败：告诉用户天气数据，同时告知"空气质量查询失败"
- 相同工具相同参数重复调用：直接返回之前的结果
- 确定性错误（API key 无效等）：立即停止，告诉用户

## 最终回答约束
- 天气、温度、降雨概率、风力：必须来自 getWeather，不能猜测
- AQI、污染等级：必须来自 getAirQuality，不能猜测
- 是否适合户外活动：可以推理，但必须基于上述真实数据给出建议`

// ============================================
// Route Handler
// ============================================
export async function POST(request: Request) {
  const { messages, errorSimulation } = await request.json()

  const result = streamText({
    model: mimo.chat('mimo-v2.5-pro'),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: createTools(errorSimulation),
    stopWhen: isStepCount(5),
  })

  return result.toUIMessageStreamResponse()
}
