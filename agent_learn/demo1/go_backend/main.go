package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

// 定义核心数据结构：Message 是 Agent 通信的原子单位
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// 定义请求载荷：严格遵循大模型 API 的 JSON Schema
type ChatRequest struct {
	Model    string    `json:"model"`
	Messages []Message `json:"messages"`
}

// 定义响应载荷：按需反序列化，仅提取我们关心的 Content 字段
type ChatResponse struct {
	Choices []struct {
		Message Message `json:"message"`
	} `json:"choices"`
}

func main() {
	// 1. 提取系统环境变量中的鉴权密钥
	apiKey := os.Getenv("LLM_API_KEY")
	if apiKey == "" {
		fmt.Println("致命错误：未检测到 LLM_API_KEY 环境变量。")
		os.Exit(1)
	}

	// 定义目标端点 (此处以标准 OpenAI 协议端点_API为例)
	apiURL := "https://api.deepseek.com/chat/completions"

	// 2. 构建请求上下文 (Day 1 的核心目标)
	messages := []Message{
		{"system", "You are a highly logical and precise engineering assistant."},
		{"user", "请用一句话解释什么是 Go 语言的 Goroutine。"},
	}

	reqBody := ChatRequest{
		Model:    "deepseek-chat", // 可根据实际使用的模型替换，如 "deepseek-chat"
		Messages: messages,
	}

	// 3. 序列化：将 Go 结构体转化为在网络中传输的字节流
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		fmt.Printf("JSON 序列化失败: %v\n", err)
		os.Exit(1)
	}

	// 4. 构建 HTTP Request 实体
	req, err := http.NewRequest("POST", apiURL, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("HTTP 请求构建失败: %v\n", err)
		os.Exit(1)
	}

	// 注入请求头：声明内容类型与 Bearer 鉴权
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	// 5. 初始化 HTTP 客户端并执行请求 (设置 30 秒超时以防协程挂起)
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	fmt.Println("正在建立 TCP 连接并发送数据...")
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("网络请求失败 (请检查网络路由或代理配置): %v\n", err)
		os.Exit(1)
	}
	// 严格遵循工程规范：保证即使发生恐慌，TCP 句柄也会被释放
	defer resp.Body.Close()

	// 6. 读取并解析响应字节流
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("读取响应体流失败: %v\n", err)
		os.Exit(1)
	}

	// 状态码校验：非 200 状态通常意味着鉴权失败、欠费或并发限流
	if resp.StatusCode != http.StatusOK {
		fmt.Printf("API 返回异常状态码: %d\n响应明细: %s\n", resp.StatusCode, string(bodyBytes))
		os.Exit(1)
	}

	// 7. 反序列化：将 JSON 字节流还原为 Go 结构体
	var chatResp ChatResponse
	if err := json.Unmarshal(bodyBytes, &chatResp); err != nil {
		fmt.Printf("JSON 反序列化失败: %v\n", err)
		os.Exit(1)
	}

	// 8. 终端输出结果
	if len(chatResp.Choices) > 0 {
		fmt.Println("\n✅ 模型返回结果：")
		fmt.Printf("[%s]: %s\n", chatResp.Choices[0].Message.Role, chatResp.Choices[0].Message.Content)
	} else {
		fmt.Println("API 返回成功，但 Choices 数组为空。")
	}
}
