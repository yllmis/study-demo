package modle

import (
	"fmt"
	"time"
)

// User 用户结构体
type User struct {
	Id         int64     `gorm:"column:id;NOT NULL"`
	Name       string    `gorm:"column:name;default:NULL"`
	Password   string    `gorm:"column:password;default:NULL"`
	CreateTime time.Time `gorm:"column:create_time;default:NULL"`
	UpdateTime time.Time `gorm:"column:update_time;default:NULL"`
}

func GetUser(name string) *User {
	var ret User
	if err := Conn.Table("user").Where("name = ?", name).Find(&ret).Error; err != nil {
		fmt.Printf("err:%s", err.Error())
	}
	return &ret
}
