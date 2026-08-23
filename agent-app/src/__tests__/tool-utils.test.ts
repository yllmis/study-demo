import { describe, it, expect, vi } from 'vitest'
import {
  createCacheKey,
  getFromCache,
  setCache,
  isRetryableError,
  executeWithRetry,
  ToolCallLimiter,
} from '@/lib/tool-utils'
import { getWeatherData, getAirQualityData } from '@/app/api/weather/route'

// ============================================
// 1. 缓存 Key 稳定性
// ============================================

describe('缓存 Key', () => {
  it('相同工具+相同参数生成相同 key', () => {
    const key1 = createCacheKey('getWeather', { city: '上海', date: '今天' })
    const key2 = createCacheKey('getWeather', { city: '上海', date: '今天' })
    expect(key1).toBe(key2)
  })

  it('参数顺序不影响 key', () => {
    const key1 = createCacheKey('getWeather', { city: '上海', date: '今天' })
    const key2 = createCacheKey('getWeather', { date: '今天', city: '上海' })
    expect(key1).toBe(key2)
  })

  it('相同工具+不同参数生成不同 key', () => {
    const key1 = createCacheKey('getWeather', { city: '上海', date: '今天' })
    const key2 = createCacheKey('getWeather', { city: '上海', date: '明天' })
    expect(key1).not.toBe(key2)
  })

  it('不同工具+相同参数生成不同 key', () => {
    const key1 = createCacheKey('getWeather', { city: '上海' })
    const key2 = createCacheKey('getAirQuality', { city: '上海' })
    expect(key1).not.toBe(key2)
  })

  it('缓存写入后可以读取', () => {
    const cache = new Map<string, unknown>()
    const key = createCacheKey('getWeather', { city: '北京' })
    const value = { city: '北京', condition: '晴' }

    setCache(cache, key, value)
    const result = getFromCache(cache, key)

    expect(result).toEqual(value)
  })

  it('缓存未命中返回 undefined', () => {
    const cache = new Map<string, unknown>()
    const result = getFromCache(cache, 'nonexistent')
    expect(result).toBeUndefined()
  })
})

// ============================================
// 2. 错误分类
// ============================================

describe('错误分类', () => {
  it('网络超时：可重试', () => {
    expect(isRetryableError(new Error('timeout'))).toBe(true)
    expect(isRetryableError(new Error('网络请求超时'))).toBe(true)
  })

  it('5xx 错误：可重试', () => {
    expect(isRetryableError(new Error('500 Internal Server Error'))).toBe(true)
    expect(isRetryableError(new Error('502 Bad Gateway'))).toBe(true)
    expect(isRetryableError(new Error('503 Service Unavailable'))).toBe(true)
  })

  it('限流：可重试', () => {
    expect(isRetryableError(new Error('429 Too Many Requests'))).toBe(true)
    expect(isRetryableError(new Error('rate limit exceeded'))).toBe(true)
  })

  it('参数校验失败：不可重试', () => {
    expect(isRetryableError(new Error('invalid parameter'))).toBe(false)
  })

  it('API Key 错误：不可重试', () => {
    expect(isRetryableError(new Error('Unauthorized'))).toBe(false)
  })

  it('业务数据不存在：不可重试', () => {
    expect(isRetryableError(new Error('没有找到 北京 的天气数据'))).toBe(false)
  })
})

// ============================================
// 3. 带重试的执行器
// ============================================

describe('executeWithRetry', () => {
  it('成功执行：不重试', async () => {
    const fn = vi.fn().mockResolvedValue({ data: 'ok' })

    const result = await executeWithRetry(fn)

    expect(result.result).toEqual({ data: 'ok' })
    expect(result.retries).toBe(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('可重试错误：实际重试', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce({ data: 'ok' })

    const result = await executeWithRetry(fn, { maxRetries: 3, delayMs: 10 })

    expect(result.result).toEqual({ data: 'ok' })
    expect(result.retries).toBe(2)
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('可重试错误：用完重试次数后返回失败', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('timeout'))

    const result = await executeWithRetry(fn, { maxRetries: 2, delayMs: 10 })

    expect(result.error).toBe('timeout')
    expect(result.retries).toBe(3) // 1 initial + 2 retries
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('不可重试错误：立即返回，不重试', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('没有找到 北京 的天气数据'))

    const result = await executeWithRetry(fn, { maxRetries: 3, delayMs: 10 })

    expect(result.error).toBe('没有找到 北京 的天气数据')
    expect(result.retries).toBe(0)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

// ============================================
// 4. 调用次数限制
// ============================================

describe('ToolCallLimiter', () => {
  it('初始状态：可以调用', () => {
    const limiter = new ToolCallLimiter(5)
    expect(limiter.canCall('getWeather')).toBe(true)
  })

  it('调用次数递增', () => {
    const limiter = new ToolCallLimiter(3)
    limiter.increment('getWeather')
    limiter.increment('getWeather')
    expect(limiter.getCount('getWeather')).toBe(2)
  })

  it('达到上限后：不能调用', () => {
    const limiter = new ToolCallLimiter(2)
    limiter.increment('getWeather')
    limiter.increment('getWeather')
    expect(limiter.canCall('getWeather')).toBe(false)
  })

  it('不同工具独立计数', () => {
    const limiter = new ToolCallLimiter(2)
    limiter.increment('getWeather')
    limiter.increment('getWeather')
    expect(limiter.canCall('getWeather')).toBe(false)
    expect(limiter.canCall('getAirQuality')).toBe(true)
  })

  it('获取所有计数', () => {
    const limiter = new ToolCallLimiter(5)
    limiter.increment('getWeather')
    limiter.increment('getWeather')
    limiter.increment('getAirQuality')
    expect(limiter.getCounts()).toEqual({
      getWeather: 2,
      getAirQuality: 1,
    })
  })
})

// ============================================
// 5. 工具业务逻辑
// ============================================

describe('getWeatherData', () => {
  it('正常查询：返回天气数据', () => {
    const result = getWeatherData('上海', '今天')
    expect(result).toEqual({
      city: '上海',
      date: '今天',
      condition: '多云',
      temp: '25-30°C',
      rainProbability: '30%',
      wind: '东南风3级',
    })
  })

  it('不存在的城市：抛出不可重试错误', () => {
    expect(() => getWeatherData('火星', '今天')).toThrow('没有找到 火星 的天气数据')
  })

  it('错误模拟：超时触发可重试错误', () => {
    expect(() =>
      getWeatherData('上海', '今天', { weatherTimeout: true, airQualityFailure: false }),
    ).toThrow('timeout')
  })
})

describe('getAirQualityData', () => {
  it('正常查询：返回空气质量数据', () => {
    const result = getAirQualityData('深圳')
    expect(result).toEqual({
      city: '深圳',
      aqi: 35,
      level: '优',
    })
  })

  it('不存在的城市：抛出不可重试错误', () => {
    expect(() => getAirQualityData('火星')).toThrow('没有找到 火星 的空气质量数据')
  })

  it('错误模拟：5xx 触发可重试错误', () => {
    expect(() =>
      getAirQualityData('上海', { weatherTimeout: false, airQualityFailure: true }),
    ).toThrow('503')
  })
})

// ============================================
// 6. 缓存 + 业务逻辑集成
// ============================================

describe('缓存集成', () => {
  it('相同查询第二次命中缓存', () => {
    const cache = new Map<string, unknown>()
    const key = createCacheKey('getWeather', { city: '上海', date: '今天' })

    // 第一次：执行并缓存
    const first = getWeatherData('上海', '今天')
    setCache(cache, key, first)

    // 第二次：从缓存读取
    const cached = getFromCache(cache, key)
    expect(cached).toBeDefined()
    expect(cached).toEqual(first)
  })

  it('缓存值是对象时 !== undefined 判断正确', () => {
    const cache = new Map<string, unknown>()
    const key = createCacheKey('test', {})

    // 缓存空对象
    setCache(cache, key, {})
    const result = getFromCache(cache, key)
    expect(result !== undefined).toBe(true)
  })
})

// ============================================
// 7. 错误模拟 + 重试集成
// ============================================

describe('错误模拟 + 重试', () => {
  it('超时错误会触发重试', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount <= 2) {
        throw new Error('timeout: 网络请求超时')
      }
      return { data: 'ok' }
    }

    const result = await executeWithRetry(fn, { maxRetries: 3, delayMs: 10 })

    expect(result.result).toEqual({ data: 'ok' })
    expect(result.retries).toBe(2)
    expect(callCount).toBe(3)
  })

  it('5xx 错误会触发重试', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      if (callCount <= 1) {
        throw new Error('503: 服务暂时不可用')
      }
      return { data: 'ok' }
    }

    const result = await executeWithRetry(fn, { maxRetries: 3, delayMs: 10 })

    expect(result.result).toEqual({ data: 'ok' })
    expect(result.retries).toBe(1)
    expect(callCount).toBe(2)
  })

  it('业务数据不存在不会重试', async () => {
    let callCount = 0
    const fn = async () => {
      callCount++
      throw new Error('没有找到 火星 的天气数据')
    }

    const result = await executeWithRetry(fn, { maxRetries: 3, delayMs: 10 })

    expect(result.error).toBe('没有找到 火星 的天气数据')
    expect(result.retries).toBe(0)
    expect(callCount).toBe(1)
  })
})
