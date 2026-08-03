package heap

type HeapInt []int

func (h HeapInt) Len() int {
	return len(h)
}

func (h HeapInt) Less(i, j int) bool {
	return h[i] < h[j] // < 是小顶堆，> 是大顶堆
}

func (h HeapInt) Swap(i, j int) {
	h[i], h[j] = h[j], h[i]
}

// 入堆
func (h *HeapInt) Push(x interface{}) {
	*h = append(*h, x.(int))
}

// 出堆
func (h *HeapInt) Pop() any {
	old := *h
	n := len(old)
	x := old[n-1]
	*h = old[0 : n-1]
	return x
}
