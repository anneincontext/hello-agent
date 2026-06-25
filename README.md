# Hello Agent

Language: English | [中文](README_CN.md)

This project is adapted from [woai3c/hello-agent.git](https://github.com/woai3c/hello-agent.git) as an OpenAI-based version. Many thanks to the original `hello-agent` project, which is a great resource for learning how a minimal AI agent works.

A minimal terminal AI agent in a small TypeScript file.

The code is intentionally compact, but it demonstrates the core shape of an agent: **model + system prompt + tools + a multi-turn conversation loop**. Install the dependencies, configure your `OPENAI_API_KEY`, and you can chat with it in the terminal while letting it read local files and answer questions.

## Features

- **Small enough to study**: the whole agent lives in `hello-agent.ts`.
- **Tool calling**: includes a `readFile` tool that lets the model read local files.
- **Multi-turn chat**: keeps conversation history so the model can refer back to earlier turns.
- **Streaming output**: prints generated text in the terminal as it arrives.
- **Readable terminal trace**: roles use `<User>` / `<Agent>`, while process events use `[model]`, `[tool-call]`, `[tool-result]`, and `[done]`.

## Quick Start

### 1. Install dependencies

```bash
git clone https://github.com/anneincontext/hello-agent
cd hello-agent
npm install
```

Requires Node.js 20.19 or newer.

### 2. Configure your API key

Create an OpenAI API key from [platform.openai.com/api-keys](https://platform.openai.com/api-keys), then configure it with one of the following options.

```bash
cp .env.example .env
# Edit .env and fill in your API key.
```

### 3. Start the agent

```bash
npm start
```

## Example

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

The system prompt tells the model that it is running as a local CLI agent. When the user asks about a local text file such as `package.json`, the model can call `readFile` directly instead of asking the user to paste the file.

## What The Code Does

| Code                                                         | Purpose                                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `tool({ description, inputSchema, execute })`                | Defines `readFile`: what it does, which arguments it accepts, and how it runs.                                                        |
| `system`                                                     | Gives the model local CLI context and nudges it to use `readFile` for local text files.                                               |
| `messages: [{ role, content }, ...]`                         | Maintains conversation history by appending each user input and assistant response.                                                   |
| `streamText({ model, system, tools, messages, stopWhen })`   | Sends the prompt, history, and tools to the model, then lets the SDK run the tool-call and tool-result loop.                          |
| `for await (const chunk of result.fullStream)`               | Streams each step, including assistant text, tool calls, tool results, and tool errors.                                               |
| `result.response.messages`                                   | Gets the SDK's accumulated new messages, including text, tool calls, and tool results, then appends them to the conversation history. |

The whole program is a `while` loop: read user input, append it to `messages`, call `streamText`, stream the output, let model and tool calls finish, then continue. This is the simplest useful form of an **agent loop**.

## License

MIT
