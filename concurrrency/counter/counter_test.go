package counter

import (
	"runtime"
	"sync"
	"testing"
	"time"
)

// counterCase 用统一入口驱动三种实现的同构测试。
type counterCase struct {
	name    string
	new     func() Counter
	cleanup func(Counter)
}

// cases 返回所有被测实现。
func cases() []counterCase {
	return []counterCase{
		{
			name: "mutex",
			new: func() Counter {
				return NewMutexCounter()
			},
		},
		{
			name: "atomic",
			new: func() Counter {
				return NewAtomicCounter()
			},
		},
		{
			name: "channel",
			new: func() Counter {
				return NewChannelCounter()
			},
			cleanup: func(c Counter) {
				c.(*ChannelCounter).Close()
			},
		},
	}
}

// TestConcurrentInc1000 验证 1000 个 goroutine 并发递增后的最终结果。
func TestConcurrentInc1000(t *testing.T) {
	const goroutines = 1000
	const perG = 100
	const want = int64(goroutines * perG)

	for _, tc := range cases() {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			counter := tc.new()
			if tc.cleanup != nil {
				defer tc.cleanup(counter)
			}

			var wg sync.WaitGroup
			wg.Add(goroutines)
			for i := 0; i < goroutines; i++ {
				go func() {
					defer wg.Done()
					for j := 0; j < perG; j++ {
						counter.Inc()
					}
				}()
			}

			wg.Wait()
			if got := counter.Read(); got != want {
				t.Fatalf("final value mismatch: got=%d want=%d", got, want)
			}
		})
	}
}

// TestReadVisibility 在写入进行中持续读取，检查读值单调不倒退，
// 并在写入完成后验证最终值，覆盖常见内存可见性与竞态场景。
func TestReadVisibility(t *testing.T) {
	const target = 20_000
	const timeout = 2 * time.Second

	for _, tc := range cases() {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			counter := tc.new()
			if tc.cleanup != nil {
				defer tc.cleanup(counter)
			}

			done := make(chan struct{})
			go func() {
				for i := 0; i < target; i++ {
					counter.Inc()
				}
				close(done)
			}()

			deadline := time.After(timeout)
			var last int64
			for {
				select {
				case <-done:
					if got := counter.Read(); got != target {
						t.Fatalf("final value mismatch: got=%d want=%d", got, target)
					}
					return
				case <-deadline:
					t.Fatalf("read visibility timeout, last=%d", last)
				default:
					v := counter.Read()
					if v < last {
						t.Fatalf("non-monotonic read: last=%d current=%d", last, v)
					}
					if v > target {
						t.Fatalf("unexpected value: got=%d target=%d", v, target)
					}
					last = v
					runtime.Gosched()
				}
			}
		})
	}
}
