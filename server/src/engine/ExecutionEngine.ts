import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { io } from '../index';
import { logger } from '../utils/logger';
import { executeNode } from './NodeExecutors';

export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowNode {
  id: string;
  type: string;
  data: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface ExecutionContext {
  executionId: string;
  workflowId: string;
  userId: string;
  nodeOutputs: Map<string, any>;
  logs: ExecutionLog[];
}

export interface ExecutionLog {
  id: string;
  node_id?: string;
  node_type?: string;
  node_label?: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  message: string;
  data?: any;
  timestamp: string;
}

class ExecutionEngine {
  private running: Set<string> = new Set();

  async execute(executionId: string, graph: WorkflowGraph, userId: string, workflowId: string): Promise<void> {
    if (this.running.has(executionId)) return;
    this.running.add(executionId);

    const db = getDb();
    const ctx: ExecutionContext = {
      executionId, workflowId, userId, nodeOutputs: new Map(), logs: [],
    };

    try {
      await db('executions').where('id', executionId).update({ status: 'running', started_at: new Date().toISOString() });

      this.emitLog(ctx, { level: 'info', message: '🚀 Workflow execution started' });

      const order = this.topologicalSort(graph);
      this.emitLog(ctx, { level: 'info', message: `📋 Execution plan: ${order.length} nodes` });

      let nodesExecuted = 0;

      for (const nodeId of order) {
        const node = graph.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        const inputs = this.gatherInputs(node, graph, ctx);

        this.emitLog(ctx, {
          level: 'info',
          message: `⚙️ Executing: ${node.data.label || node.type}`,
          node_id: node.id, node_type: node.type, node_label: node.data.label,
        });

        try {
          const output = await this.executeWithRetry(node, inputs, ctx, 3);
          ctx.nodeOutputs.set(node.id, output);
          nodesExecuted++;

          this.emitLog(ctx, {
            level: 'success',
            message: `✅ Completed: ${node.data.label || node.type}`,
            node_id: node.id, node_type: node.type, node_label: node.data.label, data: output,
          });
        } catch (nodeError: any) {
          this.emitLog(ctx, {
            level: 'error',
            message: `❌ Failed: ${node.data.label || node.type} — ${nodeError.message}`,
            node_id: node.id, node_type: node.type, node_label: node.data.label,
          });
          ctx.nodeOutputs.set(node.id, null);
        }
      }

      const outputNode = graph.nodes.find((n) => n.type === 'textOutput' || n.type === 'jsonOutput');
      const finalOutput = outputNode ? ctx.nodeOutputs.get(outputNode.id) : null;

      const finishedAt = new Date().toISOString();
      const startedAtRow = await db('executions').where('id', executionId).select('started_at').first() as any;
      const durationMs = startedAtRow?.started_at ? Date.now() - new Date(startedAtRow.started_at).getTime() : 0;

      await db('executions').where('id', executionId).update({
        status: 'completed', finished_at: finishedAt,
        output_data: JSON.stringify({ result: finalOutput }),
        nodes_executed: nodesExecuted, duration_ms: durationMs,
      });

      this.emitLog(ctx, { level: 'success', message: `🎉 Workflow completed successfully (${nodesExecuted} nodes)` });
      await this.saveLogs(ctx);
      this.emitStatus(executionId, 'completed');

      await db('notifications').insert({
        id: uuidv4(), user_id: userId, type: 'success',
        title: '✅ Workflow Completed',
        message: 'Execution finished successfully',
        data_json: JSON.stringify({ executionId, workflowId }),
      });

    } catch (error: any) {
      logger.error('Execution engine error:', error);

      await db('executions').where('id', executionId).update({
        status: 'failed', finished_at: new Date().toISOString(), error: error.message,
      });

      this.emitLog(ctx, { level: 'error', message: `💥 Workflow failed: ${error.message}` });
      await this.saveLogs(ctx);
      this.emitStatus(executionId, 'failed');

      await db('notifications').insert({
        id: uuidv4(), user_id: userId, type: 'error',
        title: '❌ Workflow Failed',
        message: `Execution encountered an error: ${error.message}`,
      });

    } finally {
      this.running.delete(executionId);
    }
  }

  private async executeWithRetry(node: WorkflowNode, inputs: any, ctx: ExecutionContext, maxRetries: number): Promise<any> {
    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await executeNode(node, inputs, ctx);
      } catch (error: any) {
        lastError = error;
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500;
          this.emitLog(ctx, {
            level: 'warn',
            message: `⟳ Retry ${attempt}/${maxRetries - 1} for ${node.data.label || node.type} in ${delay}ms`,
            node_id: node.id,
          });
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError!;
  }

  private topologicalSort(graph: WorkflowGraph): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    graph.nodes.forEach((n) => { inDegree.set(n.id, 0); adjList.set(n.id, []); });
    graph.edges.forEach((e) => {
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      adjList.get(e.source)?.push(e.target);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => { if (degree === 0) queue.push(nodeId); });

    const order: string[] = [];
    while (queue.length > 0) {
      const node = queue.shift()!;
      order.push(node);
      adjList.get(node)?.forEach((neighbor) => {
        inDegree.set(neighbor, (inDegree.get(neighbor) || 0) - 1);
        if (inDegree.get(neighbor) === 0) queue.push(neighbor);
      });
    }
    return order;
  }

  private gatherInputs(node: WorkflowNode, graph: WorkflowGraph, ctx: ExecutionContext): any {
    const parentEdges = graph.edges.filter((e) => e.target === node.id);
    if (parentEdges.length === 0) return null;
    if (parentEdges.length === 1) return ctx.nodeOutputs.get(parentEdges[0].source);

    const combined: Record<string, any> = {};
    parentEdges.forEach((e) => { combined[e.source] = ctx.nodeOutputs.get(e.source); });
    return combined;
  }

  private emitLog(ctx: ExecutionContext, log: Omit<ExecutionLog, 'id' | 'timestamp'>): void {
    const fullLog: ExecutionLog = { id: uuidv4(), timestamp: new Date().toISOString(), ...log };
    ctx.logs.push(fullLog);
    io.to(`execution:${ctx.executionId}`).emit('execution:log', fullLog);
    logger.debug(`[Exec ${ctx.executionId.slice(0, 8)}] ${log.message}`);
  }

  private emitStatus(executionId: string, status: string): void {
    io.to(`execution:${executionId}`).emit('execution:status', { executionId, status });
  }

  private async saveLogs(ctx: ExecutionContext): Promise<void> {
    const db = getDb();
    if (ctx.logs.length === 0) return;

    const logRows = ctx.logs.map((log) => ({
      id: log.id,
      execution_id: ctx.executionId,
      node_id: log.node_id || null,
      node_type: log.node_type || null,
      node_label: log.node_label || null,
      level: log.level,
      message: log.message,
      data_json: log.data ? JSON.stringify(log.data) : null,
      timestamp: log.timestamp,
    }));

    await db('execution_logs').insert(logRows);
  }

  stop(executionId: string): void { this.running.delete(executionId); }
  isRunning(executionId: string): boolean { return this.running.has(executionId); }
}

export const executionEngine = new ExecutionEngine();
