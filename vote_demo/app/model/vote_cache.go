package model

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

func GetVoteCachae(ctx context.Context, id int64) VoteWithOpt {
	var ret VoteWithOpt
	key := fmt.Sprintf("vote_cache_%d", id)
	voteStr, err := Rdb.Get(ctx, key).Result()
	if err == nil || len(voteStr) > 0 {
		_ = json.Unmarshal([]byte(voteStr), &ret)
		return ret
	}
	fmt.Printf("err:%s", err.Error())
	ret = GetVote(id)
	if ret.Vote.Id > 0 {
		s, _ := json.Marshal(ret)
		err1 := Rdb.Set(ctx, key, s, 600*time.Second).Err()
		if err1 != nil {
			fmt.Printf("set cache err:%s", err1.Error())
		}
	}
	return ret

}

func GetVoteHistoryV1(ctx context.Context, voteId, userId int64) []VoteOptUser {
	ret := make([]VoteOptUser, 0)

	//先查询redis缓存
	k := fmt.Sprintf("vote_user-%d-%d", userId, voteId)
	str, _ := Rdb.Get(ctx, k).Result()
	if len(str) > 0 {
		fmt.Println("从缓存获取用户投票记录")
		_ = json.Unmarshal([]byte(str), &ret)
		return ret
	}

	//缓存没有查询数据库
	fmt.Println("从数据库获取用户投票记录")
	if err := Conn.Table("vote_opt_user").Where("user_id = ? AND vote_id = ?", userId, voteId).Find(&ret).Error; err != nil {
		fmt.Printf("查询用户投票记录失败, err:%s\n", err.Error())
	}

	if len(ret) > 0 {
		retStr, _ := json.Marshal(ret)
		err := Rdb.Set(ctx, k, retStr, 3600*time.Second).Err()
		if err != nil {
			fmt.Printf("设置用户投票记录缓存失败, err:%s\n", err.Error())
		}
	}

	return ret
}
