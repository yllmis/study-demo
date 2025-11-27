package model

import (
	"fmt"
	"testing"
	"time"
)

func TestGetVotes(t *testing.T) {
	NewMysql()

	r := GetVotes()
	fmt.Printf("ret: %+v", r)
	Close()
}

func TestGetVote(t *testing.T) {
	NewMysql()

	r := GetVote(1)
	fmt.Printf("ret: %+v", r)
	Close()
}

func TestDoVote(t *testing.T) {
	NewMysql()

	r := DoVote(2, 1, []int64{3, 4})
	fmt.Printf("ret: %+v", r)
	Close()
}

func TestAddVote(t *testing.T) {
	NewMysql()

	Vote := Vote{
		Title:      "测试投票",
		Type:       0,
		Status:     0,
		Time:       0,
		UserId:     0,
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	}
	opt := make([]VoteOpt, 0)
	opt = append(opt, VoteOpt{
		Name:       "测试选项一",
		VoteId:     0,
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	})
	opt = append(opt, VoteOpt{
		Name:       "测试选项二",
		VoteId:     0,
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	})

	r := AddVote(Vote, opt)
	fmt.Printf("ret: %+v", r)
	Close()
}

func TestUpdateVote(t *testing.T) {
	NewMysql()

	Vote := Vote{
		Id:         4,
		Title:      "测试投票-update",
		Type:       0,
		Status:     0,
		Time:       0,
		UserId:     0,
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	}
	opt := make([]VoteOpt, 0)
	opt = append(opt, VoteOpt{
		Name:       "测试选项一-update",
		VoteId:     0,
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	})
	opt = append(opt, VoteOpt{
		Name:       "测试选项二-update",
		VoteId:     0,
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	})

	r := UpdateVote(Vote, opt)
	fmt.Printf("ret: %+v", r)
	Close()
}
