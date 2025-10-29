import fs from 'fs';
import path from 'path';

const provider = process.env.LLM_PROVIDER || 'openai';
const model = process.env.LLM_MODEL || 'gpt-4o-mini';
const systemPath = process.env.SYSTEM_PROMPT_PATH || './system-prompt.txt';
const systemPromptAbsolute = path.resolve(systemPath);

let SYSTEM_PROMPT = 'Eres un asistente útil.';
if (fs.existsSync(systemPromptAbsolute)) {
  SYSTEM_PROMPT = fs.readFileSync(systemPromptAbsolute, 'utf8');
}

export interface LLMOptions {
  message: string;
  sessionId?: string;
}

export async function callLLM({ message, sessionId }: LLMOptions): Promise<string> {
  const user = message.slice(0, 4000);
  
  if (provider === 'generic') {
    return callGeneric(user);
  }
  return callOpenAI(user);
}

async function callOpenAI(user: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    return data?.choices?.[0]?.message?.content || 'Gracias, te ayudo con eso…';
  } catch (error) {
    console.error('LLM call failed:', error);
    return 'Gracias, te ayudo con eso…';
  }
}

async function callGeneric(user: string): Promise<string> {
  const url = process.env.GENERIC_LLM_URL;
  if (!url) {
    throw new Error('GENERIC_LLM_URL not configured');
  }

  const auth = process.env.GENERIC_LLM_AUTH;

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (auth) {
      headers['Authorization'] = auth;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        system: SYSTEM_PROMPT,
        user,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Generic LLM API error: ${response.status} - ${error}`);
    }

    const data: any = await response.json();
    return data?.text || data?.output || 'Gracias, te ayudo con eso…';
  } catch (error) {
    console.error('Generic LLM call failed:', error);
    return 'Gracias, te ayudo con eso…';
  }
}

