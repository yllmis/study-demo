package model

import (
	"context"
	"testing"
)

func TestGetVoteHistory(t *testing.T) {
	NewMysql()
	NewRdb()
	GetVoteHistoryV1(context.TODO(), 3, 3)

}
