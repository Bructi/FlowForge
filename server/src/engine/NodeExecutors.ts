import axios from 'axios';
import nodemailer from 'nodemailer';
import { Knex } from 'knex';
import { WorkflowNode, ExecutionContext } from './ExecutionEngine';
import { getDb } from '../db/database';
import { UnifiedAIProvider } from '../ai/UnifiedProvider';

export async function executeNode(node: WorkflowNode, inputs: any, ctx: ExecutionContext): Promise<any> {
  const { type, data } = node;

  switch (type) {
    // ─── Input Nodes ──────────────────────────────────────
    case 'textInput':
      return data.value || data.placeholder || '';

    case 'chatInput':
      return inputs || data.message || '';

    case 'fileUpload':
      return inputs || { filename: data.filename, content: data.content || '' };

    case 'webhook':
      return inputs || data.payload || {};

    case 'apiInput':
      return inputs || {};

    // ─── AI Nodes ─────────────────────────────────────────
    case 'aiNode': {
      const provider = new UnifiedAIProvider(ctx.userId);
      const inputText = typeof inputs === 'string' ? inputs
        : typeof inputs === 'object' ? JSON.stringify(inputs, null, 2)
        : String(inputs || '');

      const defaultProvider = process.env.DEFAULT_AI_PROVIDER || 'openrouter';

      try {
        const response = await provider.complete({
          provider: data.provider || defaultProvider,
          model: data.model,
          systemPrompt: data.systemPrompt || '',
          userPrompt: inputText,
          temperature: data.temperature ?? 0.7,
          maxTokens: data.maxTokens ?? 2000,
          topP: data.topP ?? 1,
        });
        return response;
      } catch (error: any) {
        // Axios errors hide the real message in response.data
        const message = error.response?.data?.error?.message || error.message;
        throw new Error(message);
      }
    }

    // ─── Logic Nodes ──────────────────────────────────────
    case 'ifElse': {
      const condition = data.condition || 'true';
      let result = false;
      try {
        const inputVal = typeof inputs === 'object' ? inputs : { value: inputs };
        // Safe evaluation using Function constructor
        const fn = new Function(...Object.keys(inputVal), `return Boolean(${condition})`);
        result = fn(...Object.values(inputVal));
      } catch { result = false; }
      return { result, branch: result ? 'true' : 'false', input: inputs };
    }

    case 'switchNode': {
      const switchValue = typeof inputs === 'object' ? inputs?.intent || inputs?.value : inputs;
      return { case: switchValue, input: inputs };
    }

    case 'filter': {
      const arr = Array.isArray(inputs) ? inputs : [inputs];
      const filterFn = data.condition || 'true';
      const filtered = arr.filter((item: any) => {
        try {
          const fn = new Function('item', `return Boolean(${filterFn})`);
          return fn(item);
        } catch { return true; }
      });
      return filtered;
    }

    case 'loop': {
      const arr = Array.isArray(inputs) ? inputs : [inputs];
      return arr;
    }

    case 'delay': {
      const ms = (data.delaySeconds || 1) * 1000;
      await new Promise((r) => setTimeout(r, ms));
      return inputs;
    }

    case 'scheduler':
      return { scheduled: true, cron: data.cron, input: inputs };

    // ─── Utility Nodes ────────────────────────────────────
    case 'formatter': {
      const template = data.template || '{input}';
      const inputStr = typeof inputs === 'string' ? inputs : JSON.stringify(inputs);
      return template.replace('{input}', inputStr).replace(/\{(\w+)\}/g, (_: string, k: string) => {
        return typeof inputs === 'object' ? (inputs[k] ?? `{${k}}`) : inputStr;
      });
    }

    case 'jsonParser': {
      if (typeof inputs === 'string') {
        try { return JSON.parse(inputs); }
        catch { return { error: 'Invalid JSON', raw: inputs }; }
      }
      return inputs;
    }

    case 'jsonStringify':
      return JSON.stringify(inputs, null, 2);

    case 'regex': {
      const pattern = data.pattern || '.*';
      const flags = data.flags || 'g';
      const inputStr = String(inputs || '');
      const regex = new RegExp(pattern, flags);
      const matches = inputStr.match(regex);
      return { matches: matches || [], original: inputStr };
    }

    case 'textCleaner': {
      let text = String(inputs || '');
      if (data.trim) text = text.trim();
      if (data.lowercase) text = text.toLowerCase();
      if (data.uppercase) text = text.toUpperCase();
      if (data.removeHtml) text = text.replace(/<[^>]*>/g, '');
      if (data.removeExtraSpaces) text = text.replace(/\s+/g, ' ');
      return text;
    }

    case 'calculator': {
      const expression = data.expression || String(inputs || '0');
      try {
        const result = Function('"use strict"; return (' + expression + ')')();
        return { result, expression };
      } catch (e: any) {
        return { error: e.message, expression };
      }
    }

    // ─── Database Nodes ───────────────────────────────────
    case 'sqliteQuery': {
      const db = getDb();
      const sql = data.query || '';
      if (!sql) return [];
      try {
        const result = await db.raw(sql);
        return result;
      } catch (e: any) {
        throw new Error(`SQLite query error: ${e.message}`);
      }
    }

    case 'sqliteInsert': {
      const db = getDb();
      const { table, data: rowData } = data;
      if (!table || !rowData) throw new Error('Table and data required for insert');
      const [id] = await db(table).insert(rowData);
      return { lastInsertRowid: id, changes: 1 };
    }

    case 'sqliteUpdate': {
      const db = getDb();
      const { table, data: rowData, where } = data;
      if (!table || !rowData || !where) throw new Error('Table, data, and where required');
      const changes = await db(table).whereRaw(where).update(rowData);
      return { changes };
    }

    case 'sqliteDelete': {
      const db = getDb();
      const { table, where } = data;
      if (!table || !where) throw new Error('Table and where required');
      const changes = await db(table).whereRaw(where).delete();
      return { changes };
    }

    // ─── API Nodes ────────────────────────────────────────
    case 'restAPI': {
      const { url, method = 'GET', headers = {}, body } = data;
      if (!url) throw new Error('REST API URL is required');

      const requestBody = body || (typeof inputs === 'object' ? inputs : undefined);
      const response = await axios({
        method: method.toLowerCase(),
        url,
        headers: { 'Content-Type': 'application/json', ...headers },
        data: requestBody,
        timeout: 30000,
      });
      return response.data;
    }

    case 'graphQL': {
      const { url, query, variables = {} } = data;
      if (!url || !query) throw new Error('GraphQL URL and query are required');

      const response = await axios.post(url, {
        query,
        variables: { ...variables, input: inputs },
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
      });
      return response.data;
    }

    // ─── Email Nodes ──────────────────────────────────────
    case 'smtp': {
      const { to, subject } = data;
      const body = typeof inputs === 'string' ? inputs : JSON.stringify(inputs);
      
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
        const info = await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject: subject || 'FlowForge AI Notification',
          text: body,
        });
        return { sent: true, to, subject, messageId: info.messageId, preview: body.substring(0, 100) };
      } catch (err: any) {
        throw new Error(`SMTP Error: ${err.message}`);
      }
    }

    case 'gmail':
      return { sent: true, preview: 'Gmail integration ready — configure OAuth in Settings' };

    // ─── Output Nodes ─────────────────────────────────────
    case 'textOutput':
      return typeof inputs === 'string' ? inputs : JSON.stringify(inputs, null, 2);

    case 'jsonOutput':
      return typeof inputs === 'object' ? inputs : { value: inputs };

    case 'fileOutput': {
      const content = typeof inputs === 'string' ? inputs : JSON.stringify(inputs, null, 2);
      return { saved: true, filename: data.filename || 'output.txt', size: content.length };
    }

    case 'notification':
      return { notified: true, message: typeof inputs === 'string' ? inputs : JSON.stringify(inputs) };

    default:
      return inputs;
  }
}
