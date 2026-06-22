import { Router, Response } from 'express';
import { getDb } from '../db/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authenticate);

router.get('/dashboard', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const uid = req.user!.userId;

  const [wf, ex, suc, fail, active] = await Promise.all([
    db('workflows').where('user_id', uid).count('id as c').first(),
    db('executions').where('user_id', uid).count('id as c').first(),
    db('executions').where({ user_id: uid, status: 'completed' }).count('id as c').first(),
    db('executions').where({ user_id: uid, status: 'failed' }).count('id as c').first(),
    db('workflows').where({ user_id: uid, status: 'active' }).count('id as c').first(),
  ]) as any[];

  const totalWorkflows = parseInt(wf?.c || 0);
  const totalExecutions = parseInt(ex?.c || 0);
  const successfulExecutions = parseInt(suc?.c || 0);
  const failedExecutions = parseInt(fail?.c || 0);
  const activeWorkflows = parseInt(active?.c || 0);
  const successRate = totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

  const last7Days = await db('executions')
    .where('user_id', uid)
    .whereRaw("created_at >= datetime('now', '-7 days')")
    .select(db.raw("DATE(created_at) as date"), db.raw('COUNT(*) as count'), db.raw("SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as success"), db.raw("SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed"))
    .groupByRaw('DATE(created_at)')
    .orderBy('date', 'asc');

  const recentExecutions = await db('executions as e')
    .leftJoin('workflows as w', 'w.id', 'e.workflow_id')
    .where('e.user_id', uid)
    .select('e.*', 'w.name as workflow_name')
    .orderBy('e.created_at', 'desc')
    .limit(10);

  res.json({ success: true, data: { stats: { totalWorkflows, totalExecutions, successfulExecutions, failedExecutions, activeWorkflows, successRate }, charts: { executionsByDay: last7Days }, recentExecutions } });
}));

router.get('/workflows/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const db = getDb();
  const uid = req.user!.userId;
  const wfId = req.params.id;

  const stats = await db('executions')
    .where({ workflow_id: wfId, user_id: uid })
    .select(db.raw('COUNT(*) as total'), db.raw("SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as success"), db.raw("SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed"), db.raw('AVG(duration_ms) as avg_duration'), db.raw('MIN(duration_ms) as min_duration'), db.raw('MAX(duration_ms) as max_duration'))
    .first();

  const byDay = await db('executions')
    .where({ workflow_id: wfId, user_id: uid })
    .whereRaw("created_at >= datetime('now', '-30 days')")
    .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*) as count'))
    .groupByRaw('DATE(created_at)')
    .orderBy('date', 'asc');

  res.json({ success: true, data: { stats, byDay } });
}));

export default router;
