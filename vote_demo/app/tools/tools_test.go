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
