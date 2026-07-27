package main

import "fmt"

var dir = [][]int{{0, 1}, {1, 0}, {0, -1}, {-1, 0}} // 右，下，左，上

func spiralOrder(matrix [][]int) []int {
	m, n := len(matrix), len(matrix[0])
	i, j, d := 0, 0, 0
	ans := make([]int, m*n)
	for k := range ans {
		ans[k] = matrix[i][j]
		matrix[i][j] = 101
		// 预测并判断下一个位置
		x := i + dir[d][0]
		y := j + dir[d][1]
		if x >= m || y >= n || x < 0 || y < 0 || matrix[x][y] == 101 {
			d = (d + 1) % 4
		}
		i += dir[d][0]
		j += dir[d][1]
	}
	return ans
}

func main() {
	matrix := [][]int{{1, 2, 3}, {4, 5, 6}, {7, 8, 9}}
	result := spiralOrder(matrix)
	fmt.Println(result)
}
