package counter

import (
	"sync"
	"sync/atomic"
)

// incReq 表示一次递增请求；done 用于让调用方知道该次递增已真正生效。
type incReq struct {
	done chan struct{}
}

// ChannelCounter 采用“单协程持有状态”模型：
// - 写入通过 incCh 串行化到后台协程
// - 读取通过 readCh 请求-应答
// - closeCh/doneCh 负责优雅关闭
// - value 保存最近一次值，供关闭后快速读取
// - closed/once 用于幂等关闭与快速失败
// 该模型避免了共享内存上的显式锁竞争。
type ChannelCounter struct {
	incCh   chan incReq
	readCh  chan chan int64
	closeCh chan struct{}
	doneCh  chan struct{}

	once   sync.Once
	closed atomic.Bool
	value  atomic.Int64
}

// NewChannelCounter 创建并启动后台状态协程。
func NewChannelCounter() *ChannelCounter {
	c := &ChannelCounter{
		incCh:   make(chan incReq),
		readCh:  make(chan chan int64),
		closeCh: make(chan struct{}),
		doneCh:  make(chan struct{}),
	}

	go c.loop()
	return c
}

// loop 是唯一读写实际计数值 v 的协程，因此无数据竞争。
func (c *ChannelCounter) loop() {
	defer close(c.doneCh)

	var v int64
	for {
		select {
		case req := <-c.incCh:
			v++
			c.value.Store(v)
			close(req.done)
		case replyCh := <-c.readCh:
			replyCh <- v
		case <-c.closeCh:
			return
		}
	}
}

// Inc 发送递增请求并等待后台协程确认，保证函数返回时递增已经可见。
func (c *ChannelCounter) Inc() {
	if c.closed.Load() {
		return
	}

	req := incReq{done: make(chan struct{})}
	select {
	case c.incCh <- req:
		select {
		case <-req.done:
		case <-c.doneCh:
		}
	case <-c.doneCh:
	}
}

// Read 在未关闭时走请求-应答，关闭后直接读取最后快照。
func (c *ChannelCounter) Read() int64 {
	if c.closed.Load() {
		return c.value.Load()
	}

	replyCh := make(chan int64, 1)
	select {
	case c.readCh <- replyCh:
		select {
		case v := <-replyCh:
			return v
		case <-c.doneCh:
			return c.value.Load()
		}
	case <-c.doneCh:
		return c.value.Load()
	}
}

// Close 幂等关闭，并等待后台协程退出，避免 goroutine 泄漏。
func (c *ChannelCounter) Close() {
	c.once.Do(func() {
		c.closed.Store(true)
		close(c.closeCh)
		<-c.doneCh
	})
}

var _ Counter = (*ChannelCounter)(nil)
