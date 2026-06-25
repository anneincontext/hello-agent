// hello-agent.ts - a minimal runnable AI agent

import { openai } from '@ai-sdk/openai';
import { stepCountIs, streamText, tool } from 'ai';
import fs from 'node:fs/promises';
import readline from 'node:readline';
import { z } from 'zod';

// Tool definition: the model can decide to call this when it needs file content.
const readFile = tool({
  description: 'Read a text file and return its full contents.',
  inputSchema: z.object({
    path: z.string().describe('The path to the file to read.'),
  }),
  execute: async ({ path }) => await fs.readFile(path, 'utf-8'),
});

const system = `You are a local CLI agent running in ${process.cwd()}.
When the user asks about a local text file, call readFile with the path they mention.
For common filenames like package.json, use the filename directly instead of asking the user to paste it.`;

// AI SDK stream chunks may expose text as either `text` or `delta`.
function textOf(chunk: unknown) {
  const part = chunk as { text?: unknown; delta?: unknown };
  return typeof part.text === 'string' ? part.text : String(part.delta ?? '');
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const ask = (q: string) => new Promise<string>((r) => rl.question(q, r));

  // Conversation history is sent back to the model on every turn.
  const messages: Array<{ role: 'user' | 'assistant'; content: any }> = [];

  console.log('Hello Agent. Type "exit" to quit.');

  for (;;) {
    const input = (await ask('\n<User> ')).trim();
    if (!input || input === 'exit') break;
    messages.push({ role: 'user', content: input });

    // Start one agent turn: model + tools + conversation history.
    const result = streamText({
      model: openai('gpt-5'),
      system,
      tools: { readFile },
      messages,
      stopWhen: stepCountIs(10), // Stop after at most 10 tool-call rounds.
    });

    console.log('[model] sending messages and tools...');
    let isAnswering = false;

    // fullStream exposes every step: text, tool calls, tool results, and errors.
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'text-delta') {
        if (!isAnswering) {
          process.stdout.write('\n<Agent> ');
          isAnswering = true;
        }
        process.stdout.write(textOf(chunk));
      } else if (chunk.type === 'tool-call') {
        if (isAnswering) process.stdout.write('\n');
        console.log(
          `\n[tool-call] ${chunk.toolName}(${JSON.stringify(chunk.input)})`
        );
        isAnswering = false;
      } else if (chunk.type === 'tool-result') {
        console.log(
          `[tool-result] ${chunk.toolName} returned ${String(chunk.output).length} bytes`
        );
      } else if (chunk.type === 'tool-error') {
        console.log(`[tool-error] ${chunk.toolName}: ${chunk.error}`);
      }
    }

    if (isAnswering) process.stdout.write('\n');
    console.log('[done]');

    // Save the assistant/tool messages so the next turn has context.
    const { messages: newMessages } = await result.response;
    messages.push(...(newMessages as any));
  }

  rl.close();
  if (!process.stdin.isTTY) process.stdout.write('\n');
  console.log('[system] goodbye');
}

main().catch(console.error);
