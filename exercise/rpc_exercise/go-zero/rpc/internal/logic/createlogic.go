package logic

import (
	"context"

	"exercise.com/go-zero/models"
	"exercise.com/go-zero/rpc/internal/svc"
	"exercise.com/go-zero/rpc/user"

	"github.com/zeromicro/go-zero/core/logx"
)

type CreateLogic struct {
	ctx    context.Context
	svcCtx *svc.ServiceContext
	logx.Logger
}

func NewCreateLogic(ctx context.Context, svcCtx *svc.ServiceContext) *CreateLogic {
	return &CreateLogic{
		ctx:    ctx,
		svcCtx: svcCtx,
		Logger: logx.WithContext(ctx),
	}
}

func (l *CreateLogic) Create(in *user.CreateReq) (*user.CreateResp, error) {

	_, err := l.svcCtx.UserModel.Insert(l.ctx, &models.Users{
		Id:    in.Id,
		Name:  in.Name,
		Phone: in.Phone,
	})

	return &user.CreateResp{}, err
}
