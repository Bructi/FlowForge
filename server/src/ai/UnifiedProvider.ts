import axios from 'axios';
import { getDb } from '../db/database';
import { logger } from '../utils/logger';
import CryptoJS from 'crypto-js';

export interface CompletionRequest {
  provider: 'openai' | 'gemini' | 'claude' | 'ollama' | 'deepseek' | 'groq' | 'openrouter';
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
}

function decryptKey(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || 'fallback-32-char-key-dev-only!!!';
  const bytes = CryptoJS.AES.decrypt(encrypted, key);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export class UnifiedAIProvider {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  private async getApiKey(provider: string): Promise<string | null> {
    // Check env first
    const envKeys: Record<string, string | undefined> = {
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GOOGLE_GEMINI_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      deepseek: process.env.DEEPSEEK_API_KEY,
      groq: process.env.GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
    };
    if (envKeys[provider]) return envKeys[provider]!;

    // Check user's stored API keys
    const db = getDb();
    const row = await db('api_keys')
      .where({ user_id: this.userId, provider, is_active: 1 })
      .select('key_encrypted')
      .first();

    if (row) {
      try { return decryptKey(row.key_encrypted); }
      catch { return null; }
    }
    return null;
  }

  async complete(req: CompletionRequest): Promise<string> {
    logger.debug(`AI completion: provider=${req.provider} model=${req.model}`);

    switch (req.provider) {
      case 'openai': return await this.openai(req);
      case 'gemini': return await this.gemini(req);
      case 'claude': return await this.claude(req);
      case 'deepseek': return await this.deepseek(req);
      case 'groq': return await this.groq(req);
      case 'openrouter': return await this.openrouter(req);
      case 'ollama':
      default:
        return await this.ollama(req);
    }
  }

  private async ollama(req: CompletionRequest): Promise<string> {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    const model = req.model || 'llama3.2';

    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.userPrompt });

    const response = await axios.post(`${baseUrl}/api/chat`, {
      model,
      messages,
      stream: false,
      options: {
        temperature: req.temperature ?? 0.7,
        top_p: req.topP ?? 1,
        num_predict: req.maxTokens ?? 2000,
      },
    }, { timeout: 120000 });

    return response.data.message?.content || '';
  }

  private async openai(req: CompletionRequest): Promise<string> {
    const apiKey = await this.getApiKey('openai');
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const model = req.model || 'gpt-4o-mini';
    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.userPrompt });

    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2000,
      top_p: req.topP ?? 1,
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    });

    return response.data.choices[0]?.message?.content || '';
  }

  private async gemini(req: CompletionRequest): Promise<string> {
    const apiKey = await this.getApiKey('gemini');
    if (!apiKey) throw new Error('Google Gemini API key not configured');

    const model = req.model || 'gemini-1.5-flash';
    const contents: any[] = [];
    if (req.systemPrompt) contents.push({ role: 'user', parts: [{ text: req.systemPrompt }] });
    contents.push({ role: 'user', parts: [{ text: req.userPrompt }] });

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { contents, generationConfig: { temperature: req.temperature, maxOutputTokens: req.maxTokens } },
      { timeout: 60000 }
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  private async claude(req: CompletionRequest): Promise<string> {
    const apiKey = await this.getApiKey('claude');
    if (!apiKey) throw new Error('Anthropic API key not configured');

    const model = req.model || 'claude-3-haiku-20240307';
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model,
      max_tokens: req.maxTokens ?? 2000,
      system: req.systemPrompt || '',
      messages: [{ role: 'user', content: req.userPrompt }],
    }, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    });

    return response.data.content?.[0]?.text || '';
  }

  private async deepseek(req: CompletionRequest): Promise<string> {
    const apiKey = await this.getApiKey('deepseek');
    if (!apiKey) throw new Error('DeepSeek API key not configured');

    const model = req.model || 'deepseek-chat';
    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.userPrompt });

    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model, messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2000,
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    });

    return response.data.choices[0]?.message?.content || '';
  }

  private async groq(req: CompletionRequest): Promise<string> {
    const apiKey = await this.getApiKey('groq');
    if (!apiKey) throw new Error('Groq API key not configured');

    const model = req.model || 'llama-3.1-8b-instant';
    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.userPrompt });

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model, messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2000,
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 60000,
    });

    return response.data.choices[0]?.message?.content || '';
  }

  private async openrouter(req: CompletionRequest): Promise<string> {
    const apiKey = await this.getApiKey('openrouter');
    if (!apiKey) throw new Error('OpenRouter API key not configured');

    const model = req.model || 'openrouter/auto';
    const messages: any[] = [];
    if (req.systemPrompt) messages.push({ role: 'system', content: req.systemPrompt });
    messages.push({ role: 'user', content: req.userPrompt });

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model, messages,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 2000,
    }, {
      headers: { 
        Authorization: `Bearer ${apiKey}`, 
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:5173',
        'X-Title': 'FlowForge AI',
        'Content-Type': 'application/json' 
      },
      timeout: 60000,
    });

    return response.data.choices[0]?.message?.content || '';
  }

  async listOllamaModels(): Promise<string[]> {
    try {
      const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const response = await axios.get(`${baseUrl}/api/tags`, { timeout: 5000 });
      return response.data.models?.map((m: any) => m.name) || [];
    } catch {
      return [];
    }
  }

  async listOpenRouterFreeModels(): Promise<any[]> {
    try {
      const response = await axios.get('https://openrouter.ai/api/v1/models', { timeout: 10000 });
      // Filter models where prompt and completion pricing are exactly 0
      const freeModels = response.data.data.filter((m: any) => 
        m.pricing?.prompt === '0' && m.pricing?.completion === '0'
      ).map((m: any) => ({
        id: m.id,
        name: m.name,
        context_length: m.context_length
      }));
      return freeModels;
    } catch {
      return [];
    }
  }
}
