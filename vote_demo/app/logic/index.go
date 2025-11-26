package logic

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/tools"
)

func Index(ctx *gin.Context) {
	ret := model.GetVotes()
	ctx.HTML(http.StatusOK, "index.tmpl", gin.H{"vote": ret})
}

func GetVoteInfo(ctx *gin.Context) {
	var id int64
	idStr := ctx.Query("id")
	id, _ = strconv.ParseInt(idStr, 10, 64)
	ret := model.GetVote(id)
	ctx.HTML(http.StatusOK, "vote.tmpl", gin.H{"vote": ret})
}

func DoVote(ctx *gin.Context) {
	userIdStr, _ := ctx.Cookie("Id")
	voteIdStr, _ := ctx.GetPostForm("vote_id")
	voteOpteIdStr, _ := ctx.GetPostFormArray("opt[]")

	userId, _ := strconv.ParseInt(userIdStr, 10, 64)
	voteId, _ := strconv.ParseInt(voteIdStr, 10, 64)
	opt := make([]int64, 0)
	for _, v := range voteOpteIdStr {
		optId, _ := strconv.ParseInt(v, 10, 64)
		opt = append(opt, optId)
	}

	model.DoVote(userId, voteId, opt)
	ctx.JSON(http.StatusOK, tools.ECode{
		Message: "投票完成",
	})
}
