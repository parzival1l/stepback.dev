# stepback.dev

A git-style conversational AI application that lets you branch off during any chat to ask tangential questions without polluting your main conversation context. Unlike traditional linear chat interfaces, stepback.dev enables you to create branches for side explorations, work through them for any number of turns, then compact and merge them back into your original conversation thread. This level of fine-grained context control and branching is not available in any other chat system

**Website:** [www.stepback.dev](https://www.stepback.dev) (work in progress)
**Contact:** [hello@stepback.dev](mailto:hello@stepback.dev)

## ✨ Features

### Current Features

- **Git-Style Branching** - Branch off from any point in a conversation to ask tangential questions
- **Context Isolation** - Side branches don't pollute your main conversation context
- **Branch Compaction** - Compact and merge branch explorations back into the main thread
- **AI-Powered Responses** - Integrated with Google Gemini 2.5 Flash for intelligent responses
- **Interactive UI** - React-based frontend with ReactFlow graph visualization
- **Session Management** - Create, list, and manage multiple chat sessions
- **Linear History View** - Retrieve conversation history along any branch path
- **Full Graph Visualization** - Interactive node graph powered by ReactFlow
- **Database Flexibility** - Easy switching between MongoDB and Google Cloud Firestore
- **Context-Aware AI** - AI maintains context along each conversation branch
- **System Logging** - Track AI invocations and context length for debugging
- **Modern UI** - Built with React 19, TailwindCSS, and Zustand state management
- **Markdown Support** - Rich text rendering with syntax highlighting

### Architecture Highlights

- **Repository Pattern** - Clean abstraction layer for easy database swapping
- **Async-First** - Built with FastAPI and async/await for optimal performance
- **Type-Safe** - Pydantic models for request/response validation
- **CORS-Enabled** - Ready for frontend integration
- **Modular Design** - Separation of concerns between routing, data access, and AI services

## 🚀 Getting Started

### Prerequisites

- Python 3.8+
- Node.js 20+ (for frontend)
- MongoDB (or Google Cloud Firestore)
- Google Gemini API Key
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/stepback.dev.git
   cd stepback.dev
   ```

2. **Set up Python environment**
   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   # On macOS/Linux:
   source venv/bin/activate
   # On Windows:
   # venv\Scripts\activate
   ```

3. **Install backend dependencies**
   ```bash
   pip install -r backend/requirements.txt
   ```

4. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

5. **Configure environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env

   # Edit .env and add your API keys
   nano .env
   ```

   Required configuration in `.env`:
   ```bash
   # Authentication Code (16 characters, required)
   # Generate with: openssl rand -hex 8
   AUTH_CODE=your16charcode!!

   # Google Gemini API Key (required)
   GOOGLE_API_KEY=your_google_api_key_here

   # Database Configuration
   DATABASE_TYPE=mongodb  # or 'firestore'

   # MongoDB settings (if using MongoDB)
   MONGO_URI=mongodb://localhost:27017
   DB_NAME=stepback
   ```

6. **Start MongoDB** (if using MongoDB)
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod

   # Or run manually
   mongod --dbpath /path/to/data/directory
   ```

7. **Run the full application** (both backend and frontend)
   ```bash
   # Using the startup script (recommended)
   bash start_app.sh
   ```

   This will start:
   - Backend API at `http://localhost:8000`
   - Frontend UI at `http://localhost:5173`

   **Or run manually:**

   ```bash
   # Terminal 1 - Backend
   export PYTHONPATH=$PYTHONPATH:$(pwd)
   python -m uvicorn backend.main:app --reload --port 8000

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

8. **Verify it's running**

   - **Backend:** Visit `http://localhost:8000` - You should see:
     ```json
     {"message": "stepback.dev Backend is Running"}
     ```
   - **Frontend:** Visit `http://localhost:5173` - You should see the stepback.dev UI
   - **API Docs:** Visit `http://localhost:8000/docs` for interactive API documentation

### API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation (Swagger UI).

## 📖 API Endpoints

### Sessions

- `POST /sessions` - Create a new chat session
- `GET /sessions` - List all sessions

### Messages

- `POST /chat/message` - Send a message and get AI response
- `GET /chat/history/{node_id}` - Get conversation history up to a specific node
- `GET /session/{session_id}/tree` - Get complete conversation tree for a session

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         React Frontend (port 5173)          │
│  ┌──────────────────────────────────────┐   │
│  │  UI Components                       │   │
│  │  - TreeFlow (ReactFlow)              │   │
│  │  - Chat Interface                    │   │
│  │  - Session Manager                   │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│  ┌──────────────▼───────────────────────┐   │
│  │  State Management (Zustand)          │   │
│  └──────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────┐
│      FastAPI Backend (port 8000)             │
│  ┌──────────────────────────────────────┐   │
│  │  Endpoints (main.py)                 │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│  ┌──────────────▼───────────────────────┐   │
│  │  Repository Pattern                  │   │
│  │  - SessionRepository                 │   │
│  │  - ChatNodeRepository                │   │
│  └──────────────┬───────────────────────┘   │
│                 │                            │
│  ┌──────────────▼───────────────────────┐   │
│  │  Database Implementations            │   │
│  │  ✅ MongoDB (Beanie)                 │   │
│  │  🚧 Firestore (Stub)                 │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
          │                    │
          ▼                    ▼
    MongoDB/Firestore    Google Gemini API
```

## 🗄️ Data Model

### Session
```python
{
    "id": str,
    "title": str,
    "created_at": datetime,
    "last_active_node_id": str
}
```

### ChatNode (Tree Structure)
```python
{
    "id": str,
    "session_id": str,
    "parent_id": str,           # Parent node in tree
    "role": "user|assistant|system",
    "content": str,
    "path": List[str],          # Ordered ancestor IDs
    "model": str,
    "created_at": datetime
}
```

## 🔧 Configuration

### Authentication

stepback.dev uses a simple 16-character authentication code for access control. This is designed to be easily replaced with OAuth (Google/Microsoft) when deploying to production.

**Setting up authentication:**

1. Generate a 16-character code:
   ```bash
   openssl rand -hex 8
   ```

2. Add it to your `.env` file:
   ```bash
   AUTH_CODE=your16charcode!!
   ```

3. When you access the app, enter this code to authenticate.

**How it works:**
- The auth code is stored in `sessionStorage` (persists across page refreshes)
- Closing the browser clears the auth code (you'll need to re-enter it)
- All API endpoints (except `/` and `/models`) are protected

**Future: OAuth Support**

The authentication system is built with a modular architecture that allows easy migration to OAuth:
- Backend: `backend/auth/` contains abstract providers that can be swapped
- Frontend: `frontend/src/services/auth.js` and `frontend/src/contexts/AuthContext.jsx` provide the auth interface

### Database Options

TreeChat supports multiple database backends:

**MongoDB (Default)**
```bash
DATABASE_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017
DB_NAME=stepback
```

**Google Cloud Firestore** (Implementation required)
```bash
DATABASE_TYPE=firestore
GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
FIRESTORE_PROJECT_ID=your-project-id
```

See [DATABASE.md](DATABASE.md) for detailed migration guide.

## 🧪 Example Usage

### Create a Session
```bash
curl -X POST http://localhost:8000/sessions \
  -H "Content-Type: application/json" \
  -d '{"title": "My First Chat"}'
```

### Send a Message
```bash
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "content": "What is the meaning of life?",
    "role": "user"
  }'
```

### Create a Branch
```bash
# Send a different message from the same parent
curl -X POST http://localhost:8000/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "your-session-id",
    "parent_id": "parent-node-id",
    "content": "Tell me a joke instead",
    "role": "user"
  }'
```

## 📁 Project Structure

```
stepback.dev/
├── backend/
│   ├── repositories/          # Database abstraction layer
│   │   ├── __init__.py       # Package exports
│   │   ├── base.py           # Abstract interfaces
│   │   ├── mongodb.py        # MongoDB implementation ✅
│   │   ├── firestore.py      # Firestore stub 🚧
│   │   └── factory.py        # Database factory
│   ├── main.py               # FastAPI application & endpoints
│   ├── database.py           # Database initialization
│   ├── models.py             # Beanie data models
│   ├── llm.py                # Gemini AI service
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── stores/           # Zustand state management
│   │   └── ...               # Other frontend code
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
├── start_app.sh              # Startup script (both backend & frontend)
├── DATABASE.md               # Database migration guide
└── README.md                 # This file
```

## 🛣️ Roadmap

### In Progress

- 🔀 **Merge Functionality**
  - Enabling Google support
  - Pushing the application to Google

### Coming Soon

- 🌍 **Google Earth Login**
  - Integration with Google Earth authentication

- 🎯 **Multimodal Data Support**
  - Support for images, audio, and other media types in conversations

- 📊 **Langfuse Integration**
  - Connect with Langfuse for enhanced analytics and observability

- 🔌 **Multiple Model Provider Support**
  - Support for various AI model providers beyond Google Gemini

- 🎨 **Basic Frontend Enhancements**
  - UI/UX improvements
  - Enhanced navigation and controls

- 🔍 **Search & Discovery**
  - Full-text search across conversations
  - Tag-based organization and optimizations
  - Smart discovery features

### Future Enhancements

- **Collaborative Features** - Multi-user sessions
- **Version Control** - Track conversation evolution
- **Templates** - Pre-configured conversation starters
- **Plugins** - Extensible architecture for custom features
- **Mobile Apps** - iOS and Android clients
- **Self-Hosting** - Docker containers and deployment guides

## 🤝 Contributing

Contributions are welcome! Areas where help is especially appreciated:

1. **Firestore Implementation** - Completing the Firestore repository implementation
2. **Merge Functionality** - Implementing branch merging and conflict resolution
3. **Frontend Enhancements** - Improving UI/UX, adding new features to the tree visualization
4. **Documentation** - Improving guides and examples
5. **Testing** - Adding unit and integration tests
6. **Features** - Implementing roadmap items

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Backend:** Built with [FastAPI](https://fastapi.tiangolo.com/) and [Beanie ODM](https://beanie-odm.dev/)
- **Frontend:** [React](https://react.dev/), [ReactFlow](https://reactflow.dev/), [TailwindCSS](https://tailwindcss.com/), [Zustand](https://zustand-demo.pmnd.rs/)
- **AI:** Powered by [Google Gemini AI](https://ai.google.dev/)
- **Build Tools:** [Vite](https://vitejs.dev/) for lightning-fast development
- Inspired by tree-based conversation patterns and non-linear dialogue exploration

## 📧 Contact

For questions, suggestions, or discussions:
- Open an issue on GitHub
- Email: [hello@stepback.dev](mailto:hello@stepback.dev)

---

**Happy Branching!**
