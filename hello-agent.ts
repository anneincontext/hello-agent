// hello-agent.ts —— 一个最小可运行的 AI agent
//
// 配套小册《从零打造一个 AI Agent CLI》开篇示例。
// 50 行跑通：streamText + 一个 readFile 工具 + 多轮对话循环。
//
// 依赖：ai @ai-sdk/openai-compatible zod
// 启动：npx tsx hello-agent.ts

import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { streamText, stepCountIs, tool } from 'ai'
import { z } from 'zod'
import fs from 'node:fs/promises'
import readline from 'node:readline'

// 通过 OpenAI 兼容协议接 DeepSeek——DeepSeek API 本来就是 OpenAI-compatible 的
const deepseek = createOpenAICompatible({
  name: 'deepseek',
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
})

// 给模型一个工具：读取一个文件的全部内容
const readFile = tool({
  description: '读取一个文本文件，返回完整内容',
  inputSchema: z.object({
    path: z.string().describe('要读取的文件路径'),
  }),
  execute: async ({ path }) => {
    return await fs.readFile(path, 'utf-8')
  },
})

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = (q: string) => new Promise<string>((r) => rl.question(q, r))
  const messages: Array<{ role: 'user' | 'assistant'; content: any }> = []

  for (;;) {
    const input = (await ask('\n你: ')).trim()
    if (!input || input === 'exit') break
    messages.push({ role: 'user', content: input })

    const result = streamText({
      model: deepseek('deepseek-chat'),
      messages,
      tools: { readFile },
      stopWhen: stepCountIs(10), // 最多 10 轮工具调用就收手
    })

    process.stdout.write('助手: ')
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') process.stdout.write(chunk.text)
      else if (chunk.type === 'tool-call') process.stdout.write(`\n  [调用 ${chunk.toolName}(${JSON.stringify(chunk.input)})]`)
      else if (chunk.type === 'tool-result') process.stdout.write(`\n  [返回 ${String(chunk.output).length} 字节]\n助手: `)
      else if (chunk.type === 'error') process.stdout.write(`\n[错误] ${String((chunk as any).error)}`)
    }

    const { messages: newMessages } = await result.response
    messages.push(...(newMessages as any))
  }
  rl.close()
}

main().catch(console.error)
