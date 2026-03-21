package main

import (
	"log"
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

func main() {
	client, err := rpc.Dial("tcp", "localhost:1234")
	if err != nil {
		log.Fatal("连接RPC服务器失败:", err)
	}
	defer client.Close()

	var (
		req  = GetUserReq{Id: "4"}
		resp GetUserResp
	)

	err = client.Call("UserServer.GetUser", req, &resp)
	if err != nil {
		log.Fatal("调用RPC方法失败:", err)
		return
	}
	log.Printf("获取到用户信息: %+v", resp)
}
