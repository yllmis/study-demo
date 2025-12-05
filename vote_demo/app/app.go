package app

import (
	"github.com/vote_demo/app/model"
	"github.com/vote_demo/app/router"
	"github.com/vote_demo/app/tools"
)

func Strat() {
	tools.InitConfig()

	model.NewMysql()

	model.NewRdb()
	defer func() {
		model.Close()
	}()

	tools.NewLogger()

	router.NewRouter()
}
