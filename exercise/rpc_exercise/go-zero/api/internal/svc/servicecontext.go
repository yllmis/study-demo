// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package svc

import (
	"exercise.com/go-zero/api/internal/config"
	"exercise.com/go-zero/api/internal/middleware"
	"exercise.com/go-zero/rpc/userclient"
	"github.com/zeromicro/go-zero/rest"
	"github.com/zeromicro/go-zero/zrpc"
)

type ServiceContext struct {
	Config config.Config

	userclient.User

	LoginVerification rest.Middleware
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config: c,

		User: userclient.NewUser(zrpc.MustNewClient(c.UserRpc)),

		LoginVerification: middleware.NewLoginVerificationMiddleware().Handle,
	}

}
