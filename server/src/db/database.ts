import knex, { Knex } from 'knex';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

let db: Knex;

export function getDb(): Knex {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

export async function initDatabase(): Promise<void> {
  const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/flowforge.db');
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

  db = knex({
    client: 'sqlite3',
    connection: { filename: dbPath },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn: any, done: any) => {
        conn.run('PRAGMA foreign_keys = ON', done);
      },
    },
  });

  await runMigrations();
  await seedTemplates();
  logger.info(`📦 SQLite database ready at: ${dbPath}`);
}

async function runMigrations(): Promise<void> {
  // Users
  if (!(await db.schema.hasTable('users'))) {
    await db.schema.createTable('users', (t) => {
      t.string('id').primary();
      t.string('email').unique().notNullable();
      t.string('password_hash');
      t.string('name').notNullable();
      t.string('avatar');
      t.string('role').defaultTo('user');
      t.integer('verified').defaultTo(0);
      t.string('provider').defaultTo('local');
      t.string('provider_id');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // Refresh tokens
  if (!(await db.schema.hasTable('refresh_tokens'))) {
    await db.schema.createTable('refresh_tokens', (t) => {
      t.string('id').primary();
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('token').unique().notNullable();
      t.string('expires_at').notNullable();
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Projects
  if (!(await db.schema.hasTable('projects'))) {
    await db.schema.createTable('projects', (t) => {
      t.string('id').primary();
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name').notNullable();
      t.text('description');
      t.string('color').defaultTo('#7C3AED');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // Workflows
  if (!(await db.schema.hasTable('workflows'))) {
    await db.schema.createTable('workflows', (t) => {
      t.string('id').primary();
      t.string('project_id');
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('name').notNullable();
      t.text('description');
      t.text('graph_json').defaultTo('{"nodes":[],"edges":[]}');
      t.string('status').defaultTo('draft');
      t.integer('is_active').defaultTo(1);
      t.text('tags').defaultTo('[]');
      t.timestamp('created_at').defaultTo(db.fn.now());
      t.timestamp('updated_at').defaultTo(db.fn.now());
    });
  }

  // Workflow versions
  if (!(await db.schema.hasTable('workflow_versions'))) {
    await db.schema.createTable('workflow_versions', (t) => {
      t.string('id').primary();
      t.string('workflow_id').notNullable().references('id').inTable('workflows').onDelete('CASCADE');
      t.integer('version').notNullable();
      t.text('graph_json').notNullable();
      t.string('created_by');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Executions
  if (!(await db.schema.hasTable('executions'))) {
    await db.schema.createTable('executions', (t) => {
      t.string('id').primary();
      t.string('workflow_id').notNullable().references('id').inTable('workflows').onDelete('CASCADE');
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('status').defaultTo('pending');
      t.string('triggered_by').defaultTo('manual');
      t.text('input_data').defaultTo('{}');
      t.text('output_data').defaultTo('{}');
      t.text('error');
      t.timestamp('started_at');
      t.timestamp('finished_at');
      t.integer('duration_ms');
      t.integer('nodes_executed').defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Execution logs
  if (!(await db.schema.hasTable('execution_logs'))) {
    await db.schema.createTable('execution_logs', (t) => {
      t.string('id').primary();
      t.string('execution_id').notNullable().references('id').inTable('executions').onDelete('CASCADE');
      t.string('node_id');
      t.string('node_type');
      t.string('node_label');
      t.string('level').defaultTo('info');
      t.text('message').notNullable();
      t.text('data_json');
      t.timestamp('timestamp').defaultTo(db.fn.now());
    });
  }

  // Templates
  if (!(await db.schema.hasTable('templates'))) {
    await db.schema.createTable('templates', (t) => {
      t.string('id').primary();
      t.string('user_id');
      t.string('name').notNullable();
      t.text('description');
      t.string('category').defaultTo('general');
      t.string('icon').defaultTo('⚡');
      t.text('graph_json').notNullable();
      t.integer('is_public').defaultTo(1);
      t.integer('is_builtin').defaultTo(0);
      t.integer('downloads').defaultTo(0);
      t.text('tags').defaultTo('[]');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // API keys
  if (!(await db.schema.hasTable('api_keys'))) {
    await db.schema.createTable('api_keys', (t) => {
      t.string('id').primary();
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('provider').notNullable();
      t.text('key_encrypted').notNullable();
      t.string('label');
      t.integer('is_active').defaultTo(1);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Integrations
  if (!(await db.schema.hasTable('integrations'))) {
    await db.schema.createTable('integrations', (t) => {
      t.string('id').primary();
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('type').notNullable();
      t.string('label');
      t.text('config_json').defaultTo('{}');
      t.string('status').defaultTo('connected');
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Notifications
  if (!(await db.schema.hasTable('notifications'))) {
    await db.schema.createTable('notifications', (t) => {
      t.string('id').primary();
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('type').defaultTo('info');
      t.string('title').notNullable();
      t.text('message');
      t.text('data_json').defaultTo('{}');
      t.integer('read').defaultTo(0);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Schedules
  if (!(await db.schema.hasTable('schedules'))) {
    await db.schema.createTable('schedules', (t) => {
      t.string('id').primary();
      t.string('workflow_id').notNullable().references('id').inTable('workflows').onDelete('CASCADE');
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('cron_expression').notNullable();
      t.string('timezone').defaultTo('UTC');
      t.timestamp('next_run');
      t.timestamp('last_run');
      t.integer('enabled').defaultTo(1);
      t.timestamp('created_at').defaultTo(db.fn.now());
    });
  }

  // Password resets
  if (!(await db.schema.hasTable('password_resets'))) {
    await db.schema.createTable('password_resets', (t) => {
      t.string('id').primary();
      t.string('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      t.string('token').unique().notNullable();
      t.string('expires_at').notNullable();
    });
  }

  logger.info('✅ Database migrations completed');
}

async function seedTemplates(): Promise<void> {
  const count = await db('templates').where('is_builtin', 1).count('id as c').first() as any;
  if (parseInt(count?.c || '0') > 0) return;

  const templates = [
    {
      id: 'tpl_email_assistant',
      name: 'AI Email Assistant',
      description: 'Automatically draft and send professional emails using AI',
      category: 'email',
      icon: '📧',
      tags: '["email","ai","automation"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'textInput', position: { x: 100, y: 200 }, data: { label: 'Email Topic', placeholder: 'Enter email topic...' } },
          { id: 'n2', type: 'aiNode', position: { x: 400, y: 200 }, data: { label: 'Draft Email', provider: 'ollama', systemPrompt: 'You are a professional email writer. Write a concise, professional email.' } },
          { id: 'n3', type: 'textOutput', position: { x: 700, y: 200 }, data: { label: 'Email Draft' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n2', target: 'n3', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_blog_writer',
      name: 'Blog Post Writer',
      description: 'Generate full blog posts from a topic with AI',
      category: 'content',
      icon: '✍️',
      tags: '["blog","content","writing"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'textInput', position: { x: 100, y: 200 }, data: { label: 'Blog Topic' } },
          { id: 'n2', type: 'aiNode', position: { x: 350, y: 100 }, data: { label: 'Generate Outline', systemPrompt: 'Create a detailed blog outline with 5 sections.' } },
          { id: 'n3', type: 'aiNode', position: { x: 600, y: 200 }, data: { label: 'Write Full Post', systemPrompt: 'Write a comprehensive 800-word blog post based on this outline.' } },
          { id: 'n4', type: 'textOutput', position: { x: 900, y: 200 }, data: { label: 'Blog Post' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n2', target: 'n3', animated: true },
          { id: 'e3', source: 'n3', target: 'n4', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_pdf_chatbot',
      name: 'PDF Chatbot',
      description: 'Upload a PDF and chat with its contents using AI',
      category: 'documents',
      icon: '📄',
      tags: '["pdf","chatbot","rag"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'fileUpload', position: { x: 100, y: 150 }, data: { label: 'Upload PDF', accept: '.pdf' } },
          { id: 'n2', type: 'chatInput', position: { x: 100, y: 350 }, data: { label: 'Your Question' } },
          { id: 'n3', type: 'aiNode', position: { x: 450, y: 250 }, data: { label: 'AI Answer', systemPrompt: 'Answer questions based on the provided document context.' } },
          { id: 'n4', type: 'textOutput', position: { x: 750, y: 250 }, data: { label: 'Answer' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n3', animated: true },
          { id: 'e2', source: 'n2', target: 'n3', animated: true },
          { id: 'e3', source: 'n3', target: 'n4', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_youtube_script',
      name: 'YouTube Script Generator',
      description: 'Create engaging YouTube scripts from any topic',
      category: 'content',
      icon: '🎬',
      tags: '["youtube","script","video"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'textInput', position: { x: 100, y: 200 }, data: { label: 'Video Topic' } },
          { id: 'n2', type: 'aiNode', position: { x: 400, y: 100 }, data: { label: 'Hook Generator', systemPrompt: 'Create a powerful 30-second hook for a YouTube video.' } },
          { id: 'n3', type: 'aiNode', position: { x: 400, y: 300 }, data: { label: 'Script Writer', systemPrompt: 'Write a full 5-minute YouTube script with intro, 3 main points, and outro.' } },
          { id: 'n4', type: 'textOutput', position: { x: 700, y: 200 }, data: { label: 'Complete Script' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n1', target: 'n3', animated: true },
          { id: 'e3', source: 'n2', target: 'n4', animated: true },
          { id: 'e4', source: 'n3', target: 'n4', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_resume_reviewer',
      name: 'Resume Reviewer',
      description: 'AI-powered resume analysis and improvement suggestions',
      category: 'hr',
      icon: '📋',
      tags: '["resume","hr","analysis"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'fileUpload', position: { x: 100, y: 200 }, data: { label: 'Upload Resume' } },
          { id: 'n2', type: 'aiNode', position: { x: 400, y: 200 }, data: { label: 'Review & Score', systemPrompt: 'Analyze this resume: 1) Score 0-100, 2) Strengths, 3) Weaknesses, 4) Top 5 improvements.' } },
          { id: 'n3', type: 'textOutput', position: { x: 700, y: 200 }, data: { label: 'Review Report' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n2', target: 'n3', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_meeting_summarizer',
      name: 'Meeting Summarizer',
      description: 'Summarize meeting notes and extract action items',
      category: 'productivity',
      icon: '🤝',
      tags: '["meeting","summary","productivity"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'textInput', position: { x: 100, y: 200 }, data: { label: 'Meeting Notes', multiline: true } },
          { id: 'n2', type: 'aiNode', position: { x: 400, y: 100 }, data: { label: 'Summarize', systemPrompt: 'Summarize this meeting in 3-5 bullet points.' } },
          { id: 'n3', type: 'aiNode', position: { x: 400, y: 300 }, data: { label: 'Extract Actions', systemPrompt: 'Extract all action items with owners and deadlines.' } },
          { id: 'n4', type: 'textOutput', position: { x: 700, y: 200 }, data: { label: 'Summary + Actions' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n1', target: 'n3', animated: true },
          { id: 'e3', source: 'n2', target: 'n4', animated: true },
          { id: 'e4', source: 'n3', target: 'n4', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_lead_qualifier',
      name: 'Lead Qualification Agent',
      description: 'Auto-qualify leads from webhooks with AI scoring',
      category: 'sales',
      icon: '🎯',
      tags: '["leads","sales","crm"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'webhook', position: { x: 100, y: 200 }, data: { label: 'Lead Webhook' } },
          { id: 'n2', type: 'aiNode', position: { x: 400, y: 200 }, data: { label: 'Qualify Lead', systemPrompt: 'Score this lead 1-10 and explain. Return JSON: {score, reason, priority}' } },
          { id: 'n3', type: 'ifElse', position: { x: 650, y: 200 }, data: { label: 'Score > 7?', condition: 'score > 7' } },
          { id: 'n4', type: 'restAPI', position: { x: 900, y: 100 }, data: { label: 'Add to CRM', method: 'POST' } },
          { id: 'n5', type: 'textOutput', position: { x: 900, y: 300 }, data: { label: 'Low Priority' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n2', target: 'n3', animated: true },
          { id: 'e3', source: 'n3', target: 'n4', sourceHandle: 'true', animated: true },
          { id: 'e4', source: 'n3', target: 'n5', sourceHandle: 'false', animated: true },
        ],
      }),
    },
    {
      id: 'tpl_customer_support',
      name: 'Customer Support Agent',
      description: 'Intelligent support with intent classification',
      category: 'support',
      icon: '🎧',
      tags: '["support","customer","chat"]',
      graph_json: JSON.stringify({
        nodes: [
          { id: 'n1', type: 'chatInput', position: { x: 100, y: 200 }, data: { label: 'Customer Message' } },
          { id: 'n2', type: 'aiNode', position: { x: 350, y: 200 }, data: { label: 'Intent Classifier', systemPrompt: 'Classify intent: billing, technical, general, complaint. JSON: {intent, confidence}' } },
          { id: 'n3', type: 'switchNode', position: { x: 600, y: 200 }, data: { label: 'Route by Intent' } },
          { id: 'n4', type: 'aiNode', position: { x: 850, y: 100 }, data: { label: 'Billing Response', systemPrompt: 'You are a billing specialist. Help resolve billing issues professionally.' } },
          { id: 'n5', type: 'aiNode', position: { x: 850, y: 300 }, data: { label: 'Tech Response', systemPrompt: 'You are a tech support expert. Give step-by-step help.' } },
          { id: 'n6', type: 'textOutput', position: { x: 1100, y: 200 }, data: { label: 'Response' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', animated: true },
          { id: 'e2', source: 'n2', target: 'n3', animated: true },
          { id: 'e3', source: 'n3', target: 'n4', animated: true },
          { id: 'e4', source: 'n3', target: 'n5', animated: true },
          { id: 'e5', source: 'n4', target: 'n6', animated: true },
          { id: 'e6', source: 'n5', target: 'n6', animated: true },
        ],
      }),
    },
  ];

  await db('templates').insert(templates.map(t => ({ ...t, is_builtin: 1 })));
  logger.info(`🌱 Seeded ${templates.length} built-in templates`);
}

export default { getDb, initDatabase };
