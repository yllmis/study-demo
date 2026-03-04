package counter

import "sync"

// MutexCounter 使用互斥锁保护共享计数值。
// 读写都在同一把锁下完成，保证数据一致性与内存可见性。
type MutexCounter struct {
	mu sync.Mutex
	v  int64
}

// NewMutexCounter 创建一个初始值为 0 的互斥锁计数器。
func NewMutexCounter() *MutexCounter {
	return &MutexCounter{}
}

// Inc 在锁保护下递增，避免并发写冲突。
func (c *MutexCounter) Inc() {
	c.mu.Lock()
	c.v++
	c.mu.Unlock()
}

// Read 在锁保护下读取，保证读到的是一致快照。
func (c *MutexCounter) Read() int64 {
	c.mu.Lock()
	v := c.v
	c.mu.Unlock()
	return v
}

var _ Counter = (*MutexCounter)(nil)
