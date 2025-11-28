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

func GetVotes(ctx *gin.Context) {
	ret := model.GetVotes()
	ctx.JSON(http.StatusOK, tools.ECode{
		Data: ret,
	})
}

func GetVoteInfo(ctx *gin.Context) {
	var id int64
	idStr := ctx.Query("id")
	id, _ = strconv.ParseInt(idStr, 10, 64)
	ret := model.GetVote(id)
	ctx.JSON(http.StatusOK, tools.ECode{
		Data: ret,
	})
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

func ResultInfo(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "result.tmpl", nil)
}

func GetResultInfo(ctx *gin.Context) {
	var id int64
	idStr := ctx.Query("id")
	id, _ = strconv.ParseInt(idStr, 10, 64)
	// 获取投票信息，组装结果数据
	ret := model.GetVote(id)
	data := model.ResultData{
		Title: ret.Vote.Title,
	}

	for _, v := range ret.Opt {
		data.Count = data.Count + v.Count
		tmp := model.ResultVoteOpt{
			Name:  v.Name,
			Count: v.Count,
		}
		data.Opt = append(data.Opt, &tmp)
	}

	ctx.JSON(http.StatusOK, tools.ECode{ // 网页中按F12找到网络->Fetch->选中对应的接口->响应
		Data: data,
	})

}
