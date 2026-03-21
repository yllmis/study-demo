package main

import (
	"context"
	"errors"
	"exercise/rpc_exercise/grpc/proto/user"
	"log"
	"net"

	"google.golang.org/grpc"
)

// type UserClient interface {
// 	GetUser(ctx context.Context, in *GetUserReq, opts ...grpc.CallOption) (*GetUserResp, error)
// }

type UserServer struct{}

func (*UserServer) GetUser(ctx context.Context, req *user.GetUserReq) (*user.GetUserResp, error) {
	if u, ok := users[req.Id]; ok {
		return &user.GetUserResp{
			Id:    u.Id,
			Name:  u.Name,
			Phone: u.Phone,
		}, nil
	}
	return nil, errors.New("没有找到用户")
}

func main() {
	listen, err := net.Listen("tcp", ":1234")
	if err != nil {
		log.Fatal("监听端口失败:", err)
	}

	s := grpc.NewServer()

	user.RegisterUserServer(s, new(UserServer))

	s.Serve(listen)

	log.Println("服务器已启动，监听端口1234")

}
