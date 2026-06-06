package main

import (
	"flag"
	"fmt"
)

// Celsius 摄氏度类型
type Celsius float64

// Fahrenheit 华氏度类型
type Fahrenheit float64

// Kelvin 开尔文类型（虽然本例可以直接用 float64，但为类型安全单独定义）
type Kelvin float64

// 温度转换常量
const (
	AbsoluteZeroC Celsius = -273.15
)

// 转换函数
func CToF(c Celsius) Fahrenheit { return Fahrenheit(c*9/5 + 32) }
func FToC(f Fahrenheit) Celsius { return Celsius((f - 32) * 5 / 9) }
func CToK(c Celsius) Kelvin     { return Kelvin(c - AbsoluteZeroC) }
func KToC(k Kelvin) Celsius     { return Celsius(k) + AbsoluteZeroC }

// 实现 flag.Value 接口的包装类型
type celsiusFlag struct{ Celsius }

// 核心改进：Set 方法现在支持 "C", "°C", "F", "°F", "K"
func (f *celsiusFlag) Set(s string) error {
	var value float64
	var unit string

	// 使用 Sscanf 自动解析数值和后续字符串，简洁且无需手动处理单位位置
	// 注意：Sscanf 会忽略数值与单位之间的空格，所以输入 "100C", "100 C", "100°C" 均可
	fmt.Sscanf(s, "%f%s", &value, &unit)

	switch unit {
	case "C", "°C": // 摄氏度
		f.Celsius = Celsius(value)
		return nil
	case "F", "°F": // 华氏度
		f.Celsius = FToC(Fahrenheit(value))
		return nil
	case "K": // 开尔文（新增）
		f.Celsius = KToC(Kelvin(value))
		return nil
	}
	return fmt.Errorf("invalid temperature %q", s)
}

// Celsius.String 方法（可选，用于美化输出）
func (c Celsius) String() string {
	return fmt.Sprintf("%.2f°C", c)
}

// 提供给外部使用的 CelsiusFlag 函数，用法类似于 flag.String
func CelsiusFlag(name string, value Celsius, usage string) *Celsius {
	f := celsiusFlag{value}
	flag.Var(&f, name, usage)
	return &f.Celsius
}

func main() {
	// 使用示例
	temp := CelsiusFlag("temp", 20.0, "temperature in Celsius, Fahrenheit, or Kelvin (e.g., -temp=100C, -temp=212F, -temp=373.15K)")
	flag.Parse()
	fmt.Printf("Parsed temperature: %v\n", *temp)
	fmt.Printf("In Fahrenheit: %.2f°F\n", CToF(*temp))
	fmt.Printf("In Kelvin: %.2fK\n", CToK(*temp))
}
