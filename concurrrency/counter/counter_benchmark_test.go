package counter

import "testing"

// BenchmarkCounters 对比 mutex/atomic/channel 三种实现的并发递增性能。
func BenchmarkCounters(b *testing.B) {
	benchCounter(b, "mutex", func() Counter {
		return NewMutexCounter()
	}, nil)

	benchCounter(b, "atomic", func() Counter {
		return NewAtomicCounter()
	}, nil)

	benchCounter(b, "channel", func() Counter {
		return NewChannelCounter()
	}, func(c Counter) {
		c.(*ChannelCounter).Close()
	})
}

// benchCounter 抽取公共基准逻辑，保证三种实现测试条件一致。
func benchCounter(b *testing.B, name string, factory func() Counter, cleanup func(Counter)) {
	b.Run(name, func(b *testing.B) {
		counter := factory()
		if cleanup != nil {
			defer cleanup(counter)
		}

		b.ReportAllocs()
		b.ResetTimer()
		b.RunParallel(func(pb *testing.PB) {
			for pb.Next() {
				counter.Inc()
			}
		})
		b.StopTimer()
		_ = counter.Read()
	})
}
