package counter

import "sync/atomic"

// AtomicCounter 使用原子操作维护计数值。
// 适合高并发下轻量递增与读取场景。
type AtomicCounter struct {
	v int64
}

// NewAtomicCounter 创建一个初始值为 0 的原子计数器。
func NewAtomicCounter() *AtomicCounter {
	return &AtomicCounter{}
}

// Inc 通过原子加法完成递增，不需要互斥锁。
func (c *AtomicCounter) Inc() {
	atomic.AddInt64(&c.v, 1)
}

// Read 通过原子加载读取最新可见值。
func (c *AtomicCounter) Read() int64 {
	return atomic.LoadInt64(&c.v)
}

var _ Counter = (*AtomicCounter)(nil)
