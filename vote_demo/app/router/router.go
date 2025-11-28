package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/logic"
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/tools"
)

func NewRouter() {
	// 创建 Gin 引擎
	r := gin.Default()
	// 加载模板文件
	r.LoadHTMLGlob("app/view/*")
	// 路径操作

	{
		index := r.Group("")
		index.Use(checkUser)
		index.GET("/index", logic.Index)
		index.GET("/votes", logic.GetVotes)
		index.GET("/vote", logic.GetVoteInfo)
		index.POST("/vote", logic.DoVote)

		index.POST("/vote/add", logic.AddVote)
		index.GET("/vote/update", logic.UpdateVote)
		index.POST("/vote/del", logic.DelVote)

		index.GET("/result", logic.ResultInfo)
		index.GET("/result/info", logic.GetResultInfo)
	}
	r.GET("/", logic.Index)
	{
		// 登录页面

		r.GET("/login", logic.GetLogin)
		// 处理登录请求
		r.POST("/login", logic.DoLogin)
		r.GET("/logout", logic.Logout)
	}
	// 启动服务
	r.Run(":9999")
}

func checkUser(ctx *gin.Context) {
	var name string
	var id int64
	value := model.GetSession(ctx)

	if v, ok := value["name"]; ok {
		name = v.(string)
	}
	if v, ok := value["id"]; ok {
		id = v.(int64)
	}
	if name == "" || id == 0 {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    401,
			Message: "未登录或登录已过期，请重新登录",
		})
		ctx.Abort()
	}
	ctx.Next()
}
