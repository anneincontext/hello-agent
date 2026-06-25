# Hello Agent

语言：[English](README.md) | 中文

说明：这个项目是根据 [woai3c/hello-agent.git](https://github.com/woai3c/hello-agent.git) 改成的 OpenAI 版本。非常感谢对方的 `hello-agent` 项目，它很适合用来学习最小 AI agent 的实现方式。

一个精简的终端 AI agent，核心代码都在 `hello-agent.ts` 里。

代码刻意保持小而清楚，但展示了 agent 最核心的形态：**模型 + system prompt + 工具 + 多轮对话循环**。装好依赖、配好 `OPENAI_API_KEY` 就能在终端里和它聊天，让它读你本地的文件、回答问题。

## 特点

- 🚀 **代码足够小，适合学习**：整个 agent 都在 `hello-agent.ts` 里
- 🛠️ **支持工具调用**：内置一个 `readFile` 工具，模型可以主动读你的文件
- 🔄 **多轮对话**：维护对话历史，模型记得之前聊过什么
- 📡 **流式输出**：模型生成的文本即时打印在终端，不需要等整段完成
- 🧭 **终端过程清晰**：角色用 `<User>` / `<Agent>`，过程用 `[model]`、`[tool-call]`、`[tool-result]`、`[done]`

## 快速开始

### 1. 装依赖

```bash
git clone https://github.com/anneincontext/hello-agent
cd hello-agent
npm install
```

需要 Node.js >= 20.19。

### 2. 配 API Key

需要一个 OpenAI API Key。在 [platform.openai.com/api-keys](https://platform.openai.com/api-keys) 创建一个 key（格式 `sk-...`）。三种配法任选其一：

```bash
cp .env.example .env
# 编辑 .env 填入你的 key
```

### 3. 启动

```bash
npm start
```

## 使用示例

```text
<User> Help me inspect the dependencies in package.json.
[model] sending messages and tools...

[tool-call] readFile({"path":"package.json"})
[tool-result] readFile returned 537 bytes

<Agent> Here is what I see in your package.json:

Summary
- Runtime: Node >=20.19.0
- Deps:
  - @ai-sdk/openai ^3.0.74
  - ai ^6.0.0
  - zod ^3.25.0
...

<User> What is the main field for this project?
[model] sending messages and tools...

<Agent> This package.json does not declare a `main` field. For npm packages,
Node would fall back to `index.js` by default.

<User> exit
[system] goodbye
```

`system` prompt 会告诉模型：它是运行在本地的 CLI agent。用户问到 `package.json` 这类本地文本文件时，模型可以直接调用 `readFile`，不用让用户粘贴文件内容。

## 这份代码做了什么

| 代码片段                                                     | 做的事                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `tool({ description, inputSchema, execute })`                | 定义 `readFile` 工具，告诉模型这工具叫什么、参数是啥、执行函数怎么跑          |
| `system`                                                     | 告诉模型它运行在本地 CLI 里，并引导它用 `readFile` 读取本地文本文件           |
| `messages: [{ role, content }, ...]`                         | 维护对话历史，每轮把用户输入和模型回复追加进去                                |
| `streamText({ model, system, tools, messages, stopWhen })`   | 把 prompt、对话历史和工具集发给模型，让 SDK 跑 tool-call 到 tool-result 循环  |
| `for await (const chunk of result.fullStream)`               | 流式消费每一步：文本片段、工具调用、工具结果和工具错误                        |
| `result.response.messages`                                   | 拿到 SDK 累积的所有新消息（文本、tool-call、tool-result），追加进对话历史     |

整个程序就是一个 `while` 循环：用户输入，加入 `messages`，调用 `streamText`，流式打印，等模型和工具调用都跑完，然后继续。这就是 **agent loop** 最朴素的形态。

## License

MIT
