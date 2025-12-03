package model

// import (
// 	"fmt"

// 	"github.com/gin-gonic/gin"
// 	"github.com/gorilla/sessions"
// )

// session 存在本机上，消耗本机内存
// var store = sessions.NewCookieStore([]byte("简易投票系统"))
// var sessionName = "session-name"

// func GetSession(c *gin.Context) map[interface{}]interface{} {
// 	session, _ := store.Get(c.Request, sessionName)
// 	fmt.Printf("session:%+v\n", session.Values)
// 	return session.Values
// }

// func SetSession(c *gin.Context, name string, id int64) error {
// 	session, _ := store.Get(c.Request, sessionName)
// 	session.Values["name"] = name
// 	session.Values["id"] = id
// 	return session.Save(c.Request, c.Writer)
// }

// func FlushSession(c *gin.Context) error {
// 	session, _ := store.Get(c.Request, sessionName)
// 	fmt.Printf("session : %+v\n", session.Values)
// 	session.Values["name"] = ""
// 	session.Values["id"] = int64(0)
// 	return session.Save(c.Request, c.Writer)
// }
