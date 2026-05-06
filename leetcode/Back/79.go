package main

var dirs = []struct{ x, y int }{{0, -1}, {0, 1}, {-1, 0}, {1, 0}}

func exist(board [][]byte, word string) bool {
	m, n := len(board), len(board[0])

	var dfs func(int, int, int) bool // x, y: 当前坐标 k: 已经匹配了多少个字符
	dfs = func(x, y, k int) bool {
		if board[x][y] != word[k] {
			return false
		}
		if k == len(word)-1 { // 成功
			return true
		}

		board[x][y] = 0 // 标记为访问过

		for _, dir := range dirs {
			newX, newY := x+dir.x, y+dir.y
			if newX >= 0 && newX < m && newY >= 0 && newY < n {
				if dfs(newX, newY, k+1) {
					return true
				}
			}
		}

		board[x][y] = word[k] // 回溯，恢复现场
		return false
	}

	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if dfs(i, j, 0) {
				return true
			}
		}
	}
	return false
}

func main() {
	println(exist([][]byte{
		[]byte("ABCE"),
		[]byte("SFCS"),
		[]byte("ADEE"),
	}, "SEE"))
}
