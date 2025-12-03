package model

import (
	"fmt"
	"sync"
	"time"

	"gorm.io/gorm"
)

func GetVotes() []Vote {
	ret := make([]Vote, 0)
	if err := Conn.Table("vote").Find(&ret).Error; err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
	}
	return ret
}

func GetVote(id int64) VoteWithOpt {
	var ret Vote
	if err := Conn.Table("vote").Where("id = ?", id).First(&ret).Error; err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
	}

	opt := make([]VoteOpt, 0)
	if err := Conn.Table("vote_opt").Where("vote_id = ?", id).Find(&opt).Error; err != nil { //Mysql本身比较脆弱，所以不加外键，利用代码关联
		fmt.Printf("查询选项失败, err:%s\n", err.Error())
	}
	return VoteWithOpt{
		Vote: ret,
		Opt:  opt,
	}
}

// 原生sql实现
func GetVoteV1(id int64) VoteWithOpt {
	var ret Vote
	if err := Conn.Raw("select * from vote where id = ?", id).Scan(&ret).Error; err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
	}

	opt := make([]VoteOpt, 0)
	if err := Conn.Raw("select * from vote_opt where vote_id = ?", id).Scan(&opt).Error; err != nil {
		fmt.Printf("查询选项失败, err:%s\n", err.Error())
	}
	return VoteWithOpt{
		Vote: ret,
		Opt:  opt,
	}
}

// 预加载
func GetVoteV2(id int64) (*VoteWithOpt, error) {
	var ret VoteWithOpt

	//Opt  []VoteOpt
	err := Conn.Preload("Opt").Table("vote").Where("id = ?", id).First(&ret).Error // Opt[] 是vote结构体中的切片字段，Preload会自动关联查询
	if err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
		return nil, err
	}

	return &ret, nil
}

// Join查询
func GetVoteV3(id int64) (*VoteWithOpt, error) {
	var ret VoteWithOpt
	// select * from vote join vote_opt on vote.id = vote_opt.vote_id where vote.id = ?
	sql := "select vote.*,vote_opt.id as vid, vote_opt.name,vote_opt.count from vote join vote_opt on vote.id = vote_opt.vote_id where vote.id = ?"
	// err := Conn.Raw("select * from vote join vote_opt on vote.id = vote_opt.vote_id where vote.id = ?", id).Scan(&ret).Error // 这种方式无法正确映射到结构体中的切片字段

	// 解决办法
	//第一个 把ret 换成map
	//ret1 := make([]map[string]any, 0 )
	//err := Conn.Raw(sql, id).Scan(&ret1).Error
	//for a, a2 := range ret1 {
	//	再把 a a2 转义到 VoteWithOpt中

	// 第二个
	row, err := Conn.Raw(sql, id).Rows()

	if err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
		return nil, err
	}

	for row.Next() {
		tmp := make(map[string]any)
		_ = Conn.ScanRows(row, &tmp)

		if v, ok := tmp["id"]; ok {
			ret.Vote.Id = v.(int64)
		}

		//将map先转为 json 再转为 结构体，也可以写一个反射 直接实现。
		fmt.Printf("tmp:%+v\n", tmp)

	}

	return &ret, nil
}

// 并发模式 第一种
func GetVoteV4(id int64) (*VoteWithOpt, error) {
	var ret Vote

	ch := make(chan struct{}, 2) // 如果不这么做，这个函数主协程直接return了，协程无法进行

	go func() {

		if err := Conn.Raw("select * from vote where id = ?", id).Scan(&ret).Error; err != nil {
			fmt.Printf("查询失败, err:%s\n", err.Error())
		}
		ch <- struct{}{}
	}()

	opt := make([]VoteOpt, 0)
	go func() {
		if err1 := Conn.Raw("select * from vote_opt where vote_id = ?", id).Scan(&opt).Error; err1 != nil {
			fmt.Printf("查询选项失败, err:%s\n", err1.Error())
		}
		ch <- struct{}{}
	}()

	var count int
	for _ = range ch {
		count++
		if count >= 2 {
			break
		}
	}

	return &VoteWithOpt{
		Vote: ret,
		Opt:  opt,
	}, nil
}

// 并发模式 第二种 使用sync.WaitGroup
func GetVoteV5(id int64) (*VoteWithOpt, error) {
	var ret Vote

	wg := sync.WaitGroup{}

	wg.Add(1)
	go func() {
		defer wg.Done()

		if err := Conn.Raw("select * from vote where id = ?", id).Scan(&ret).Error; err != nil {
			fmt.Printf("查询失败, err:%s\n", err.Error())
		}

	}()

	opt := make([]VoteOpt, 0)
	wg.Add(1)
	go func() {
		defer wg.Done()

		if err1 := Conn.Raw("select * from vote_opt where vote_id = ?", id).Scan(&opt).Error; err1 != nil {
			fmt.Printf("查询选项失败, err:%s\n", err1.Error())
		}

	}()

	wg.Wait()

	return &VoteWithOpt{
		Vote: ret,
		Opt:  opt,
	}, nil
}

func GetVoteByTitle(title string) Vote {
	var ret Vote
	if err := Conn.Table("vote").Where("title = ?", title).First(&ret).Error; err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
	}
	return ret
}

// 使用gorm中最常用的事务方法
func DoVote(userId int64, voteId int64, optIds []int64) bool {
	tx := Conn.Begin() // 开启事务
	// 记录用户投票行为
	var ret Vote
	if err := tx.Table("vote").Where("id = ?", voteId).First(&ret).Error; err != nil {
		fmt.Printf("查询失败, err:%s\n", err.Error())
		tx.Rollback()
		return false
	}

	// 更新选项投票数
	for _, value := range optIds {
		if err := tx.Table("vote_opt").Where("id = ?", value).UpdateColumn("count", gorm.Expr("count + ?", 1)).Error; err != nil {
			fmt.Printf("更新选项投票数失败, err:%s\n", err.Error())
			tx.Rollback()
			return false
		}
		user := VoteOptUser{
			UserId:     userId,
			VoteId:     voteId,
			VoteOptId:  value,
			CreateTime: time.Now(),
		}
		_ = tx.Create(&user).Error // 记录用户投票选项 记录到vote_opt_user表中
	}
	tx.Commit()
	return true
}

// 匿名函数 事务方法 好处：代码更简洁，自动提交或回滚
func DoVoteV2(userId int64, voteId int64, optIds []int64) bool {
	if err := Conn.Transaction(func(tx *gorm.DB) error {
		// 记录用户投票行为
		var ret Vote
		if err := tx.Table("vote").Where("id = ?", userId).First(&ret).Error; err != nil {
			fmt.Printf("查询失败, err:%s\n", err.Error())
			return err
		}

		// 更新选项投票数
		for _, value := range optIds {
			if err := Conn.Table("vote_opt").Where("id = ?", value).UpdateColumn("count", gorm.Expr("count + ?", 1)).Error; err != nil {
				fmt.Printf("更新选项投票数失败, err:%s\n", err.Error())
				return err
			}
			user := VoteOptUser{
				UserId:     userId,
				VoteId:     voteId,
				VoteOptId:  value,
				CreateTime: time.Now(),
			}
			_ = Conn.Create(&user).Error // 记录用户投票选项
		}
		return nil // 无错误则提交
	}); err != nil {
		return false
	}

	return true
}

// DoVoteV3 原生sql实现事务
func DoVoteV3(userId int64, voteId int64, optIds []int64) bool {
	if err := Conn.Transaction(func(tx *gorm.DB) error {
		// 记录用户投票行为
		var ret Vote
		if err := tx.Raw("select * from vote where id = ?", voteId).Scan(&ret).Error; err != nil {
			fmt.Printf("查询失败, err:%s\n", err.Error())
			tx.Rollback()
		}

		// 更新选项投票数
		for _, value := range optIds {
			if err := tx.Exec("update vote_opt set count = count + 1 where id = ? limit 1", value).Error; err != nil {
				fmt.Printf("更新选项投票数失败, err:%s\n", err.Error())
				tx.Rollback()
			}
			if err := tx.Exec("insert into vote_opt_user (user_id, vote_id, vote_opt_id, create_time) values (?, ?, ?, ?)",
				userId, voteId, value, time.Now()).Error; err != nil {
				fmt.Printf("记录用户投票选项失败, err:%s\n", err.Error())
				tx.Rollback()
			}
		}
		return nil // 无错误则提交
	}); err != nil {
		return false
	}

	return true
}

func AddVote(vote Vote, opt []VoteOpt) error {
	err := Conn.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&vote).Error; err != nil {
			return err
		}
		for _, voteOpt := range opt {
			voteOpt.VoteId = vote.Id
			if err := tx.Create(&voteOpt).Error; err != nil {
				return err
			}
		}
		return nil
	})
	return err
}

func UpdateVote(vote Vote, opt []VoteOpt) error {
	err := Conn.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&vote).Error; err != nil {
			return err
		}
		for _, voteOpt := range opt {

			if err := tx.Save(&voteOpt).Error; err != nil {
				return err
			}
		}
		return nil
	})
	return err
}

func DelVote(id int64) bool {
	if err := Conn.Transaction(func(tx *gorm.DB) error {
		if err := tx.Delete(&Vote{}, id).Error; err != nil {
			return err
		}
		// 找到投票选项和投票选项和user相关表的记录，根据vote_id删除
		if err := tx.Where("vote_id = ?", id).Delete(&VoteOpt{}).Error; err != nil {
			return err
		}
		if err := tx.Where("vote_id = ?", id).Delete(&VoteOptUser{}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		fmt.Printf("删除投票失败, err:%s\n", err.Error())
		return false
	}
	return true
}

// DelVoteV1 原生sql实现
func DelVoteV1(id int64) bool {

	if err := Conn.Transaction(func(tx *gorm.DB) error {

		if err := tx.Exec("delete from vote wher id =? limit 1", id).Error; err != nil {
			return err
		}
		// 找到投票选项和投票选项和user相关表的记录，根据vote_id删除

		if err := tx.Exec("delete from vote_opt where vote_id = ?", id).Error; err != nil {
			return err
		}

		if err := tx.Exec("delete from vote_oppt_user where vote_id = ?", id).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		fmt.Printf("删除投票失败, err:%s\n", err.Error())
		return false
	}
	return true
}

// 获取用户投票记录
func GetVoteHistory(userId, voteId int64) []VoteOptUser {
	ret := make([]VoteOptUser, 0)
	if err := Conn.Table("vote_opt_user").Where("user_id = ? AND vote_id = ?", userId, voteId).Find(&ret).Error; err != nil {
		fmt.Printf("查询用户投票记录失败, err:%s\n", err.Error())
	}
	return ret
}

func EndVote() {
	votes := make([]Vote, 0)
	if err := Conn.Table("vote").Where("status = ?", 1).Find(&votes).Error; err != nil {
		return
	}

	now := time.Now().Unix()
	for _, vote := range votes {
		if vote.Time+vote.CreateTime.Unix() <= now {
			// 投票结束，更新状态
			if err := Conn.Table("vote").Where("id = ?", vote.Id).Update("status", 0).Error; err != nil {
				fmt.Printf("更新投票状态失败, err:%s\n", err.Error())
			}
		}
	}
}

// EndVoteV1 原生sql
func EndVoteV1() {
	votes := make([]Vote, 0)

	if err := Conn.Raw("select * from vote where status = ?", 1).Scan(&votes).Error; err != nil {
		return
	}

	now := time.Now().Unix()
	for _, vote := range votes {
		if vote.Time+vote.CreateTime.Unix() <= now {
			// 投票结束，更新状态

			if err := Conn.Exec("update vote set status = 0 where id = ? limit 1", vote.Id).Error; err != nil {
				fmt.Printf("更新投票状态失败, err:%s\n", err.Error())
			}
		}
	}
}
