package main

import "fmt"

func main() {
	s := make([]int, 0, 3)
	s = append(s, 1, 2, 3)
	modify(s)
	fmt.Println(s)
}

func modify(arr []int) {
	arr = append(arr, 4)
	arr[0] = 999
}
