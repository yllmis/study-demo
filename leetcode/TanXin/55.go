package main

import "fmt"

func main() {
	nums := []int{2, 3, 1, 1, 4}
	fmt.Println(canJump(nums))
}

func canJump(nums []int) bool {
	// 1.下标大于当前最远距离不可到达,自身下标加自身表示能到达的最远距离

	maxTarget := nums[0]

	for i, num := range nums {
		// 在最大距离内将数组遍历完，则可以到达最后一个下标
		if i > maxTarget {
			return false
		}
		maxTarget = max(i+num, maxTarget)
	}
	return true

}
