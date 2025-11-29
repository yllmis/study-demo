package model

import "time"

// 放数据库表结构体

// VoteOptUser
type VoteOptUser struct {
	Id         int64     `gorm:"column:id;primary_key;AUTO_INCREMENT;NOT NULL"`
	UserId     int64     `gorm:"column:user_id;default:NULL"`
	VoteId     int64     `gorm:"column:vote_id;default:NULL"`
	VoteOptId  int64     `gorm:"column:vote_opt_id;default:NULL"`
	CreateTime time.Time `gorm:"column:create_time;default:NULL"`
}

// TableName 表名
func (v *VoteOptUser) TableName() string {
	return "vote_opt_user"
}

// VoteOpt
type VoteOpt struct {
	Id         int64     `gorm:"column:id;primary_key;AUTO_INCREMENT;NOT NULL"`
	Name       string    `gorm:"column:name;default:NULL"`
	VoteId     int64     `gorm:"column:vote_id;default:NULL"`
	Count      int64     `gorm:"column:count;default:NULL"`
	CreateTime time.Time `gorm:"column:create_time;default:NULL"`
	UpdateTime time.Time `gorm:"column:update_time;default:NULL"`
}

// TableName 表名
func (v *VoteOpt) TableName() string {
	return "vote_opt"
}

// Vote
type Vote struct {
	Id         int64     `gorm:"column:id;primary_key;AUTO_INCREMENT;NOT NULL"`
	Title      string    `gorm:"column:title;default:NULL"`
	Type       int32     `gorm:"column:type;default:NULL;comment:'0单选1多选'"`
	Status     int32     `gorm:"column:status;default:NULL;comment:'0正常1超时'"`
	Time       int64     `gorm:"column:time;default:NULL;comment:'有效时长'"`
	UserId     int64     `gorm:"column:user_id;default:NULL;comment:'创建人'"`
	CreateTime time.Time `gorm:"column:create_time;default:NULL"`
	UpdateTime time.Time `gorm:"column:update_time;default:NULL"`
}

// TableName 表名
func (v *Vote) TableName() string {
	return "vote"
}

// User 用户结构体
type User struct {
	Id         int64     `gorm:"column:id;primary_key;AUTO_INCREMENT;NOT NULL"`
	Name       string    `gorm:"column:name;default:NULL"`
	Password   string    `gorm:"column:password;default:NULL"`
	CreateTime time.Time `gorm:"column:create_time;default:NULL"`
	UpdateTime time.Time `gorm:"column:update_time;default:NULL"`
}

func (u *User) TableName() string {
	return "user"
}

type VoteWithOpts struct {
	Vote Vote
	Opt  []VoteOpt
}

type ResultData struct {
	Title string
	Count int64
	Opt   []*ResultVoteOpt
}

type ResultVoteOpt struct {
	Name  string
	Count int64
}
