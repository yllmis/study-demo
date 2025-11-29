package logic

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"net/http"
	"regexp"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/tools"
	_ "golang.org/x/crypto/bcrypt"
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
	if err := ctx.ShouldBind(&user); err != nil { // ShouldBind 会根据请求头自动选择合适的绑定器
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Message: err.Error(), //有风险
		})
	}

	// 查询数据库验证用户
	ret := model.GetUser(user.Name)
	if ret.Id < 1 || ret.Password != encrypt2(user.Password) {
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
	return
}

func Logout(ctx *gin.Context) {
	_ = model.FlushSession(ctx)
	// 删除cookie
	// ctx.SetCookie("name", "", 3600, "/", "", true, false)
	// ctx.SetCookie("Id", "", 3600, "/", "", true, false)
	ctx.Redirect(http.StatusFound, "/login")
}

type CUser struct {
	Name      string `json:"name"`
	Password  string `json:"password"`
	Password2 string `json:"password_2"`
}

func CreateUser(ctx *gin.Context) {
	var user CUser

	if err := ctx.ShouldBind(&user); err != nil {
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Code:    10001,
			Message: err.Error(),
		})
		return
	}

	if user.Name == "" || user.Password == "" || user.Password2 == "" {
		ctx.JSON(http.StatusBadRequest, tools.ParamErr)
		return
	}

	if user.Password != user.Password2 {
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Code:    10003,
			Message: "两次输入的密码不一致",
		})
		return
	}

	lenName := len(user.Name)
	lenPassword := len(user.Password)
	if lenName < 8 || lenName > 16 || lenPassword < 8 || lenPassword > 16 {
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Code:    10005,
			Message: "用户名或密码长度要在8~16之间",
		})
		return
	}

	// 密码不能全为数字 数字+小写字母+大写字母
	regex := regexp.MustCompile(`^[0-9]+$`)
	if regex.MatchString(user.Password) {
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Code:    10006,
			Message: "密码不能全为数字",
		})
		return
	}

	// 有大风险，并发安全
	if oldUser := model.GetUser(user.Name); oldUser.Id > 0 {
		ctx.JSON(http.StatusBadRequest, tools.ECode{
			Code:    10004,
			Message: "用户已存在",
		})
		return
	}

	newUser := model.User{
		Name:       user.Name,
		Password:   encrypt2(user.Password),
		CreateTime: time.Now(),
		UpdateTime: time.Now(),
	}

	if err := model.CreateUser(&newUser); err != nil {
		ctx.JSON(http.StatusOK, tools.ECode{
			Code:    10007,
			Message: "创建用户失败，请稍后重试",
		})
		return
	}

	ctx.JSON(http.StatusOK, tools.OK)
}

// 有风险，密码太简单会被哈希碰撞破解
func encrypt(pwd string) string {
	hash := md5.New()
	hash.Write([]byte(pwd))
	hashBytes := hash.Sum(nil)
	hashString := hex.EncodeToString(hashBytes)
	fmt.Println("MD5加密后的字符串为：", hashString)
	return hashString
}

func encrypt2(pwd string) string {
	newPwd := pwd + "yllmis" // 不能随便起，也不能暴露
	hash := md5.New()
	hash.Write([]byte(newPwd))
	hashBytes := hash.Sum(nil)
	hashString := hex.EncodeToString(hashBytes)
	return hashString
}

// // 利用包算法
// func encryptV2(pwd string) string {
// 	//基于Blowfish 实现加密。简单快速，但有安全风险
// 	//golang.org/x/crypto/ 中有大量的加密算法
// 	newPwd, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
// 	if err != nil {
// 		fmt.Println("密码加密失败：", err)
// 		return ""
// 	}
// 	newPwdStr := string(newPwd)
// 	fmt.Printf("加密后的密码：%s\n", newPwdStr)
// 	return newPwdStr
// }
