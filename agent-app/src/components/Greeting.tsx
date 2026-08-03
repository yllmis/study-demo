// ============================================
// 第1课：组件、Props
// ============================================

// Go 里没有组件概念，最接近的是 struct + 方法
// Go:
//   type Greeting struct { Name string }
//   func (g Greeting) Render() string { return "Hello, " + g.Name }

// TS: 组件就是一个返回 JSX 的函数
// Props 就是函数参数，用 interface 定义

interface GreetingProps {
  name: string
  age?: number          // 可选 props
  children?: React.ReactNode  // 插槽，类似 Vue 的 slot
}

// 最简单的组件 — 接收 props，返回 JSX
export function Greeting({ name, age, children }: GreetingProps) {
  return (
    <div className="border p-4 rounded">
      <h2>Hello, {name}!</h2>
      {age && <p>Age: {age}</p>}
      {children}
    </div>
  )
}

// 默认导出 vs 命名导出
// 命名导出：import { Greeting } from "./Greeting"
// 默认导出：import Greeting from "./Greeting"
// 一个文件可以有多个命名导出，但只能有一个默认导出
