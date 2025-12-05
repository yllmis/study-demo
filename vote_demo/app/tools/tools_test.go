package tools

import (
	"fmt"
	"testing"
)

func TestGetUUID(t *testing.T) {
	GetUUID()
}

func TestGetUid(t *testing.T) {
	go func() {
		id := GetUid()
		fmt.Printf("id1:%d\n", id)
	}()

	go func() {
		id2 := GetUid()
		fmt.Printf("id2:%d\n", id2)
	}()

	go func() {
		id3 := GetUid()
		fmt.Printf("id3:%d\n", id3)
	}()

}

func TestSetJwt(t *testing.T) {
	token, _ := SetJwt("admin")
	fmt.Println("token:", token)
}

func TestParseJwt(t *testing.T) {
	tokenStr := "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InVzZXJuYW1lIiwiaXNzIjoieWxsbWlzIiwiZXhwIjoxNzY0OTUyNzQ3LCJuYmYiOjE3NjQ5NDY3MzcsImlhdCI6MTc2NDk0Njc0N30.-hC9Kx_3UvyyCo9DW7ktzKh8GwuJ2XOIm79NIH67m9g"
	claims, err := ParseJwt(tokenStr)
	if err != nil {
		fmt.Println("err:", err)
		return
	}
	fmt.Println("claims:", claims)

}
