package tools

import (
	"io"
	"os"

	"github.com/sirupsen/logrus"
)

var Logger *logrus.Entry

func NewLogger() {
	logStore := logrus.New()
	logStore.SetLevel(logrus.DebugLevel)

	w1 := os.Stdout                                                               // Info级别及以上日志输出到控制台
	w2, _ := os.OpenFile("./vote.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644) // Debug级别日志输出到文件

	// 设置不同级别的输出
	logStore.SetOutput(io.MultiWriter(w1, w2)) // 默认输出到文件

	logStore.SetFormatter(&logrus.TextFormatter{})

	Logger = logStore.WithFields(logrus.Fields{ // 便于在集中日志管理平台快速找到相关日志
		"name": "yllmis",
		"app":  "vote_demo",
	})

	// logStore.AddHook() // 出现非常严重错误时发送邮件通知管理员
}
