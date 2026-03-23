package main

import (
	"context"
	"fmt"

	"google.golang.org/grpc"
)

func LogInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
	fmt.Println("log start")
	resp, err = handler(ctx, req)
	fmt.Println("log end")
	return
}

func ErrorInterceptor(ctx context.Context, req any, info *grpc.UnaryServerInfo, handler grpc.UnaryHandler) (resp any, err error) {
	fmt.Println("error start")
	resp, err = handler(ctx, req)
	if err != nil {
		fmt.Println("error:", err)
	}
	fmt.Println("error end")
	return
}
