package main

import (
	"fmt"
	"sync"
	"time"
)

type Task func()

type ThreadPool struct {
	workers   int            // 工作线程数量
	taskQueue chan Task      // 任务队列
	wg        sync.WaitGroup // 用于等待所有任务完成
	quit      chan struct{}
}

func NewThreadPool(workers int, queueSize int) *ThreadPool {
	return &ThreadPool{
		workers:   workers,
		taskQueue: make(chan Task, queueSize),
		quit:      make(chan struct{}),
	}
}

func (t *ThreadPool) Start() {
	for i := 0; i < t.workers; i++ {
		go t.worker(i)
	}
}

func (t *ThreadPool) worker(id int) {
	for {
		select {
		case task, ok := <-t.taskQueue:
			if !ok {
				return // 任务队列已关闭，退出工作线程
			}
			fmt.Printf("Worker %d 开始执行\n", id)
			task()
			fmt.Printf("Worker %d 完成执行\n", id)

		case <-t.quit:
			return
		}
	}
}

func (t *ThreadPool) Submit(task Task) {
	t.wg.Add(1)
	t.taskQueue <- func() {
		defer t.wg.Done()
		task()
	}
}

func (t *ThreadPool) Stop() {
	close(t.taskQueue)
	t.wg.Wait() // 等待所有任务完成
	close(t.quit)
}

func main() {
	pool := NewThreadPool(3, 10)
	pool.Start()

	for i := 0; i < 10; i++ {
		taskId := i
		pool.Submit(func() {
			fmt.Printf("执行任务 %d， 执行时间 %s\n", taskId, time.Now().Format("15:04:05"))
			time.Sleep(1 * time.Second) // 模拟任务执行时间
		})

	}
	pool.Stop()
	fmt.Println("所有任务已完成，线程池已停止")
}
