package main

import (
	"fmt"
	"slices"
)

func combinationSum(candidates []int, target int) (ans [][]int) {
	// 选？不选？
	path := []int{}
	var dfs func(int, int) // i: 当前考虑的数的下标 lev: 还剩多少需要凑
	dfs = func(i int, lev int) {
		if lev == 0 {
			ans = append(ans, slices.Clone(path))
			return
		}

		if i == len(candidates) || lev < 0 {
			return
		}

		// 不选
		dfs(i+1, lev)

		// 选
		path = append(path, candidates[i])
		dfs(i, lev-candidates[i])
		path = path[:len(path)-1]

	}

	dfs(0, target)
	return
}

func main() {
	fmt.Println(combinationSum([]int{2, 3, 6, 7}, 7))
}
