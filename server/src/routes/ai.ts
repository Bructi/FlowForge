import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { UnifiedAIProvider } from '../ai/UnifiedProvider';

const router = Router();
router.use(authenticate);

// ─── GET /api/ai/providers ────────────────────────────────
router.get('/providers', asyncHandler(async (req: AuthRequest, res: Response) => {
  res.json({
    success: true,
    data: {
      providers: [
        { id: 'ollama', name: 'Ollama (Local)', icon: '🦙', defaultModel: 'llama3.2', requiresKey: false },
        { id: 'openai', name: 'OpenAI', icon: '🤖', defaultModel: 'gpt-4o-mini', requiresKey: true },
        { id: 'gemini', name: 'Google Gemini', icon: '✨', defaultModel: 'gemini-1.5-flash', requiresKey: true },
        { id: 'claude', name: 'Anthropic Claude', icon: '🧠', defaultModel: 'claude-3-haiku-20240307', requiresKey: true },
        { id: 'deepseek', name: 'DeepSeek', icon: '🔍', defaultModel: 'deepseek-chat', requiresKey: true },
        { id: 'groq', name: 'Groq (Fast)', icon: '⚡', defaultModel: 'llama-3.1-8b-instant', requiresKey: true },
        { id: 'openrouter', name: 'OpenRouter', icon: '🌐', defaultModel: 'openrouter/auto', requiresKey: true },
      ],
    },
  });
}));

// ─── GET /api/ai/models/ollama ────────────────────────────
router.get('/models/ollama', asyncHandler(async (req: AuthRequest, res: Response) => {
  const provider = new UnifiedAIProvider(req.user!.userId);
  const models = await provider.listOllamaModels();
  res.json({ success: true, data: { models } });
}));

// ─── GET /api/ai/models/openrouter ────────────────────────
router.get('/models/openrouter', asyncHandler(async (req: AuthRequest, res: Response) => {
  const provider = new UnifiedAIProvider(req.user!.userId);
  const models = await provider.listOpenRouterFreeModels();
  res.json({ success: true, data: { models } });
}));

// ─── POST /api/ai/test ────────────────────────────────────
router.post('/test', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { provider, model } = req.body;
  const aiProvider = new UnifiedAIProvider(req.user!.userId);

  const result = await aiProvider.complete({
    provider: provider || 'ollama',
    model,
    userPrompt: 'Say "Hello from FlowForge AI!" in one sentence.',
    maxTokens: 50,
  });

  res.json({ success: true, data: { response: result, provider } });
}));

export default router;
