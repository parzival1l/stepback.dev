# Architecture & Infrastructure Documentation

This document provides a comprehensive overview of the tooling, infrastructure, and technical architecture used in stepback.dev.

## **Frontend Tooling & Infrastructure**

### **React Setup**
- **React Version**: 19.2.0 (latest stable)
- **React DOM**: 19.2.0
- **Build Tool**: Vite 7.2.4
- **Language**: JavaScript (JSX), not TypeScript
- **Node.js Requirement**: >=20 <23

### **Build & Development Tools**
- **Vite**: Modern build tool providing:
  - Lightning-fast dev server
  - Hot Module Replacement (HMR)
  - Optimized production builds
  - Path aliases configured (`@/` for `src/`)
- **ESLint 9**: Flat config format with:
  - React hooks plugin
  - React refresh plugin
  - Browser globals
- **PostCSS**: Tailwind CSS processing
- **Autoprefixer**: Automatic CSS vendor prefixing

### **Styling System**
- **Tailwind CSS 4.1.17**: Latest version (v4) with:
  - Custom Claude-inspired color scheme
  - CSS Variables for theme customization
  - Custom fonts: Anthropic Serif, Lora, Georgia
- **shadcn/ui Components**: Pre-built accessible components based on Radix UI primitives
- **Component Library**: Radix UI primitives for accessibility

### **State Management**
- **Zustand 5.0.9**: Lightweight state management for:
  - Chat tree structure
  - Session management
  - Active node tracking
  - Model selection
- **React Context API**: Authentication state (`AuthContext`)

### **UI Component Libraries**
- **Radix UI Primitives**:
  - Avatar, Dialog, Dropdown Menu, Scroll Area, Select, Separator, Tooltip
- **Lucide React**: Icon library
- **ReactFlow 11.11.4**: Graph visualization for conversation trees
- **React Resizable Panels**: Resizable layout components
- **React Markdown**: Markdown rendering with `remark-gfm` support
- **React Syntax Highlighter**: Code syntax highlighting
- **Dagre**: Graph layout algorithms for tree positioning

### **Component Architecture**

The frontend uses a layered component structure:

```
frontend/src/
├── components/          # Main application components
│   ├── ChatWindow.jsx  # Main chat interface
│   ├── TreeGraph.jsx   # ReactFlow graph visualization
│   ├── SessionSidebar.jsx # Session management sidebar
│   ├── AuthGate.jsx    # Authentication UI
│   ├── ModelSelector.jsx # AI model selection
│   └── ui/             # shadcn/ui components (button, dialog, etc.)
├── contexts/           # React Context providers
│   └── AuthContext.jsx # Authentication state management
├── hooks/              # Custom React hooks
│   └── useDarkMode.jsx # Theme management hook
├── services/           # API service layer
│   └── auth.js         # Authentication service
└── utils/              # Utility functions
    └── apiClient.js    # HTTP client wrapper
```

**Key Components:**
- `App.jsx`: Root component with view switching (Chat/Graph)
- `ChatWindow.jsx`: Chat interface with message history
- `TreeGraph.jsx`: ReactFlow-based conversation tree visualization
- `SessionSidebar.jsx`: Session list and management
- `AuthGate.jsx`: Login form for auth code entry

## **Backend Infrastructure**

### **Framework & Runtime**
- **FastAPI**: Modern async web framework
- **Uvicorn**: ASGI server for running FastAPI
- **Python**: 3.8+ (virtual environment: `stepback_env/`)

### **Database Layer**
- **Repository Pattern**: Clean abstraction layer for database operations
- **Supported Databases**:
  - **MongoDB** (default): Using Beanie ODM + Motor (async driver)
  - **Google Cloud Firestore**: Stub implementation (not fully implemented)
- **Factory Pattern**: `DatabaseFactory` selects database at runtime via `DATABASE_TYPE` env var

**Repository Structure:**
```
backend/repositories/
├── base.py          # Abstract interfaces (ABC)
├── mongodb.py       # MongoDB implementation ✅
├── firestore.py     # Firestore stub 🚧
└── factory.py       # Database factory
```

**Data Models (Beanie ODM):**
- `Session`: Chat sessions with title, timestamps, active node tracking
- `ChatNode`: Tree-structured conversation nodes with:
  - `parent_id`: Tree parent reference
  - `path`: Ordered list of ancestor IDs
  - `role`: "user", "assistant", or "system"
  - `content`: Message content
  - `model`: AI model used
  - Merge fields: `is_merge_summary`, `merge_source_branch_id`

### **API Architecture**
- **REST API** with Pydantic models for request/response validation
- **CORS**: Configured for multiple localhost ports (5173-5176, 3000)
- **Authentication**: Bearer token (16-character auth code)
- **Endpoints**:
  - `/sessions`: CRUD operations for chat sessions
  - `/chat/message`: Send messages, get AI responses
  - `/chat/history/{node_id}`: Get conversation history up to a node
  - `/session/{session_id}/tree`: Get full conversation tree
  - `/models`: Get available AI models

### **Authentication System**
- **Current**: Simple hash-based auth (`backend/auth/hash_auth.py`)
- **Modular Design**: Ready for OAuth (`backend/auth/oauth.py` exists)
- **Token Storage**: Frontend uses `sessionStorage`
- **Protected Endpoints**: All except `/` and `/models`

## **AI Infrastructure**

### **LLM Service (`backend/llm.py`)**
- **Multi-Provider Support**:
  - **Google Gemini**: Primary provider (via `google-generativeai`)
  - **HuggingFace**: Secondary provider (via OpenAI-compatible API)

### **Model Configuration**
- Models defined in `backend/models.json`:
  - `gemini-2.5-flash`: Google Gemini 2.5 Flash
  - `gpt-oss`: Open-source GPT via HuggingFace (`openai/gpt-oss-120b:groq`)

### **AI Features**
- **Context Management**: Maintains conversation history along branch paths
- **System Logging**: Creates system nodes to log AI invocations
- **History Filtering**: Skips system nodes when sending context to LLM
- **Async Operations**: All LLM calls are async

### **How It Works**
1. User sends message → Creates user node
2. System logs invocation → Creates system node
3. Fetches conversation history → Builds context from ancestor nodes
4. Calls LLM service → Generates response
5. Creates assistant node → Stores AI response

## **Development Workflow**

### **Startup Script**
- `start_app.sh`: Starts both backend and frontend
- **Backend**: `uvicorn backend.main:app --reload --port 8000`
- **Frontend**: `npm run dev` (Vite dev server on port 5173)

### **Environment Configuration**
- `.env` file required with:
  - `AUTH_CODE`: 16-character authentication code
  - `GOOGLE_API_KEY`: Gemini API key
  - `HF_TOKEN`: (Optional) HuggingFace token
  - `DATABASE_TYPE`: "mongodb" or "firestore"
  - `MONGO_URI`: MongoDB connection string
  - `DB_NAME`: Database name

## **Architecture Highlights**

1. **Separation of Concerns**: Clear frontend/backend split
2. **Database Abstraction**: Easy to swap databases via repository pattern
3. **Type Safety**: Pydantic models on backend, PropTypes could be added to frontend
4. **Async-First**: FastAPI async endpoints, async database operations
5. **Modular Components**: Reusable UI components via shadcn/ui
6. **State Management**: Zustand for global state, Context for auth
7. **Graph Visualization**: ReactFlow for interactive conversation trees
8. **Modern Stack**: Latest React 19, Tailwind v4, FastAPI

## **Technology Stack Summary**

### **Frontend**
- React 19.2.0
- Vite 7.2.4
- Tailwind CSS 4.1.17
- Zustand 5.0.9
- ReactFlow 11.11.4
- Radix UI / shadcn/ui
- Lucide React

### **Backend**
- FastAPI
- Uvicorn
- Beanie ODM (MongoDB)
- Motor (async MongoDB driver)
- Pydantic
- Google Generative AI SDK
- OpenAI SDK (for HuggingFace)

### **Database**
- MongoDB (default)
- Google Cloud Firestore (stub)

### **AI Providers**
- Google Gemini 2.5 Flash
- HuggingFace Inference API

## **File Structure**

```
stepback.dev/
├── ARCHITECTURE.md          # This file
├── README.md                # Project overview
├── DATABASE.md              # Database migration guide
├── backend/
│   ├── main.py             # FastAPI application & endpoints
│   ├── database.py         # Database initialization
│   ├── models.py           # Beanie data models
│   ├── llm.py              # Gemini AI service
│   ├── models.json         # AI model configurations
│   ├── requirements.txt    # Python dependencies
│   ├── auth/               # Authentication modules
│   └── repositories/       # Database abstraction layer
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── services/       # API services
│   │   └── utils/          # Utility functions
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── tailwind.config.js  # Tailwind configuration
│   └── components.json     # shadcn/ui configuration
└── start_app.sh            # Startup script
```

This is a modern, async-first application with a clear separation between UI, API, and data layers, designed for extensibility and maintainability.

