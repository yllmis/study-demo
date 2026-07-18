package main

import "slices"

func merge(intervals [][]int) (ans [][]int) {
	// 1. 先按每个数组的头元素从小到大进行排序
	slices.SortFunc(intervals, func(p, q []int) int { return p[0] - q[0] })

	for _, p := range intervals {
		n := len(ans)

		if n > 0 && p[0] < ans[n-1][1] {
			ans[n-1][1] = max(ans[n-1][1], p[1])
		} else {
			ans = append(ans, p)
		}
	}
	return ans
}
