package main

import (
	"context"
	"exercise/rpc_exercise/grpc/proto/user"
	"log"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	client, err := grpc.Dial("127.0.0.1:1234", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatal("连接失败", err)
	}

	defer client.Close()

	c := user.NewUserClient(client)

	resp, err := c.GetUser(context.Background(), &user.GetUserReq{Id: "1"})
	if err != nil {
		log.Fatal("调用失败", err)
	}

	log.Printf("用户信息: id=%s, name=%s, phone=%s", resp.Id, resp.Name, resp.Phone)
}
