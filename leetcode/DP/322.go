package main

import "fmt"


func coinChange(coins []int, amount int) int {
    n := len(coins)
    memo := make([][]int,n)
    for i := range memo {
        memo[i] = make([]int, amount+1)
        for j := range memo[i] {
            memo[i][j] = -1
        }
    }
    // 完全背包问题
    // ans = min(dfs(i,j), dfs(i,j-coins[i]])+1)
    var dfs func(int,int) int
    dfs = func(i, j int) int { // i:第几个硬币 j：背包剩余量
        if j == 0 {
            return 0 
        }

        if j < 0 || i < 0 {
            return -1
        }

        p := &memo[i][j]
        if j < coins[i] {
            *p = dfs(i-1,j)
        }else {
            *p = min(dfs(i-1,j),dfs(i,j-coins[i])+1)
        }
        return *p
    }
    ans := dfs(n-1, amount)
    return ans 

}


func main() {
	coins := []int{1,2,5}
	amount := 11
	fmt.Println(coinChange(coins, amount))
}