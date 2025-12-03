package tools

import (
	"fmt"

	"github.com/bwmarrin/snowflake"
	"github.com/google/uuid"
)

var snowNode *snowflake.Node // 生成全局节点，防止重复, 并发时会出现重复问题

func GetUUID() string {
	id := uuid.New() // 默认v4版本 基于随机数
	fmt.Printf("uuid:%s, version:%d\n", id.String(), id.Version())
	return id.String()

}

func GetUid() int64 {
	if snowNode == nil {
		snowNode, _ = snowflake.NewNode(1) //根据时间戳生成唯一ID
	}

	return snowNode.Generate().Int64()
}
