// ============================================
// Trace — Agent 执行追踪
// ============================================
//
// 记录每次 Agent 任务的完整执行过程
// 用于调试、监控和学习

import { appendFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// ============================================
// 数据结构
// ============================================

export interface ToolCall {
  name: string
  params: unknown
  result: unknown
  duration_ms: number
  error?: string
  retries: number
}

export interface Turn {
  step: number
  input: string
  output: string
  tool_calls: ToolCall[]
  duration_ms: number
}

export interface Trace {
  run_id: string
  model_name: string
  start_time: string
  end_time: string
  total_duration_ms: number
  turns: Turn[]
  token_usage: {
    prompt_tokens: number
    completion_tokens: number
  }
}

// ============================================
// 生成 run_id
// ============================================

export function generateRunId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `run_${timestamp}_${random}`
}

// ============================================
// 创建空 Trace
// ============================================

export function createTrace(modelName: string): Trace {
  return {
    run_id: generateRunId(),
    model_name: modelName,
    start_time: new Date().toISOString(),
    end_time: '',
    total_duration_ms: 0,
    turns: [],
    token_usage: {
      prompt_tokens: 0,
      completion_tokens: 0,
    },
  }
}

// ============================================
// 完成 Trace
// ============================================

export function finalizeTrace(trace: Trace): Trace {
  trace.end_time = new Date().toISOString()
  trace.total_duration_ms = trace.turns.reduce((sum, turn) => sum + turn.duration_ms, 0)
  return trace
}

// ============================================
// 写入日志文件
// ============================================

const LOG_DIR = join(process.cwd(), 'logs')
const LOG_FILE = join(LOG_DIR, 'trace.jsonl')

export function writeTraceToFile(trace: Trace): void {
  // 确保日志目录存在
  if (!existsSync(LOG_DIR)) {
    mkdirSync(LOG_DIR, { recursive: true })
  }

  // 写入 JSONL 格式（每行一个 JSON）
  const line = JSON.stringify(trace) + '\n'
  appendFileSync(LOG_FILE, line, 'utf-8')
}

// ============================================
// 格式化 Trace 用于前端展示
// ============================================

export function formatTraceForDisplay(trace: Trace): string {
  const lines: string[] = []

  lines.push(`Run ID: ${trace.run_id}`)
  lines.push(`Model: ${trace.model_name}`)
  lines.push(`Start: ${trace.start_time}`)
  lines.push(`End: ${trace.end_time}`)
  lines.push(`Duration: ${trace.total_duration_ms}ms`)
  lines.push(
    `Token Usage: ${trace.token_usage.prompt_tokens} prompt + ${trace.token_usage.completion_tokens} completion`,
  )
  lines.push('')

  for (const turn of trace.turns) {
    lines.push(`--- Turn ${turn.step} (${turn.duration_ms}ms) ---`)
    lines.push(`Input: ${turn.input.substring(0, 100)}...`)
    lines.push(`Output: ${turn.output.substring(0, 100)}...`)

    if (turn.tool_calls.length > 0) {
      lines.push('Tool Calls:')
      for (const tc of turn.tool_calls) {
        lines.push(`  - ${tc.name}(${JSON.stringify(tc.params)})`)
        lines.push(`    Result: ${JSON.stringify(tc.result).substring(0, 100)}...`)
        lines.push(`    Duration: ${tc.duration_ms}ms`)
        if (tc.error) {
          lines.push(`    Error: ${tc.error}`)
        }
        lines.push(`    Retries: ${tc.retries}`)
      }
    }

    lines.push('')
  }

  return lines.join('\n')
}
