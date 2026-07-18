package im

type Message struct {
	ConvID string
	Seq    int
	Ts     int64
	Text   string
}

// 1. 已经收到的消息 2.已读 3.拉取的消息数量
func PullOffline(store map[string][]Message, readSeq map[string]int, limit int) []Message {
	// 1. 获取未读
	var unread []Message
	for cid, msgs := range store {
		rs := readSeq[cid]
		for _, 

	}
}
