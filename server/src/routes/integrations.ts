import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

function encryptKey(key: string): string {
  const secret = process.env.ENCRYPTION_KEY || 'fallback-32-char-key-dev-only!!!';
  return CryptoJS.AES.encrypt(key, secret).toString();
}

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const [apiKeys, integrations] = await Promise.all([
    db('api_keys').select('id', 'provider', 'label', 'is_active', 'created_at').where('user_id', req.user!.userId),
    db('integrations').where('user_id', req.user!.userId),
  ]);
  res.json({ success: true, data: { apiKeys, integrations } });
}));

router.post('/api-keys', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { provider, apiKey, label } = req.body;
  if (!provider || !apiKey) throw new Error('Provider and API key required');

  const db = getDb();
  const encrypted = encryptKey(apiKey);
  await db('api_keys').where({ user_id: req.user!.userId, provider }).delete();
  await db('api_keys').insert({ id: uuidv4(), user_id: req.user!.userId, provider, key_encrypted: encrypted, label: label || provider });

  res.json({ success: true, message: `${provider} API key saved successfully` });
}));

router.delete('/api-keys/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await getDb()('api_keys').where({ id: req.params.id, user_id: req.user!.userId }).delete();
  res.json({ success: true });
}));

export default router;
