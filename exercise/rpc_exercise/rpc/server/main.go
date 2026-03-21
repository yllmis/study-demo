package main

import (
	"errors"
	"log"
	"net"
	"net/rpc"
)

type (
	GetUserReq struct {
		Id string `json:"id"`
	}

	GetUserResp struct {
		Id    string `json:"id"`
		Name  string `json:"name"`
		Phone string `json:"phone"`
	}
)

type UserServer struct{}

// UserServer.GetUser
func (*UserServer) GetUser(req GetUserReq, resp *GetUserResp) error {
	if u, ok := users[req.Id]; ok {
		*resp = GetUserResp{
			Id:    u.Id,
			Name:  u.Name,
			Phone: u.Phone,
		}
		return nil
	}
	return errors.New("没有找到用户")
}

func main() {
	userServer := new(UserServer)

	// 注册RPC服务
	rpc.Register(userServer)

	listener, err := net.Listen("tcp", ":1234")
	if err != nil {
		log.Fatal("监听端口失败:", err)
	}
	log.Println("RPC服务器已启动，监听端口1234...")

	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Fatal("接受连接失败:", err)
			continue
		}

		// 并发处理每个连接
		go rpc.ServeConn(conn)
	}

}
