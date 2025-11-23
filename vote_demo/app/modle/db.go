package modle

import (
	"fmt"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// 数据库操作
// Conn 全局数据库连接对象
var Conn *gorm.DB

// Mysql 连接数据库 单例模式
func NewMysql() {
	// 连接数据库 用户名:密码@tcp(地址:端口)/数据库?参数=值
	my := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", "root", "258369", "192.168.194.209:3306", "vote")
	conn, err := gorm.Open(mysql.Open(my), &gorm.Config{})
	if err != nil {
		fmt.Println("数据库连接失败:", err)
		panic(err)
	}
	fmt.Println("数据库连接成功")
	Conn = conn
}

func Close() {
	db, _ := Conn.DB()
	db.Close()
}
