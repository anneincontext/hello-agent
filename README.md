# Hello Agent

50 行跑通一个最小 AI agent —— 配套小册《从零打造一个 AI Agent CLI》的开篇示例。

代码本身只有 50 行，但展示了 agent 最核心的形态：**模型 + 工具 + 多轮对话循环**。装好依赖、配好 `ANTHROPIC_API_KEY` 就能在终端里和它聊天，让它读你本地的文件、回答问题。

## 特点

- 🚀 **50 行代码可运行**：装依赖即可，无任何配置魔法
- 🛠️ **支持工具调用**：内置一个 `readFile` 工具，模型可以主动读你的文件
- 🔄 **多轮对话**：维护对话历史，模型记得之前聊过什么
- 📡 **流式输出**：模型生成的文本即时打印在终端，不需要等整段完成

## 快速开始

### 1. 装依赖

```bash
git clone <this-repo-url>
cd hello-agent
npm install
```

需要 Node.js ≥ 20.19。

### 2. 配 API Key

需要一个 DeepSeek API Key——国内开发者首选，注册即送 token，价格便宜，访问无障碍。在 [platform.deepseek.com](https://platform.deepseek.com) 注册后，在「API Keys」页面创建一个 key（格式 `sk-...`）。三种配法任选其一：

**方式 A：永久写到用户环境变量（推荐）**

```bash
# macOS / Linux (bash / zsh)
echo 'export DEEPSEEK_API_KEY=sk-...' >> ~/.zshrc && source ~/.zshrc

# Windows PowerShell（用户级，永久）
[Environment]::SetEnvironmentVariable('DEEPSEEK_API_KEY','sk-...','User')
```

**方式 B：当前 shell 临时设置**

```bash
# macOS / Linux
export DEEPSEEK_API_KEY=sk-...

# Windows PowerShell
$env:DEEPSEEK_API_KEY = "sk-..."
```

**方式 C：`.env` 文件**

```bash
cp .env.example .env
# 编辑 .env 填入你的 key
```

### 3. 启动

```bash
npm start
# 等同于：npx tsx hello-agent.ts
```

## 使用示例

```text
你: 帮我看看 package.json 里有哪些依赖
助手:
  [调用 readFile({"path":"package.json"})]
  [返回 312 字节]
助手: 你的 package.json 里有以下依赖：
- ai
- @ai-sdk/anthropic
- zod
...

你: 这个项目的 main 字段是什么？
助手: 你的 package.json 里没有显式声明 `main` 字段——npm 会默认 fallback 到 `index.js`。

你: exit
```

模型会自己决定要不要调 `readFile`、调几次、什么时候开始回答——这就是 agent 的核心循环。

<!-- TODO: 录一段演示 gif 放在 docs/demo.gif，然后用 ![演示](docs/demo.gif) 引用 -->

## 这 50 行做了什么

| 代码片段 | 做的事 |
|---|---|
| `tool({ description, inputSchema, execute })` | 定义一个工具，告诉模型这工具叫什么、参数是啥、执行函数怎么跑 |
| `messages: [{role, content}, ...]` | 维护对话历史，每轮把用户输入和模型回复追加进去 |
| `streamText({ model, messages, tools, stopWhen })` | 把对话历史 + 工具集发给模型，让 SDK 帮你跑多轮 tool-call → tool-result 循环 |
| `stopWhen: stepCountIs(10)` | 最多 10 轮工具调用就收手，避免 doom-loop |
| `for await (const chunk of result.fullStream)` | 流式消费——每个 chunk 是文本片段、工具调用、或工具结果 |
| `result.response.messages` | 拿到 SDK 累积的所有新消息（文本 + tool-call + tool-result），追加进对话历史 |

整个程序就是一个 `while` 循环：用户输入 → 加进 messages → `streamText` → 流式打印 → 模型 + 工具调用都跑完 → 继续。这就是 **agent loop** 最朴素的形态。

## 这 50 行没做什么

| 缺什么 | 后果 |
|---|---|
| **没有终端 UI** | 只能裸 readline；多行输入、上下移动、@ 文件补全都没有 |
| **没有权限确认** | 如果加上 shell 工具，模型想跑命令直接就跑——没有"这操作我同意一下"这一步 |
| **没有错误恢复** | 网络抖一下、模型返回 malformed tool input、长输出撑爆 context——任何一处崩，整个对话就死了 |
| **只支持 DeepSeek** | 改用 Anthropic / OpenAI / Gemini 都要改代码 |
| **只有一个工具** | 改文件、跑 shell、grep、列目录、抓网页这些都没有 |
| **不会上下文压缩** | 多轮聊下来 messages 越积越长，几十轮就把 200K 上下文窗口塞满 |
| **没有 prompt caching** | 每一轮系统提示词、对话历史都全量重算 token |
| **没有 loop guard** | 模型万一陷入死循环，唯一的 brake 是 `stepCountIs(10)` 这个粗粒度上限 |

完整、生产级的实现见配套项目 [X-Code CLI](https://github.com/woai3c/x-code-cli)，对应小册《从零打造一个 AI Agent CLI》会一项项把这些短板填上。

## License

MIT
