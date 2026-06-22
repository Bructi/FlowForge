import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, ArrowRight, Workflow, Brain, Shield, Play, Globe, Database, Cpu } from 'lucide-react'

const FEATURES = [
  { icon: Workflow, title: 'Visual Workflow Builder', desc: 'Drag, drop, and connect nodes on an infinite canvas powered by React Flow.' },
  { icon: Brain, title: '6 AI Providers', desc: 'Ollama (local), OpenAI, Gemini, Claude, DeepSeek, and Groq — unified interface.' },
  { icon: Shield, title: 'Self-Hosted', desc: 'Run everything on your own machine. No cloud lock-in. No per-call fees.' },
  { icon: Play, title: 'DAG Execution Engine', desc: 'Parallel processing, retry logic, and real-time execution logs via WebSocket.' },
  { icon: Database, title: 'SQLite Built-In', desc: 'Native database nodes. Query, insert, update, delete — no external DB needed.' },
  { icon: Globe, title: '36+ Node Types', desc: 'Input, AI, Logic, Utility, Database, API, Email, and Output nodes.' },
]

const TEMPLATES = [
  { emoji: '📧', name: 'AI Email Assistant', category: 'Email' },
  { emoji: '📄', name: 'PDF Chatbot', category: 'Documents' },
  { emoji: '✍️', name: 'Blog Writer', category: 'Content' },
  { emoji: '🎬', name: 'YouTube Script', category: 'Content' },
  { emoji: '📋', name: 'Resume Reviewer', category: 'HR' },
  { emoji: '🤝', name: 'Meeting Summarizer', category: 'Productivity' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-100 sticky top-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-6">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center shadow">
              <Zap className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="text-lg font-bold text-slate-900">FlowForge AI</span>
          </div>
          <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Log In</Link>
          <Link to="/signup" className="btn-primary btn-sm">Get Started Free</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 border border-violet-100 rounded-full text-sm text-violet-700 font-medium mb-8">
            <Cpu className="w-4 h-4" />
            <span>Self-hosted · No API costs with Ollama · Open source</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight mb-6">
            Build AI Workflows{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-500">Visually</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            The open-source alternative to n8n, Langflow, and Zapier. Connect AI models, APIs, databases, and email services — without writing code.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              id="hero-get-started-btn"
              onClick={() => navigate('/signup')}
              className="btn-primary btn-lg"
            >
              Start Building Free
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              id="hero-demo-btn"
              onClick={() => navigate('/login')}
              className="btn-secondary btn-lg"
            >
              View Demo
            </button>
          </div>
        </motion.div>

        {/* Canvas Preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-16 relative"
        >
          <div className="bg-[#f8f9ff] border border-slate-200 rounded-2xl overflow-hidden shadow-xl p-8 text-left">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 text-sm text-slate-400 font-mono">flowforge-ai / builder</div>
            </div>
            {/* Fake canvas */}
            <div className="relative h-56 bg-white rounded-xl border border-slate-100 overflow-hidden" style={{ backgroundImage: 'radial-gradient(circle, #e2e8f0 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
              {/* Node 1 */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 flow-node w-44">
                <div className="flow-node-header bg-blue-50 text-blue-700">
                  <span>💬</span> Chat Input
                </div>
                <div className="flow-node-body text-slate-500">User message</div>
              </div>
              {/* Arrow */}
              <svg className="absolute left-52 top-1/2 -translate-y-1/2" width="60" height="20" viewBox="0 0 60 20">
                <path d="M0,10 L50,10" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="50,6 60,10 50,14" fill="#7c3aed" />
              </svg>
              {/* Node 2 */}
              <div className="absolute left-56 top-1/2 -translate-y-1/2 flow-node w-48" style={{ borderColor: '#7c3aed', boxShadow: '0 0 0 3px rgba(124,58,237,0.15)' }}>
                <div className="flow-node-header" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                  <span>🤖</span> AI Model
                </div>
                <div className="flow-node-body text-slate-500">Ollama · llama3.2</div>
              </div>
              {/* Arrow 2 */}
              <svg className="absolute" style={{ left: '468px', top: '50%', transform: 'translateY(-50%)' }} width="60" height="20" viewBox="0 0 60 20">
                <path d="M0,10 L50,10" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 2" />
                <polygon points="50,6 60,10 50,14" fill="#7c3aed" />
              </svg>
              {/* Node 3 */}
              <div className="absolute flow-node w-44" style={{ left: '528px', top: '50%', transform: 'translateY(-50%)' }}>
                <div className="flow-node-header bg-emerald-50 text-emerald-700">
                  <span>📤</span> Text Output
                </div>
                <div className="flow-node-body text-slate-500">AI response</div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="bg-[#f8f9ff] py-20 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-3">Everything you need to automate AI</h2>
          <p className="text-slate-500 text-center mb-12">Build powerful pipelines in minutes, not months.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="card p-6"
              >
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-3">Start with a template</h2>
          <p className="text-slate-500 text-center mb-12">8 production-ready workflows. One click to deploy.</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TEMPLATES.map(({ emoji, name, category }) => (
              <div key={name} className="card p-5 cursor-pointer group" onClick={() => navigate('/signup')}>
                <div className="text-3xl mb-3">{emoji}</div>
                <div className="font-semibold text-slate-900 text-sm group-hover:text-violet-600 transition-colors">{name}</div>
                <div className="text-xs text-slate-400 mt-1">{category}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-violet-600 to-purple-700 py-20">
        <div className="max-w-2xl mx-auto text-center px-6">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to automate your AI workflows?</h2>
          <p className="text-violet-200 mb-8">Free forever. Self-hosted. No vendor lock-in.</p>
          <button
            id="cta-signup-btn"
            onClick={() => navigate('/signup')}
            className="bg-white text-violet-700 font-semibold px-8 py-3 rounded-xl hover:bg-violet-50 transition-colors shadow-lg"
          >
            Create Free Account →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8 text-center">
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Zap className="w-4 h-4 text-violet-500" />
          <span>FlowForge AI — Built with MERN + SQLite</span>
        </div>
      </footer>
    </div>
  )
}
