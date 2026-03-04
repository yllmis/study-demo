package counter

// Counter 定义统一接口：递增并读取当前值。
type Counter interface {
	Inc()
	Read() int64
}
