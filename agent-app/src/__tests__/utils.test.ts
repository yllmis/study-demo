import { describe, it, expect } from 'vitest'
import { cn, formatDate } from '@/lib/utils'

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('a', 'b', 'c')).toBe('a b c')
  })

  it('filters out falsy values', () => {
    expect(cn('a', undefined, false, 'b')).toBe('a b')
  })

  it('returns empty string for no args', () => {
    expect(cn()).toBe('')
  })
})

describe('formatDate', () => {
  it('formats date to YYYY-MM-DD', () => {
    const date = new Date('2026-07-29T00:00:00Z')
    expect(formatDate(date)).toBe('2026-07-29')
  })
})
