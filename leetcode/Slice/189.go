package main

import "fmt"

func rotate(nums []int, k int) []int {
	// （当前位置 i + 轮转位置 k）% 数组长度 n = 轮转后的位置
	ans := make([]int, len(nums))
	for i, num := range nums {
		ans[(i+k)%len(nums)] = num
	}
	copy(nums, ans)
	return ans
}

func main() {
	nums := []int{1, 2, 3, 4, 5, 6, 7}
	k := 3
	fmt.Println(rotate(nums, k))
}
