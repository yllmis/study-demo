// ============================================
// TS 基础语法速览 — 从 Go 视角快速理解
// ============================================


// ==============================
// 1. type vs interface
// ==============================

// Go: type User struct { Name string; Age int }
// TS: 两种方式定义对象结构，功能大部分重叠

// interface — 最常用，专门描述"对象长什么样"
interface User {
  name: string
  age: number
  email?: string       // ? 表示可选字段，Go 里对应指针类型 *string
}

// type — 更通用，能描述 interface 做不到的事
type ID = string | number                    // 联合类型
type Status = "active" | "inactive"          // 字面量类型
type Point = { x: number; y: number }        // 也能描述对象

// 两者都能继承
interface Admin extends User {
  role: string
}

type AdminType = User & { role: string }     // type 用 & 交叉类型继承

// 生产中怎么选：
// 描述对象结构 → interface（可被 extends/implements）
// 联合类型、字面量、工具类型 → type


// ==============================
// 2. 函数参数和返回类型
// ==============================

// Go: func add(a int, b int) int { return a + b }
// TS:
function add(a: number, b: number): number {
  return a + b
}

// 箭头函数（ES6 语法，Go 没有对应）
const multiply = (a: number, b: number): number => a * b

// 可选参数 — Go 里没有，最接近的是传 struct 或 ...option
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`    // ?? 是空值合并，类似 Go 的 ||
}
greet("alice")              // "Hello, alice!"
greet("alice", "Hi")        // "Hi, alice!"

// 默认值
function createUser(name: string, role: string = "viewer"): User {
  return { name, age: 0 }
}

// 剩余参数 — 类似 Go 的 ...string
function log(level: string, ...messages: string[]): void {
  console.log(`[${level}]`, ...messages)
}


// ==============================
// 3. Union、可选字段、类型收窄
// ==============================

// Union（联合类型）— 一个变量可以是多种类型之一
let value: string | number = "hello"
value = 42  // OK

// 类型收窄 — 用了 union 之后必须先判断再使用
function process(input: string | number): string {
  if (typeof input === "string") {
    return input.toUpperCase()         // 这里 input 被收窄为 string
  }
  return input.toFixed(2)              // 这里被收窄为 number
}

// 可选字段 + 空值处理
interface Config {
  host: string
  port?: number       // 可选
  debug?: boolean     // 可选
}

function initConfig(config: Config): Required<Config> {
  // Required<T> 把所有可选字段变成必选
  return {
    host: config.host,
    port: config.port ?? 3000,          // 没传就用默认值 3000
    debug: config.debug ?? false,
  }
}

// in 操作符收窄
interface Fish { swim(): void }
interface Bird { fly(): void }

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    animal.swim()        // 收窄为 Fish
  } else {
    animal.fly()         // 收窄为 Bird
  }
}


// ==============================
// 4. Promise、async/await
// ==============================

// Go: func fetchData() (string, error)
// TS: 用 Promise 表示异步操作

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// async/await — 语法上类似 Go 的协程 + await
async function fetchUser(id: number): Promise<User> {
  // 模拟网络请求
  await delay(1000)
  return { name: "alice", age: 25 }
}

// 调用 async 函数
async function main() {
  const user = await fetchUser(1)
  console.log(user.name)
}

// Promise.all — 并发执行，类似 Go 的 sync.WaitGroup
async function fetchAll() {
  const [user1, user2] = await Promise.all([
    fetchUser(1),
    fetchUser(2),
  ])
  console.log(user1.name, user2.name)
}


// ==============================
// 5. try/catch — 错误处理
// ==============================

// Go: if err != nil { return err }
// TS: 用 try/catch，但没有强制检查错误（这是 TS 的缺点之一）

async function safeFetchUser(id: number): Promise<User | null> {
  try {
    const user = await fetchUser(id)
    return user
  } catch (error) {
    // error 的类型是 unknown，需要判断
    if (error instanceof Error) {
      console.error("请求失败:", error.message)
    }
    return null
  }
}

// 手动抛错
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("除数不能为零")    // Go 里返回 (int, error)
  }
  return a / b
}

// 自定义错误类型
class NotFoundError extends Error {
  constructor(resource: string, id: number) {
    super(`${resource} with id ${id} not found`)
    this.name = "NotFoundError"
  }
}

// 使用自定义错误
async function getUser(id: number): Promise<User> {
  const user = await fetchUser(id)
  if (!user) {
    throw new NotFoundError("User", id)
  }
  return user
}


// ==============================
// 6. 模块导入导出
// ==============================

// Go: import "fmt"  /  import mypkg "path/to/pkg"
// TS: 用 import/export，每个文件就是一个模块

// --- 导出 ---
// 命名导出（一个文件可以有多个）
export interface Product {
  id: number
  name: string
}

export function formatProduct(p: Product): string {
  return `#${p.id} ${p.name}`
}

export const MAX_RETRIES = 3

// 默认导出（一个文件只能有一个）
export default class ProductService {
  findAll(): Product[] {
    return []
  }
}

// --- 导入 ---
// import ProductService, { Product, formatProduct } from "./product"
// import type { Product } from "./product"   // 只导入类型，编译后消失


// ==============================
// 7. 泛型 — 基本用法
// ==============================

// Go: func Map[T any, U any](s []T, f func(T) U) []U
// TS: 用 <T> 声明类型参数

// 最简单的泛型函数
function identity<T>(value: T): T {
  return value
}
identity<string>("hello")   // 显式指定
identity(42)                // 自动推断为 number

// 泛型接口 — 模拟 Go 的通用数据结构
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

// 使用泛型接口
const userRes: ApiResponse<User> = {
  code: 200,
  message: "ok",
  data: { name: "alice", age: 25 },
}

const listRes: ApiResponse<User[]> = {
  code: 200,
  message: "ok",
  data: [{ name: "alice", age: 25 }],
}

// 泛型约束 — 类似 Go 的 interface 约束
interface HasId {
  id: number
}

function findById<T extends HasId>(items: T[], id: number): T | undefined {
  return items.find(item => item.id === id)
}

// 常见内置泛型工具类型（了解即可，不需要手写）
// Partial<User>    → 把所有字段变成可选：{ name?: string; age?: number }
// Required<User>   → 把所有字段变成必选
// Pick<User, "name"> → 只取指定字段：{ name: string }
// Omit<User, "age">  → 排除指定字段：{ name: string }
// Record<string, User> → 键值对：{ [key: string]: User }
