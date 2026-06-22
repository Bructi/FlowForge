import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, optionalAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

router.get('/', optionalAuth, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { category, search, builtin } = req.query as any;
  const db = getDb();

  let query = db('templates').where('is_public', 1);
  if (req.user) query = query.orWhere('user_id', req.user.userId);
  if (builtin === 'true') query = query.where('is_builtin', 1);
  if (category) query = query.where('category', category);
  if (search) query = query.where(function() { this.whereLike('name', `%${search}%`).orWhereLike('description', `%${search}%`); });

  const templates = await query.orderBy('downloads', 'desc').orderBy('created_at', 'desc');
  res.json({ success: true, data: { templates } });
}));

router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const template = await getDb()('templates').where('id', req.params.id).first() as any;
  if (!template) throw createError('Template not found', 404);
  template.graph = JSON.parse(template.graph_json);
  res.json({ success: true, data: { template } });
}));

router.post('/:id/use', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const template = await db('templates').where('id', req.params.id).first() as any;
  if (!template) throw createError('Template not found', 404);

  await db('templates').where('id', req.params.id).increment('downloads', 1);

  const workflowId = uuidv4();
  await db('workflows').insert({ id: workflowId, user_id: req.user!.userId, name: template.name, description: template.description, graph_json: template.graph_json, tags: template.tags || '[]' });

  const workflow = await db('workflows').where('id', workflowId).first() as any;
  workflow.graph = JSON.parse(workflow.graph_json);
  res.status(201).json({ success: true, data: { workflow } });
}));

router.post('/', authenticate, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, category, graph, tags, is_public } = req.body;
  if (!name || !graph) throw createError('Name and graph are required', 400);

  const db = getDb();
  const id = uuidv4();
  await db('templates').insert({ id, user_id: req.user!.userId, name, description: description || '', category: category || 'general', graph_json: JSON.stringify(graph), is_public: is_public ? 1 : 0, tags: JSON.stringify(tags || []) });

  const template = await db('templates').where('id', id).first();
  res.status(201).json({ success: true, data: { template } });
}));

export default router;
