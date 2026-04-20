package main

import "fmt"

func generate(numRows int) [][]int {
		// nums[n][i] = nums[n-1][i-1] + nums[n-1][i]
		// nums[n][0] = 1, nums[n][n-1] = 1
		nums := make([][]int, numRows)
		for i := 0; i < numRows; i++ {
			nums[i] = make([]int, i+1)
			nums[i][0] = 1
			nums[i][i] = 1
			for j := 1; j < i; j++ {
				nums[i][j] = nums[i-1][j-1] + nums[i-1][j]
			}
		}
		return nums
}

func main() {
	fmt.Println(generate(5))
}
