// ============================================
// 第1课：基础类型 — Go → TypeScript 对照
// ============================================

// --- 1. 基本类型声明 ---
// Go:   var name string = "hello"
// Go:   age := 25  (短变量声明，编译器推断类型)
// TS:   let myName: string = "hello"
// TS:   let age = 25  (类型推断，等价于 Go 的 :=)

let myName: string = "hello"
let age = 25  // TS 自动推断为 number
let active = true  // 推断为 boolean

// TS 特有：any — 关掉类型检查，尽量别用
let dangerous: any = "could be anything"
dangerous = 42  // 不报错，但失去了类型保护


// --- 2. 数组 ---
// Go:   nums := []int{1, 2, 3}
// TS:   let nums: number[] = [1, 2, 3]
// TS 另一种写法：let nums: Array<number> = [1, 2, 3]  (泛型语法)

let nums: number[] = [1, 2, 3]
let names: string[] = ["alice", "bob"]

// TS 特有：元组 (tuple) — 固定长度和类型的数组
// Go 没有直接对应，最接近的是 struct { First string; Second number }
let pair: [string, number] = ["age", 25]
// pair = [25, "age"]  // 报错！类型顺序不对


// --- 3. 对象字面量 vs Go struct ---
// Go:
//   type User struct {
//       Name string
//       Age  int
//   }
//   u := User{Name: "alice", Age: 25}
//
// TS: 用 interface 定义结构（下一课详细讲），这里先用内联类型

let user: { name: string; age: number } = {
  name: "alice",
  age: 25,
}
// user.email = "x@y.com"  // 报错！类型上没有 email


// --- 4. 联合类型 (Union Types) — Go 没有的概念 ---
// Go: 一个变量只能是单一类型
// TS: 一个变量可以是多种类型之一

let id: string | number
id = "abc"  // OK
id = 123    // OK
// id = true  // 报错！boolean 不在联合类型中

// 类型收窄 (Type Narrowing) — 用了联合类型后必须先判断再使用
function printId(id: string | number) {
  if (typeof id === "string") {
    // 这个分支里 id 被收窄为 string
    console.log(id.toUpperCase())
  } else {
    // 这个分支里 id 被收窄为 number
    console.log(id.toFixed(2))
  }
}


// --- 5. 字面量类型 (Literal Types) ---
// Go: const 可以限定值，但类型系统不支持
// TS: 类型可以是具体的值

type Direction = "up" | "down" | "left" | "right"
let dir: Direction = "up"
// dir = "forward"  // 报错！不在字面量类型中

type StatusCode = 200 | 301 | 404 | 500
let code: StatusCode = 200


// --- 6. 枚举 (Enum) ---
// Go: 用 const + iota 模拟
// TS: 原生支持 enum

enum Color {
  Red = "RED",
  Green = "GREEN",
  Blue = "BLUE",
}
let c: Color = Color.Red
console.log(c)  // "RED"


// --- 7. 类型断言 (Type Assertion) ---
// Go: 类型断言是 value.(Type)，运行时检查
// TS: 类型断言是编译时的，不产生运行时检查

let someValue: unknown = "this is a string"

// 写法一：as 语法（推荐）
let strLen1 = (someValue as string).length

// 写法二：尖括号语法（JSX 中不能用）
let strLen2 = (<string>someValue).length


// --- 练习题 ---
// TODO: 1. 声明一个元组 [boolean, string, number]，赋值并打印
// TODO: 2. 用联合类型写一个函数，接受 string | number，返回字符串长度或数字的位数
// TODO: 3. 定义一个枚举 Season，包含四个季节，写一个函数返回对应的中文名

let pairex: [boolean, string, number] = [true, "hello", 42]

function getLength(num: string | number): number {
  if (typeof num === "string") {
    return num.length
  } else {
    return num.toString().length
  }
}

enum Season {
  Spring = "春天",
  Summer = "夏天",
  Autumn = "秋天",
  Winter = "冬天",
}
function getSeasonName(season: Season): string {
  return season
}
