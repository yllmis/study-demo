// ============================================
// 三个工具 — 多工具选择学习
// ============================================
//
// 方案 A：所有东西在一个文件里
// 学习重点：模型如何在多个工具中选择

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

// 日志数据
const mockLogs = [
  {
    timestamp: '2026-08-17 10:00:01',
    level: 'info',
    service: 'order-service',
    message: '订单创建成功，orderId: 1001',
  },
  {
    timestamp: '2026-08-17 10:00:02',
    level: 'error',
    service: 'payment-service',
    message: '支付错误：余额不足',
  },
  {
    timestamp: '2026-08-17 10:00:03',
    level: 'warn',
    service: 'order-service',
    message: '订单超时未支付，orderId: 1002',
  },
  {
    timestamp: '2026-08-17 10:00:04',
    level: 'info',
    service: 'user-service',
    message: '用户登录成功，userId: 5001',
  },
  {
    timestamp: '2026-08-17 10:00:05',
    level: 'error',
    service: 'order-service',
    message: '数据库连接错误',
  },
  {
    timestamp: '2026-08-17 10:00:06',
    level: 'info',
    service: 'payment-service',
    message: '支付成功，orderId: 1003',
  },
  {
    timestamp: '2026-08-17 10:00:07',
    level: 'error',
    service: 'user-service',
    message: '用户认证错误：token过期',
  },
  {
    timestamp: '2026-08-17 10:00:08',
    level: 'warn',
    service: 'payment-service',
    message: '支付回调超时',
  },
]

// 服务状态数据
const mockServices: Record<string, { status: string; uptime: string; instances: number }> = {
  'order-service': { status: 'running', uptime: '3天', instances: 3 },
  'payment-service': { status: 'running', uptime: '7天', instances: 2 },
  'user-service': { status: 'error', uptime: '0天', instances: 1 },
  'inventory-service': { status: 'stopped', uptime: '0天', instances: 0 },
}

// 错误率数据
const mockErrorRates: Record<string, { total: number; errors: number; rate: string }> = {
  '1h': { total: 1000, errors: 15, rate: '1.5%' },
  '6h': { total: 6000, errors: 120, rate: '2.0%' },
  '24h': { total: 24000, errors: 480, rate: '2.0%' },
}

// ============================================
// 工具定义
// ============================================

// 工具 1：搜索日志
const searchLogs = tool({
  description: '搜索系统日志。查询错误日志请用 level="error"，不要用 keyword 搜"错误"。',
  inputSchema: z.object({
    keyword: z.string().describe('搜索关键词，用于搜索日志内容，如：订单、支付、数据库'),
    level: z
      .enum(['info', 'warn', 'error'])
      .optional()
      .describe('日志级别过滤。查错误日志用 error，查警告用 warn，查信息用 info'),
    limit: z.number().optional().default(5).describe('返回条数限制，默认 5 条'),
  }),
  execute: async ({ keyword, level, limit }) => {
    let results = mockLogs.filter(
      (log) => log.message.includes(keyword) || log.service.includes(keyword),
    )
    if (level) {
      results = results.filter((log) => log.level === level)
    }
    return {
      total: results.length,
      logs: results.slice(0, limit),
    }
  },
})

// 工具 2：查询服务状态
const getServiceStatus = tool({
  description: '查询指定服务的运行状态',
  inputSchema: z.object({
    serviceName: z
      .enum(['order-service', 'payment-service', 'user-service', 'inventory-service'])
      .describe(
        '服务名称，只支持：order-service、payment-service、user-service、inventory-service',
      ),
  }),
  execute: async ({ serviceName }) => {
    const service = mockServices[serviceName]
    if (!service) {
      return { error: `服务 ${serviceName} 不存在` }
    }
    return {
      service: serviceName,
      ...service,
    }
  },
})

// 工具 3：计算错误率
const calculateErrorRate = tool({
  description: '计算指定时间范围内的错误率',
  inputSchema: z.object({
    timeRange: z
      .enum(['1h', '6h', '24h'])
      .describe('时间范围：1h（最近1小时）、6h（最近6小时）、24h（最近24小时）'),
    serviceName: z.string().optional().describe('可选：指定服务名，不填则统计所有服务'),
  }),
  execute: async ({ timeRange, serviceName }) => {
    const data = mockErrorRates[timeRange]
    if (!data) {
      return { error: `不支持的时间范围：${timeRange}` }
    }
    return {
      timeRange,
      service: serviceName || '所有服务',
      ...data,
    }
  },
})

// ============================================
// Route Handler
// ============================================
export async function POST(request: Request) {
  const { messages } = await request.json()

  const result = streamText({
    model: mimo.chat('mimo-v2.5-pro'),
    system: `你是一个运维助手，可以帮助用户：
1. 搜索系统日志（search_logs）— 查错误日志用 level="error"，不要用 keyword 搜"错误"
2. 查询服务状态（get_service_status）
3. 计算错误率（calculate_error_rate）

根据用户的问题，选择合适的工具。如果不需要工具，直接回答。`,
    messages: await convertToModelMessages(messages),
    tools: {
      search_logs: searchLogs,
      get_service_status: getServiceStatus,
      calculate_error_rate: calculateErrorRate,
    },
    stopWhen: isStepCount(3),
  })

  return result.toUIMessageStreamResponse()
}
