package logic

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/modle"
)

// User 用户结构体
type User struct {
	Name     string `json:"name" form:"username"`     // 注意这里的 tag 要和表单中input的 name 属性对应
	Password string `json:"password" form:"password"` // 注意，若password首字母小写，则无法绑定到，因为反射只能访问导出字段
}

func GetLogin(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "login.tmpl", nil)
}

func DoLogin(ctx *gin.Context) {
	var user User
	if err := ctx.ShouldBind(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"message": "参数绑定失败"})
	}

	// 查询数据库验证用户
	ret := modle.GetUser(user.Name)
	if ret.Id < 1 || ret.Password != user.Password {
		ctx.JSON(http.StatusBadGateway, gin.H{"message": "用户名或密码错误"})
		return
	}

	// 登录成功
	ctx.SetCookie("name", user.Name, 3600, "/", "", true, false)

	ctx.JSON(http.StatusOK, ret)
}

func Index(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "index.tmpl", nil)
}
