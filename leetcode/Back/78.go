package main

import "slices"

func subsets(nums []int) [][]int {
	// 条件 子集长度等于数组长度 停止
	n := len(nums)
	ans := make([][]int, 0, 1<<n) //2^n
	path := make([]int, 0, n)

	// nums[i]是否加入path
	var dfs func(int)
	dfs = func(i int) {
		if i == n {
			ans = append(ans, slices.Clone(path))
			return
		}

		// 不选nums[i]
		dfs(i + 1)

		path = append(path, nums[i])
		// 下一个数nums[i+1]选不选
		dfs(i + 1)
		path = path[:len(path)-1] // 回退
	}

	return ans
}
