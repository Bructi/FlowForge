# FlowForge AI

FlowForge AI is a visual, node-based automation platform designed to build and execute complex workflows seamlessly. It allows users to string together AI providers, external APIs, databases, and custom logic using an intuitive drag-and-drop interface.

## 🚀 Features

### Visual Workflow Builder
- **Drag-and-Drop Interface:** Easily connect inputs, logic nodes, AI models, and output actions using a React Flow powered canvas.
- **Configurable Nodes:** Click on any node to configure its properties, prompts, scripts, or API keys directly in the builder drawer.
- **Real-time Execution Logs:** Run workflows directly from the builder and see real-time execution traces, outputs, and errors for every single node.

### Multi-Model AI Integration
Seamlessly switch between multiple state-of-the-art AI models within the same workflow.
Supported Providers:
- OpenAI
- Google Gemini
- Anthropic Claude
- DeepSeek
- Groq
- OpenRouter
- Ollama (Local Models)

### Comprehensive Node Library
- **Input/Output:** Text Input, Chat Input, File Upload, Webhook Triggers, Text/JSON/File Outputs.
- **Logic & Flow:** If/Else, Switch, Loop, Filter, Delay, and Schedulers.
- **Data Utilities:** Formatter, JSON Parser, Regex processing, Text Cleaners, and Mathematical Calculators.
- **Integrations:** REST APIs, GraphQL, SQLite Queries, and basic Email stubs.

## 🛠️ Tech Stack

**Frontend (Client)**
- React 18
- Vite
- TypeScript
- TailwindCSS (Styling & Animations)
- React Flow (Node Canvas)
- Zustand (State Management)
- Framer Motion (Animations)
- React Hot Toast (Notifications)

**Backend (Server)**
- Node.js & Express
- TypeScript
- SQLite3 (via Knex.js query builder)
- JSON Web Tokens (JWT Authentication)
- Axios (External HTTP Requests)
- Bcrypt (Password Hashing)

## 📦 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### 1. Installation
Clone the repository, then install dependencies for both the frontend and backend.
```bash
# Install root dependencies (like concurrently)
npm install

# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory and configure your desired settings:
```env
# Server
PORT=3001
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Database
DB_CLIENT=sqlite3
DB_FILENAME=./server/data/flowforge.db

# AI Providers (Optional - can also be configured in the UI)
OPENAI_API_KEY=your_key
GOOGLE_GEMINI_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
DEEPSEEK_API_KEY=your_key
GROQ_API_KEY=your_key
OPENROUTER_API_KEY=your_key
```

### 3. Running the App
Run both the frontend and backend simultaneously from the root directory:
```bash
npm run dev
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

## 🔒 Authentication
FlowForge uses a secure JWT-based authentication system. By default, your session token lasts for 7 days to prevent random logouts during development server restarts. 

## 🧠 Execution Engine
When a workflow is executed, the backend `ExecutionEngine.ts` topologically sorts the nodes and runs them asynchronously. Data passes from one node's output into the next node's input automatically. 

*Note: While most nodes (AI, Logic, APIs, Database) are fully functional, a few integration nodes like SMTP and File Output are currently stubs that will be fully implemented in future updates.*

## 📜 License
MIT License
