package logic

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/tools"
)

func AddVote(ctx *gin.Context) {
	idStr := ctx.Query("title")
	optStr, _ := ctx.GetPostFormArray("opts_name[]")

	// 构建结构体
	vote := model.Vote{
		Title:      idStr,
		Type:       0,
		Status:     0,
		CreateTime: time.Now(),
	}

	opt := make([]model.VoteOpt, 0)
	// 构建选项
	for _, name := range optStr {
		voteOpt := model.VoteOpt{
			Name:       name,
			CreateTime: time.Now(),
		}
		opt = append(opt, voteOpt)
	}

	// 调用数据库方法添加入库
	if err := model.AddVote(vote, opt); err != nil {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    10006,
			Message: err.Error(),
		})
		return
	}
	ctx.JSON(http.StatusOK, tools.OK)
	return
}

func UpdateVote(ctx *gin.Context) {
	idStr := ctx.Query("title")
	optStr, _ := ctx.GetPostFormArray("opts_name[]")

	// 构建结构体
	vote := model.Vote{
		Title:      idStr,
		Type:       0,
		Status:     0,
		CreateTime: time.Now(),
	}

	opt := make([]model.VoteOpt, 0)
	// 构建选项
	for _, name := range optStr {
		voteOpt := model.VoteOpt{
			Name:       name,
			CreateTime: time.Now(),
		}
		opt = append(opt, voteOpt)
	}

	// 调用数据库方法添加入库
	if err := model.UpdateVote(vote, opt); err != nil {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    10006,
			Message: err.Error(),
		})
		return
	}
	ctx.JSON(http.StatusOK, tools.OK)
	return
}

// 获取选项id，删除投票
func DelVote(ctx *gin.Context) {
	var id int64
	idStr := ctx.Query("id")
	id, _ = strconv.ParseInt(idStr, 10, 64)
	if err := model.DelVote(id); err != true {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code: 10006,
		})
		return
	}
}
