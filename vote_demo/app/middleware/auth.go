package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/vote_demo/app/tools"
)

func JWTAuth() gin.HandlerFunc {
	return func(ctx *gin.Context) {
		var tokenStr string
		// 从Header中获取token
		authHeader := ctx.Request.Header.Get("Authorization")
		if len(strings.Split(authHeader, " ")) == 2 {
			tokenStr = strings.Split(authHeader, " ")[1]
		}

		// 2. 【新增】如果 Header 没有，尝试从 Cookie 取 (给浏览器页面跳转用)
		if tokenStr == "" {
			tokenStr, _ = ctx.Cookie("token")
		}

		// 3. 如果都没有，才报未登录
		if tokenStr == "" {
			// 如果是浏览器访问页面，最好重定向回登录页，而不是返回 JSON
			// c.Redirect(302, "/login")
			ctx.JSON(http.StatusUnauthorized, tools.NotLogin)
			ctx.Abort()
			return
		}

		// 验证token，提取token

		// 验证token的有效性

		claims, err := tools.ParseJwt(tokenStr)
		if err != nil {
			ctx.JSON(http.StatusUnauthorized, tools.ECode{
				Code:    1003,
				Message: "token无效",
			})
			ctx.Abort()
			return
		}

		// 将用户信息存入上下文

		ctx.Set("username", claims.Username)

		ctx.Next()

	}
}
