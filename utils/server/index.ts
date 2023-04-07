import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from 'eventsource-parser';
import { OPENAI_API_HOST } from '../app/const';
import { randomUUID } from 'crypto';
import { logger } from '@/logger';
import { Tiktoken } from '@dqbd/tiktoken/lite/init';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  key: string,
  messages: Message[],
  context: {
    user: string;
    tokenCount: number;
    encoding: Tiktoken;
  },
) => {
  let totalCount = context.tokenCount;
  const res = await fetch(`${OPENAI_API_HOST}/v1/chat/completions`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`,
      ...(process.env.OPENAI_ORGANIZATION && {
        'OpenAI-Organization': process.env.OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      model: model.id,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 1,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }
  // console.log(res);
  const requestId = res.headers.get('x-request-id') || randomUUID();
  logger.info({
    requestId,
    user: context.user,
    tokenCount: context.tokenCount,
    type: 'request',
    model: model,
    key,
    messages,
  });

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data;

          if (data === '[DONE]') {
            controller.close();
            return;
          }

          try {
            const json = JSON.parse(data);
            const choice = json.choices[0];
            const text = choice.delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
            // console.log(data);
            if (text) {
              const tokens = context.encoding.encode(text);
              totalCount += tokens.length;
              logger.info({
                requestId,
                user: context.user,
                type: 'stream',
                stream: text,
              });
            } else if (choice.finish_reason) {
              logger.info({
                requestId,
                user: context.user,
                type: 'stream-end',
                totalCount,
              });
              context.encoding.free();
            }
          } catch (e) {
            controller.error(e);
            context.encoding.free();
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
