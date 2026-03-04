package main

import "math"

func maxProfit(prices []int) int {
	var profit, min int
	min = math.MaxInt32
	// 1.从第一天开始比较，低了切换，高了算利润
	for _, price := range prices {
		if min > price {
			min = price
		} else {
			profit = max(profit, (price - min))
		}
	}
	return profit
}

func main() {
	prices := []int{7, 1, 5, 3, 6, 4}
	println(maxProfit(prices))
}
