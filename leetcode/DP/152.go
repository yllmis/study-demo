package main

import "slices"

func maxProduct(nums []int) (ans int) {
	// 1. max(ans, 前缀积*nums[i+1])
	n := len(nums)
	numsMax := make([]int, n)
	numsMin := make([]int, n)
	numsMax[0], numsMin[0] = nums[0], nums[0]
	for i := 1; i < n; i++ {
		x := nums[i]
		numsMax[i] = max(numsMax[i-1]*x, numsMin[i-1]*x, x)
		numsMin[i] = min(numsMax[i-1]*x, numsMin[i-1]*x)

	}
	return slices.Max(numsMax)
}
