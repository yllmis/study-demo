package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/logic"
)

func NewRouter() {
	// 创建 Gin 引擎
	r := gin.Default()
	// 加载模板文件
	r.LoadHTMLGlob("app/view/*")
	// 路径操作
	index := r.Group("")
	index.Use(checkUser)
	index.GET("/index", logic.Index)
	// 登录页面
	r.GET("/", logic.Index)
	r.GET("/login", logic.GetLogin)
	// 处理登录请求
	r.POST("/login", logic.DoLogin)
	// 启动服务
	r.Run(":9999")
}

func checkUser(ctx *gin.Context) {
	name, err := ctx.Cookie("name")
	if err != nil || name == "" {
		ctx.Redirect(http.StatusFound, "/login")
	}
	ctx.Next()
}
