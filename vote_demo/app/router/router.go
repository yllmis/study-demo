package router

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/logic"
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/tools"

	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/vote_demo/docs"
)

func NewRouter() {
	// 创建 Gin 引擎
	r := gin.Default()
	// 加载模板文件
	r.LoadHTMLGlob("app/view/*")

	// 路径操作
	r.GET("/redis", func(ctx *gin.Context) {
		s := model.GetVoteCachae(ctx, 1)
		fmt.Printf("redis获取到的值为：%+v\n", s)
	})

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	index := r.Group("")
	index.Use(checkUser)

	{

		index.GET("/vote", logic.GetVoteInfo)

		index.POST("/vote/add", logic.AddVote)
		index.POST("/vote/update", logic.UpdateVote)
		index.POST("/vote/del", logic.DelVote)

		index.GET("/result", logic.ResultInfo)
		index.GET("/result/info", logic.ResultVote)
	}
	// 利用restful风格设计路由
	{
		// 读操作
		index.GET("/index", logic.Index)
		index.GET("/votes", logic.GetVotes)

		index.POST("/vote", logic.AddVote)
		index.PUT("/vote", logic.UpdateVote)
		index.DELETE("/vote", logic.DelVote)

		index.GET("/vote/result", logic.ResultVote)

		index.POST("do_vote", logic.DoVote)

	}

	r.GET("/", logic.Index)
	{
		// 登录页面

		r.GET("/login", logic.GetLogin)
		// 处理登录请求
		r.POST("/login", logic.DoLogin)
		r.GET("/logout", logic.Logout)

		r.POST("user/create", logic.CreateUser)
	}

	//验证码
	{
		r.GET("/captcha", logic.GetCaptcha)

		r.POST("/captcha/verify", func(context *gin.Context) {
			var param tools.CaptchaData
			if err := context.ShouldBind(&param); err != nil {
				context.JSON(http.StatusOK, tools.ParamErr)
				return
			}

			fmt.Printf("参数为：%+v", param)
			if !tools.CaptchaVerify(param) {
				context.JSON(http.StatusOK, tools.ECode{
					Code:    10008,
					Message: "验证失败",
				})
				return
			}
			context.JSON(http.StatusOK, tools.OK)
		})
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
		ctx.JSON(http.StatusUnauthorized, tools.NotLogin)
		ctx.Abort()
	}
	ctx.Next()
}
