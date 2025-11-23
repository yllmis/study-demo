package app

import (
	"github.com/vote_demo/app/modle"
	"github.com/vote_demo/app/router"
)

func Strat() {
	modle.NewMysql()
	defer func() {
		modle.Close()
	}()

	router.NewRouter()
}
