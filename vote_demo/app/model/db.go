package model

import (
	"context"
	"fmt"

	"github.com/rbcervilla/redisstore/v9"
	"github.com/redis/go-redis/v9"
	"github.com/spf13/viper"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// 数据库操作
// Conn 全局数据库连接对象
var Conn *gorm.DB

// Mysql 连接数据库 单例模式
func NewMysql() {
	fmt.Println("正在尝试连接数据库...")
	// 连接数据库 用户名:密码@tcp(地址:端口)/数据库?参数=值
	// my := fmt.Sprintf("%s:%s@tcp(%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", "root", "258369", "10.117.201.209:3306", "vote")
	dsn := viper.GetString("mysql.dsn")
	conn, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("数据库连接失败:", err)
		panic(err)
	}
	fmt.Println("数据库连接成功")
	Conn = conn
}

// Redis
var Rdb *redis.Client

func NewRdb() {
	redisAddr := viper.GetString("redis.addr")
	redisPwd := viper.GetString("redis.password")
	redisDB := viper.GetInt("redis.db")

	rdb := redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: redisPwd, // no password set
		DB:       redisDB,  // use default DB
	})

	Rdb = rdb
	// 初始化session
	store, _ = redisstore.NewRedisStore(context.TODO(), Rdb)
	return
}

func Close() {
	db, _ := Conn.DB()
	db.Close()
	Rdb.Close()
}
