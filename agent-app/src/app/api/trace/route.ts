// ============================================
// Trace API — 获取最新的 Trace 记录
// ============================================

import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const LOG_FILE = join(process.cwd(), 'logs', 'trace.jsonl')

export async function GET() {
  try {
    if (!existsSync(LOG_FILE)) {
      return NextResponse.json({ traces: [] })
    }

    const content = readFileSync(LOG_FILE, 'utf-8')
    const lines = content.trim().split('\n').filter(Boolean)

    // 获取最后 10 条记录
    const traces = lines
      .slice(-10)
      .map((line) => JSON.parse(line))
      .reverse()

    return NextResponse.json({ traces })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read traces' }, { status: 500 })
  }
}
