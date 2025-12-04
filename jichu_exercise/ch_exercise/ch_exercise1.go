package chexercise

import (
	"fmt"
	"time"
)

func ChExercise1() {
	c := make(chan *int)
	a := 1
	go func() {
		time.Sleep(1 * time.Second)
		a = 2
		fmt.Println("goroutine:c:", *<-c)
	}()

	c <- &a
	time.Sleep(2 * time.Second)
}
func ChExerciseV1() {
	c := make(chan int, 1)
	a := 1
	go func() {
		time.Sleep(1 * time.Second)
		a = 2
		fmt.Println("goroutine:c:", <-c)
	}()

	c <- a
	time.Sleep(2 * time.Second)
}
