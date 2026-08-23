// ============================================
// Agent Loop — 完整演示（带 Trace）
// ============================================
//
// 学习重点：Agent Loop 的安全限制、错误处理和 Trace
//
// Trace：用户一次请求的完整过程
// Turn：模型一次处理（可能调用工具）
//
// 安全限制：
// - 最大步骤数：5 Turn
// - 总超时：2 分钟
// - 工具调用次数：每个工具最多 5 次
//
// 错误处理：
// - 网络超时：重试 3 次
// - 参数错误：不重试
// - 工具不存在：不重试
// - 返回空结果：不重试
// - 返回内容过长：重试 2 次
// - 相同工具重复调用：不重试
// - 工具内部异常：不重试
//
// Trace 记录：
// - run_id：唯一标识
// - model_name：模型名称
// - 每一步输入输出
// - 工具名称和参数
// - 工具结果
// - 执行耗时
// - 错误和重试
// - Token 用量

import { createOpenAI } from '@ai-sdk/openai'
import { streamText, tool, isStepCount, convertToModelMessages } from 'ai'
import { z } from 'zod'
import { createTrace, finalizeTrace, writeTraceToFile } from '@/lib/trace'
import type { Trace, Turn, ToolCall } from '@/lib/trace'

const mimo = createOpenAI({
  baseURL: process.env.MIMO_BASE_URL,
  apiKey: process.env.MIMO_API_KEY,
})

// ============================================
// 模拟数据
// ============================================

const mockLogs = [
  {
    timestamp: '2026-08-18 10:00:01',
    level: 'info',
    service: 'order-service',
    message: '订单创建成功，orderId: 1001',
  },
  {
    timestamp: '2026-08-18 10:00:02',
    level: 'error',
    service: 'payment-service',
    message: '支付错误：余额不足',
  },
  {
    timestamp: '2026-08-18 10:00:03',
    level: 'warn',
    service: 'order-service',
    message: '订单超时未支付，orderId: 1002',
  },
  {
    timestamp: '2026-08-18 10:00:04',
    level: 'info',
    service: 'user-service',
    message: '用户登录成功，userId: 5001',
  },
  {
    timestamp: '2026-08-18 10:00:05',
    level: 'error',
    service: 'order-service',
    message: '数据库连接错误',
  },
  {
    timestamp: '2026-08-18 10:00:06',
    level: 'info',
    service: 'payment-service',
    message: '支付成功，orderId: 1003',
  },
  {
    timestamp: '2026-08-18 10:00:07',
    level: 'error',
    service: 'user-service',
    message: '用户认证错误：token过期',
  },
  {
    timestamp: '2026-08-18 10:00:08',
    level: 'warn',
    service: 'payment-service',
    message: '支付回调超时',
  },
]

const mockServices: Record<string, { status: string; uptime: string; instances: number }> = {
  'order-service': { status: 'running', uptime: '3天', instances: 3 },
  'payment-service': { status: 'running', uptime: '7天', instances: 2 },
  'user-service': { status: 'error', uptime: '0天', instances: 1 },
  'inventory-service': { status: 'stopped', uptime: '0天', instances: 0 },
}

const mockErrorRates: Record<string, { total: number; errors: number; rate: string }> = {
  '1h': { total: 1000, errors: 15, rate: '1.5%' },
  '6h': { total: 6000, errors: 120, rate: '2.0%' },
  '24h': { total: 24000, errors: 480, rate: '2.0%' },
}

// ============================================
// 错误模拟配置
// ============================================

interface ErrorSimulation {
  timeout: boolean
  emptyResult: boolean
  longContent: boolean
  internalError: boolean
}

function getErrorSimulation(): ErrorSimulation {
  return {
    timeout: false,
    emptyResult: false,
    longContent: false,
    internalError: false,
  }
}

// ============================================
// 工具调用计数器
// ============================================

interface ToolCallCounts {
  search_logs: number
  get_service_status: number
  calculate_error_rate: number
}

function createToolCallCounts(): ToolCallCounts {
  return {
    search_logs: 0,
    get_service_status: 0,
    calculate_error_rate: 0,
  }
}

function checkToolCallLimit(
  counts: ToolCallCounts,
  toolName: keyof ToolCallCounts,
  limit: number,
): boolean {
  return counts[toolName] < limit
}

function incrementToolCallCount(counts: ToolCallCounts, toolName: keyof ToolCallCounts): void {
  counts[toolName]++
}

// ============================================
// 工具定义（带错误处理和 Trace）
// ============================================

function createTools(
  counts: ToolCallCounts,
  limit: number,
  errorSim: ErrorSimulation,
  trace: Trace,
) {
  // 记录工具调用
  function recordToolCall(toolCall: ToolCall) {
    const lastTurn = trace.turns[trace.turns.length - 1]
    if (lastTurn) {
      lastTurn.tool_calls.push(toolCall)
    }
  }

  return {
    search_logs: tool({
      description: '搜索系统日志。查询错误日志请用 level="error"，不要用 keyword 搜"错误"。',
      inputSchema: z.object({
        keyword: z.string().describe('搜索关键词，用于搜索日志内容，如：订单、支付、数据库'),
        level: z
          .enum(['info', 'warn', 'error'])
          .optional()
          .describe('日志级别过滤。查错误日志用 error，查警告用 warn，查信息用 info'),
        limit: z.number().optional().default(5).describe('返回条数限制，默认 5 条'),
      }),
      execute: async ({ keyword, level, limit: resultLimit }) => {
        const startTime = Date.now()
        const toolCall: ToolCall = {
          name: 'search_logs',
          params: { keyword, level, limit: resultLimit },
          result: null,
          duration_ms: 0,
          retries: 0,
        }

        // 检查调用次数
        if (!checkToolCallLimit(counts, 'search_logs', limit)) {
          toolCall.error = 'search_logs 调用次数已达上限'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: 'search_logs 调用次数已达上限，请换个问题' }
        }
        incrementToolCallCount(counts, 'search_logs')

        // 模拟网络超时
        if (errorSim.timeout) {
          toolCall.error = 'timeout'
          toolCall.retries = 3
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          throw new Error('timeout: 网络请求超时')
        }

        // 模拟内部异常
        if (errorSim.internalError) {
          toolCall.error = 'internal error'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          throw new Error('internal: 工具内部异常，请联系管理员')
        }

        // 执行逻辑
        let results = mockLogs.filter(
          (log) => log.message.includes(keyword) || log.service.includes(keyword),
        )
        if (level) {
          results = results.filter((log) => log.level === level)
        }

        // 模拟返回空结果
        if (errorSim.emptyResult || results.length === 0) {
          toolCall.error = 'empty result'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: '未找到相关数据，请换个关键词试试' }
        }

        // 模拟返回内容过长
        if (errorSim.longContent || results.length > 100) {
          toolCall.error = 'content too long'
          toolCall.retries = 2
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: '内容过长，请更精确的查询条件' }
        }

        const result = {
          total: results.length,
          logs: results.slice(0, resultLimit),
          callCount: counts.search_logs,
        }

        toolCall.result = result
        toolCall.duration_ms = Date.now() - startTime
        recordToolCall(toolCall)

        return result
      },
    }),

    get_service_status: tool({
      description: '查询指定服务的运行状态',
      inputSchema: z.object({
        serviceName: z
          .enum(['order-service', 'payment-service', 'user-service', 'inventory-service'])
          .describe(
            '服务名称，只支持：order-service、payment-service、user-service、inventory-service',
          ),
      }),
      execute: async ({ serviceName }) => {
        const startTime = Date.now()
        const toolCall: ToolCall = {
          name: 'get_service_status',
          params: { serviceName },
          result: null,
          duration_ms: 0,
          retries: 0,
        }

        // 检查调用次数
        if (!checkToolCallLimit(counts, 'get_service_status', limit)) {
          toolCall.error = 'get_service_status 调用次数已达上限'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: 'get_service_status 调用次数已达上限，请换个问题' }
        }
        incrementToolCallCount(counts, 'get_service_status')

        // 模拟网络超时
        if (errorSim.timeout) {
          toolCall.error = 'timeout'
          toolCall.retries = 3
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          throw new Error('timeout: 网络请求超时')
        }

        // 模拟内部异常
        if (errorSim.internalError) {
          toolCall.error = 'internal error'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          throw new Error('internal: 工具内部异常，请联系管理员')
        }

        // 执行逻辑
        const service = mockServices[serviceName]
        if (!service) {
          toolCall.error = `服务 ${serviceName} 不存在`
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: `服务 ${serviceName} 不存在，请检查服务名` }
        }

        const result = {
          service: serviceName,
          ...service,
          callCount: counts.get_service_status,
        }

        toolCall.result = result
        toolCall.duration_ms = Date.now() - startTime
        recordToolCall(toolCall)

        return result
      },
    }),

    calculate_error_rate: tool({
      description: '计算指定时间范围内的错误率',
      inputSchema: z.object({
        timeRange: z
          .enum(['1h', '6h', '24h'])
          .describe('时间范围：1h（最近1小时）、6h（最近6小时）、24h（最近24小时）'),
        serviceName: z.string().optional().describe('可选：指定服务名，不填则统计所有服务'),
      }),
      execute: async ({ timeRange, serviceName }) => {
        const startTime = Date.now()
        const toolCall: ToolCall = {
          name: 'calculate_error_rate',
          params: { timeRange, serviceName },
          result: null,
          duration_ms: 0,
          retries: 0,
        }

        // 检查调用次数
        if (!checkToolCallLimit(counts, 'calculate_error_rate', limit)) {
          toolCall.error = 'calculate_error_rate 调用次数已达上限'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: 'calculate_error_rate 调用次数已达上限，请换个问题' }
        }
        incrementToolCallCount(counts, 'calculate_error_rate')

        // 模拟网络超时
        if (errorSim.timeout) {
          toolCall.error = 'timeout'
          toolCall.retries = 3
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          throw new Error('timeout: 网络请求超时')
        }

        // 模拟内部异常
        if (errorSim.internalError) {
          toolCall.error = 'internal error'
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          throw new Error('internal: 工具内部异常，请联系管理员')
        }

        // 执行逻辑
        const data = mockErrorRates[timeRange]
        if (!data) {
          toolCall.error = `不支持的时间范围：${timeRange}`
          toolCall.duration_ms = Date.now() - startTime
          recordToolCall(toolCall)
          return { error: `不支持的时间范围：${timeRange}` }
        }

        const result = {
          timeRange,
          service: serviceName || '所有服务',
          ...data,
          callCount: counts.calculate_error_rate,
        }

        toolCall.result = result
        toolCall.duration_ms = Date.now() - startTime
        recordToolCall(toolCall)

        return result
      },
    }),
  }
}

// ============================================
// Route Handler
// ============================================
export async function POST(request: Request) {
  const { messages, errorSimulation } = await request.json()

  // 创建本次 Trace
  const trace = createTrace('mimo-v2.5-pro')

  // 创建工具调用计数器
  const toolCallCounts = createToolCallCounts()
  const TOOL_CALL_LIMIT = 5

  // 错误模拟配置
  const errorSim = errorSimulation || getErrorSimulation()

  let currentStep = 0
  let turnStartTime = Date.now()

  const result = streamText({
    model: mimo.chat('mimo-v2.5-pro'),
    system: `你是一个运维助手，可以帮助用户：
1. 搜索系统日志（search_logs）— 查错误日志用 level="error"，不要用 keyword 搜"错误"
2. 查询服务状态（get_service_status）
3. 计算错误率（calculate_error_rate）

根据用户的问题，选择合适的工具。如果不需要工具，直接回答。

重要规则：
- 每个工具最多调用 5 次，请合理使用
- 如果工具返回错误，必须明确告诉用户错误信息
- 如果工具返回 { error: "..." }，这是错误，必须显示给用户
- 如果想用之前查询的结果，必须说明"这是之前的查询结果，不是最新数据"
- 网络超时可以重试，其他错误直接告诉用户`,
    messages: await convertToModelMessages(messages),
    tools: createTools(toolCallCounts, TOOL_CALL_LIMIT, errorSim, trace),

    // Agent Loop 安全限制
    stopWhen: isStepCount(5),
    timeout: 120000,

    // 回调：记录每一步
    onStepFinish: async (event) => {
      currentStep++

      // 从消息中提取文本内容（v7 用 parts 而不是 content）
      const lastMessage = messages[messages.length - 1]
      let inputText = ''
      if (lastMessage?.parts) {
        const textParts = lastMessage.parts.filter((p: { type: string }) => p.type === 'text')
        inputText = textParts.map((p: { text?: string }) => p.text || '').join(' ')
      } else if (lastMessage?.content) {
        inputText = typeof lastMessage.content === 'string' ? lastMessage.content : ''
      }

      const turn: Turn = {
        step: currentStep,
        input: inputText,
        output: event.text || '',
        tool_calls: [],
        duration_ms: Date.now() - turnStartTime,
      }
      trace.turns.push(turn)
      turnStartTime = Date.now()
    },

    // 回调：完成时记录 token 用量
    onFinish: async (event) => {
      trace.token_usage = {
        prompt_tokens: event.usage?.inputTokens || 0,
        completion_tokens: event.usage?.outputTokens || 0,
      }

      // 完成 Trace 并写入日志文件
      const finalizedTrace = finalizeTrace(trace)
      writeTraceToFile(finalizedTrace)

      console.log(
        `[Trace] ${finalizedTrace.run_id} completed in ${finalizedTrace.total_duration_ms}ms`,
      )
    },
  })

  return result.toUIMessageStreamResponse()
}
