package logic

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"strconv"
	"time"

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

// GetVoteInfo godoc
// @Summary      获取投票信息
// @Description  获取投票信息
// @Tags         vote
// @Accept       json
// @Produce      json
// @Param        id   query      int  true  "vote ID"
// @Success      200  {object}  tools.ECode
// @Router       /vote [get]
func GetVoteInfo(ctx *gin.Context) {
	var id int64
	idStr := ctx.Query("id")
	id, _ = strconv.ParseInt(idStr, 10, 64)
	ret := model.GetVote(id)

	if ret.Vote.Id <= 0 {
		ctx.JSON(http.StatusNotFound, tools.ECode{})
		return
	}

	ctx.JSON(http.StatusOK, tools.ECode{
		Data: ret,
	})

}

func DoVote(ctx *gin.Context) {
	userIdStr, _ := ctx.Cookie("Id")
	voteIdStr, _ := ctx.GetPostForm("vote_id") // 获取表单中的 name="vote_id" 字段
	voteOpteIdStr, _ := ctx.GetPostFormArray("opt[]")

	userId, _ := strconv.ParseInt(userIdStr, 10, 64)
	voteId, _ := strconv.ParseInt(voteIdStr, 10, 64)

	old := model.GetVoteHistoryV1(ctx, userId, voteId)
	if len(old) > 0 {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    100010,
			Message: "您已投过票，不能重复投票",
		})
		return
	}

	opt := make([]int64, 0)
	for _, v := range voteOpteIdStr {
		optId, _ := strconv.ParseInt(v, 10, 64)
		opt = append(opt, optId)
	}

	model.DoVote(userId, voteId, opt)
	model.Rdb.Set(ctx, fmt.Sprintf("vote_opt_%d", voteId), "", 0)
	ctx.JSON(http.StatusOK, tools.ECode{
		Message: "投票完成",
	})
}

func ResultInfo(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "result.tmpl", nil)
}

func ResultVote(ctx *gin.Context) {
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

func Checkxyz(ctx *gin.Context) bool {
	// 获取ip 和 ua（user-agent）
	ip := ctx.ClientIP()
	ua := ctx.GetHeader("User-Agent")
	fmt.Println("ip:", ip, "ua:", ua)

	hash := md5.New()
	hash.Write([]byte(ip + ua))
	hashBytes := hash.Sum(nil) //
	hashString := hex.EncodeToString(hashBytes)

	flag, _ := model.Rdb.Get(ctx, "ban-"+hashString).Bool()
	if flag {
		return false
	}

	i, _ := model.Rdb.Get(ctx, "xyz-"+hashString).Int()
	if i > 5 {
		model.Rdb.SetEx(ctx, "ban-"+hashString, true, 30*time.Second) // （true标记被封禁）禁止访问30秒
		return false
	}

	model.Rdb.Incr(ctx, "xyz-"+hashString) // 访问次数+1
	model.Rdb.Expire(ctx, "xyz-"+hashString, 50*time.Second)

	return true
}

func GetCaptcha(ctx *gin.Context) {
	if !Checkxyz(ctx) {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    10006,
			Message: "您的访问频率过高，请稍后再试",
		})
		return
	}

	captcha, err := tools.CaptchaGenerate()
	if err != nil {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    10005,
			Message: err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, tools.ECode{
		Data: captcha,
	})
}
