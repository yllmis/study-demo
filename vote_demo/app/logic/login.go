package logic

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/tools"
)

// User 用户结构体
type User struct {
	Name     string `json:"name" form:"name"`         // 注意这里的 tag 要和表单中input的 name 属性对应
	Password string `json:"password" form:"password"` // 注意，若password首字母小写，则无法绑定到，因为反射只能访问导出字段
}

func GetLogin(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "login.tmpl", nil)
}

func DoLogin(ctx *gin.Context) {
	var user User
	if err := ctx.ShouldBind(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Message: err.Error(), //有风险
		})
	}

	// 查询数据库验证用户
	ret := model.GetUser(user.Name)
	if ret.Id < 1 || ret.Password != user.Password {
		ctx.JSON(http.StatusBadGateway, tools.UserErr)
		return
	}

	// 登录成功
	// ctx.SetCookie("name", user.Name, 3600, "/", "", true, false)
	// ctx.SetCookie("Id", fmt.Sprint(ret.Id), 3600, "/", "", true, false)

	_ = model.SetSession(ctx, ret.Name, ret.Id)

	ctx.JSON(http.StatusOK, tools.ECode{
		Message: "登录成功",
	})
}

func Logout(ctx *gin.Context) {
	_ = model.FlushSession(ctx)
	// 删除cookie
	// ctx.SetCookie("name", "", 3600, "/", "", true, false)
	// ctx.SetCookie("Id", "", 3600, "/", "", true, false)
	ctx.Redirect(http.StatusFound, "/login")
}
