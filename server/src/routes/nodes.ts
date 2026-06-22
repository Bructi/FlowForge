import { Router, Response, Request } from 'express';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// ─── GET /api/nodes/types ─────────────────────────────────
router.get('/types', asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      categories: [
        {
          id: 'input',
          label: 'Inputs',
          color: '#2563EB',
          nodes: [
            { type: 'textInput', label: 'Text Input', description: 'Static or dynamic text value', icon: '📝' },
            { type: 'chatInput', label: 'Chat Input', description: 'User message / chat turn', icon: '💬' },
            { type: 'fileUpload', label: 'File Upload', description: 'Upload any file', icon: '📁' },
            { type: 'webhook', label: 'Webhook', description: 'Receive HTTP webhook triggers', icon: '🔗' },
            { type: 'apiInput', label: 'API Input', description: 'HTTP GET trigger', icon: '🌐' },
          ],
        },
        {
          id: 'ai',
          label: 'AI Models',
          color: '#7C3AED',
          nodes: [
            { type: 'aiNode', label: 'AI Model', description: 'OpenAI, Gemini, Claude, Ollama, DeepSeek, Groq', icon: '🤖' },
          ],
        },
        {
          id: 'logic',
          label: 'Logic',
          color: '#D97706',
          nodes: [
            { type: 'ifElse', label: 'If / Else', description: 'Conditional branching', icon: '🔀' },
            { type: 'switchNode', label: 'Switch', description: 'Multi-path routing', icon: '🔃' },
            { type: 'filter', label: 'Filter', description: 'Filter array items', icon: '🔽' },
            { type: 'loop', label: 'Loop', description: 'Iterate over items', icon: '🔁' },
            { type: 'delay', label: 'Delay', description: 'Wait N seconds', icon: '⏱️' },
            { type: 'scheduler', label: 'Scheduler', description: 'Time-based trigger', icon: '📅' },
          ],
        },
        {
          id: 'utility',
          label: 'Utilities',
          color: '#059669',
          nodes: [
            { type: 'formatter', label: 'Formatter', description: 'Format and template strings', icon: '✏️' },
            { type: 'jsonParser', label: 'JSON Parser', description: 'Parse JSON strings', icon: '{ }' },
            { type: 'regex', label: 'Regex', description: 'Pattern matching', icon: '🔤' },
            { type: 'textCleaner', label: 'Text Cleaner', description: 'Trim, strip, normalize text', icon: '🧹' },
            { type: 'calculator', label: 'Calculator', description: 'Math expressions', icon: '🧮' },
          ],
        },
        {
          id: 'database',
          label: 'Database',
          color: '#DC2626',
          nodes: [
            { type: 'sqliteQuery', label: 'SQLite Query', description: 'Run SELECT queries', icon: '🗄️' },
            { type: 'sqliteInsert', label: 'SQLite Insert', description: 'Insert rows', icon: '➕' },
            { type: 'sqliteUpdate', label: 'SQLite Update', description: 'Update rows', icon: '✏️' },
            { type: 'sqliteDelete', label: 'SQLite Delete', description: 'Delete rows', icon: '🗑️' },
          ],
        },
        {
          id: 'api',
          label: 'API',
          color: '#0891B2',
          nodes: [
            { type: 'restAPI', label: 'REST API', description: 'HTTP GET/POST/PUT/DELETE/PATCH', icon: '🌍' },
            { type: 'graphQL', label: 'GraphQL', description: 'GraphQL queries and mutations', icon: '⬡' },
          ],
        },
        {
          id: 'email',
          label: 'Email',
          color: '#BE185D',
          nodes: [
            { type: 'smtp', label: 'SMTP Email', description: 'Send via SMTP', icon: '📨' },
            { type: 'gmail', label: 'Gmail', description: 'Send via Gmail API', icon: '📧' },
          ],
        },
        {
          id: 'output',
          label: 'Outputs',
          color: '#374151',
          nodes: [
            { type: 'textOutput', label: 'Text Output', description: 'Display text result', icon: '📤' },
            { type: 'jsonOutput', label: 'JSON Output', description: 'Display JSON result', icon: '{ }' },
            { type: 'fileOutput', label: 'File Output', description: 'Save to file', icon: '💾' },
            { type: 'notification', label: 'Notification', description: 'Push notification', icon: '🔔' },
          ],
        },
      ],
    },
  });
}));

export default router;
