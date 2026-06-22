import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { unread, page = '1', limit = '20' } = req.query as any;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = db('notifications').where('user_id', req.user!.userId);
  if (unread === 'true') query = query.where('read', 0);
  const notifications = await query.orderBy('created_at', 'desc').limit(parseInt(limit)).offset(offset);
  const unreadCount = await db('notifications').where({ user_id: req.user!.userId, read: 0 }).count('id as c').first() as any;

  res.json({ success: true, data: { notifications, unreadCount: parseInt(unreadCount?.c || 0) } });
}));

router.put('/read-all', asyncHandler(async (req: AuthRequest, res: Response) => {
  await getDb()('notifications').where('user_id', req.user!.userId).update({ read: 1 });
  res.json({ success: true });
}));

router.put('/:id/read', asyncHandler(async (req: AuthRequest, res: Response) => {
  await getDb()('notifications').where({ id: req.params.id, user_id: req.user!.userId }).update({ read: 1 });
  res.json({ success: true });
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await getDb()('notifications').where({ id: req.params.id, user_id: req.user!.userId }).delete();
  res.json({ success: true });
}));

export default router;
