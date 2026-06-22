import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { executionEngine } from '../engine/ExecutionEngine';

const router = Router();
router.use(authenticate);

// ─── POST /api/executions/run ─────────────────────────────
router.post('/run', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workflowId, inputData } = req.body;
  if (!workflowId) throw createError('workflowId required', 400);

  const db = getDb();
  const workflow = await db('workflows').where({ id: workflowId, user_id: req.user!.userId }).first() as any;
  if (!workflow) throw createError('Workflow not found', 404);

  const graph = JSON.parse(workflow.graph_json || '{"nodes":[],"edges":[]}');
  if (!graph.nodes || graph.nodes.length === 0) throw createError('Workflow has no nodes', 400);

  const executionId = uuidv4();
  await db('executions').insert({
    id: executionId, workflow_id: workflowId, user_id: req.user!.userId,
    status: 'pending', triggered_by: 'manual', input_data: JSON.stringify(inputData || {}),
  });

  setImmediate(() => {
    executionEngine.execute(executionId, graph, req.user!.userId, workflowId);
  });

  res.status(202).json({ success: true, data: { executionId, status: 'pending', message: 'Execution started' } });
}));

// ─── GET /api/executions ──────────────────────────────────
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { workflowId, status, page = '1', limit = '20' } = req.query as any;
  const db = getDb();
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let query = db('executions as e').join('workflows as w', 'w.id', 'e.workflow_id').where('e.user_id', req.user!.userId).select('e.*', 'w.name as workflow_name');
  if (workflowId) query = query.where('e.workflow_id', workflowId);
  if (status) query = query.where('e.status', status);

  const total = await db('executions').where('user_id', req.user!.userId).count('id as c').first() as any;
  const executions = await query.orderBy('e.created_at', 'desc').limit(parseInt(limit)).offset(offset);

  res.json({ success: true, data: { executions, pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total?.c || 0) } } });
}));

// ─── GET /api/executions/:id ──────────────────────────────
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const execution = await db('executions').where({ id: req.params.id, user_id: req.user!.userId }).first();
  if (!execution) throw createError('Execution not found', 404);
  const logs = await db('execution_logs').where('execution_id', req.params.id).orderBy('timestamp', 'asc');
  
  const mappedLogs = logs.map((l: any) => {
    let parsedData = null;
    if (l.data_json) {
      try { parsedData = JSON.parse(l.data_json); }
      catch { parsedData = l.data_json; }
    }
    return {
      id: l.id,
      level: l.level,
      message: l.message,
      node_label: l.node_label,
      data: parsedData,
      timestamp: l.timestamp
    };
  });
  
  res.json({ success: true, data: { execution, logs: mappedLogs } });
}));

// ─── DELETE /api/executions/:id ───────────────────────────
router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  await getDb()('executions').where({ id: req.params.id, user_id: req.user!.userId }).delete();
  res.json({ success: true });
}));

// ─── POST /api/executions/:id/stop ────────────────────────
router.post('/:id/stop', asyncHandler(async (req: AuthRequest, res: Response) => {
  executionEngine.stop(req.params.id);
  await getDb()('executions').where('id', req.params.id).update({ status: 'cancelled', finished_at: new Date().toISOString() });
  res.json({ success: true, message: 'Execution stopped' });
}));

export default router;
