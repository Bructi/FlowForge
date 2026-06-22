import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

// ─── GET /api/workflows ───────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { search, status, page = '1', limit = '20' } = req.query as any;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = db('workflows').where('user_id', req.user!.userId);
  if (search) query = query.where(function() { this.whereLike('name', `%${search}%`).orWhereLike('description', `%${search}%`); });
  if (status) query = query.where('status', status);

  const total = await query.clone().count('id as c').first() as any;
  const workflows = await query.orderBy('updated_at', 'desc').limit(parseInt(limit)).offset(offset);

  res.json({ success: true, data: { workflows, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total?.c || 0), pages: Math.ceil((parseInt(total?.c || 0)) / parseInt(limit)) } } });
}));

// ─── POST /api/workflows ──────────────────────────────────
router.post('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, project_id, tags } = req.body;
  if (!name) throw createError('Workflow name is required', 400);

  const db = getDb();
  const id = uuidv4();
  await db('workflows').insert({ id, user_id: req.user!.userId, project_id: project_id || null, name, description: description || '', graph_json: '{"nodes":[],"edges":[]}', tags: JSON.stringify(tags || []) });

  const workflow = await db('workflows').where('id', id).first();
  res.status(201).json({ success: true, data: { workflow } });
}));

// ─── GET /api/workflows/:id ───────────────────────────────
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const workflow = await getDb()('workflows').where({ id: req.params.id, user_id: req.user!.userId }).first() as any;
  if (!workflow) throw createError('Workflow not found', 404);
  workflow.graph = JSON.parse(workflow.graph_json || '{"nodes":[],"edges":[]}');
  res.json({ success: true, data: { workflow } });
}));

// ─── PUT /api/workflows/:id ───────────────────────────────
router.put('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { name, description, graph, status, tags } = req.body;
  const db = getDb();

  const existing = await db('workflows').where({ id: req.params.id, user_id: req.user!.userId }).first() as any;
  if (!existing) throw createError('Workflow not found', 404);

  const versionCount = await db('workflow_versions').where('workflow_id', req.params.id).count('id as c').first() as any;
  await db('workflow_versions').insert({ id: uuidv4(), workflow_id: req.params.id, version: parseInt(versionCount?.c || 0) + 1, graph_json: existing.graph_json, created_by: req.user!.userId });

  const updates: any = { updated_at: new Date().toISOString() };
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (graph !== undefined) updates.graph_json = JSON.stringify(graph);
  if (status !== undefined) updates.status = status;
  if (tags !== undefined) updates.tags = JSON.stringify(tags);

  await db('workflows').where('id', req.params.id).update(updates);
  const workflow = await db('workflows').where('id', req.params.id).first() as any;
  workflow.graph = JSON.parse(workflow.graph_json || '{"nodes":[],"edges":[]}');
  res.json({ success: true, data: { workflow } });
}));

// ─── DELETE /api/workflows/:id ────────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const changes = await getDb()('workflows').where({ id: req.params.id, user_id: req.user!.userId }).delete();
  if (!changes) throw createError('Workflow not found', 404);
  res.json({ success: true, message: 'Workflow deleted' });
}));

// ─── POST /api/workflows/:id/clone ───────────────────────
router.post('/:id/clone', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const source = await db('workflows').where('id', req.params.id).first() as any;
  if (!source) throw createError('Workflow not found', 404);

  const newId = uuidv4();
  await db('workflows').insert({ id: newId, user_id: req.user!.userId, name: `${source.name} (Copy)`, description: source.description, graph_json: source.graph_json, tags: source.tags });

  const workflow = await db('workflows').where('id', newId).first();
  res.status(201).json({ success: true, data: { workflow } });
}));

// ─── GET /api/workflows/:id/versions ─────────────────────
router.get('/:id/versions', asyncHandler(async (req: AuthRequest, res: Response) => {
  const versions = await getDb()('workflow_versions').where('workflow_id', req.params.id).select('id', 'version', 'created_by', 'created_at').orderBy('version', 'desc');
  res.json({ success: true, data: { versions } });
}));

// ─── POST /api/workflows/:id/export ──────────────────────
router.post('/:id/export', asyncHandler(async (req: AuthRequest, res: Response) => {
  const workflow = await getDb()('workflows').where({ id: req.params.id, user_id: req.user!.userId }).first() as any;
  if (!workflow) throw createError('Workflow not found', 404);
  res.json({ success: true, data: { version: '1.0', exported_at: new Date().toISOString(), workflow: { name: workflow.name, description: workflow.description, graph: JSON.parse(workflow.graph_json), tags: JSON.parse(workflow.tags || '[]') } } });
}));

// ─── POST /api/workflows/import ──────────────────────────
router.post('/import', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workflow: wf } = req.body;
  if (!wf?.name || !wf?.graph) throw createError('Invalid workflow export format', 400);

  const db = getDb();
  const id = uuidv4();
  await db('workflows').insert({ id, user_id: req.user!.userId, name: `${wf.name} (Imported)`, description: wf.description || '', graph_json: JSON.stringify(wf.graph), tags: JSON.stringify(wf.tags || []) });

  const workflow = await db('workflows').where('id', id).first();
  res.status(201).json({ success: true, data: { workflow } });
}));

export default router;
