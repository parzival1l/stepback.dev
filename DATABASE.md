# Database Architecture & Migration Guide

## Overview

TreeChat uses a **repository pattern** to abstract database operations, making it easy to swap between different database backends without changing application code.

Currently supported databases:
- ✅ **MongoDB** (fully implemented, default)
- 🚧 **Google Cloud Firestore** (stub ready for implementation)

## Architecture

### Repository Pattern

The application uses a three-layer architecture:

```
┌─────────────────────────────────────┐
│   FastAPI Endpoints (main.py)      │
├─────────────────────────────────────┤
│   Repository Interfaces (base.py)  │
├─────────────────────────────────────┤
│   Database Implementations          │
│   - MongoDB (mongodb.py)            │
│   - Firestore (firestore.py)        │
└─────────────────────────────────────┘
```

### Key Components

1. **Base Interfaces** (`backend/repositories/base.py`)
   - `SessionRepository` - Abstract interface for session operations
   - `ChatNodeRepository` - Abstract interface for chat node operations
   - `DatabaseRepository` - Abstract interface for database initialization

2. **MongoDB Implementation** (`backend/repositories/mongodb.py`)
   - `MongoSessionRepository` - MongoDB implementation using Beanie ODM
   - `MongoChatNodeRepository` - MongoDB implementation using Beanie ODM
   - `MongoDatabase` - MongoDB connection management

3. **Firestore Implementation** (`backend/repositories/firestore.py`)
   - Stub implementations ready for you to complete
   - Includes documentation on what needs to be implemented

4. **Database Factory** (`backend/repositories/factory.py`)
   - Singleton factory that creates the appropriate database implementation
   - Uses `DATABASE_TYPE` environment variable to determine which database to use

## Current Configuration (MongoDB)

The application is currently configured to use MongoDB. Here's the configuration in [.env](.env):

```bash
DATABASE_TYPE=mongodb
MONGO_URI=mongodb://localhost:27017
DB_NAME=treechat
```

## Switching to Google Cloud Firestore

### Step 1: Implement Firestore Repository

Complete the implementation in [backend/repositories/firestore.py](backend/repositories/firestore.py):

1. Install Firebase Admin SDK:
   ```bash
   pip install firebase-admin
   ```

2. Implement the three repository classes:
   - `FirestoreSessionRepository`
   - `FirestoreChatNodeRepository`
   - `FirestoreDatabase`

3. Key implementation notes:
   - Use Firestore collections: `sessions` and `chat_nodes`
   - Map the `create()`, `get()`, `find_by_*()` methods to Firestore operations
   - Handle ID generation (Firestore uses string IDs, similar to MongoDB ObjectIds)
   - Ensure datetime fields are properly serialized

### Step 2: Configure Firestore Credentials

1. Download your Firebase service account JSON from the Firebase Console

2. Update [.env](.env):
   ```bash
   DATABASE_TYPE=firestore
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
   FIRESTORE_PROJECT_ID=your-project-id
   ```

### Step 3: Update Dependencies

Add to [backend/requirements.txt](backend/requirements.txt):
```
firebase-admin
```

### Step 4: Restart the Application

```bash
# The factory will automatically use Firestore based on DATABASE_TYPE
python backend/main.py
```

## Data Model

Both database implementations must support the same data structure:

### Session
```python
{
    "id": str,
    "title": str,
    "created_at": datetime,
    "last_active_node_id": Optional[str]
}
```

### ChatNode
```python
{
    "id": str,
    "session_id": str,
    "parent_id": Optional[str],
    "role": "user" | "assistant" | "system",
    "content": str,
    "path": List[str],  # Ordered list of ancestor IDs
    "model": Optional[str],
    "created_at": datetime,
    "is_merge_summary": bool,
    "merge_source_branch_id": Optional[str]
}
```

## Repository Operations

All database implementations must support these operations:

### SessionRepository
- `create(title: str) -> dict`
- `get(session_id: str) -> Optional[dict]`
- `list_all() -> List[dict]`
- `update(session_id: str, updates: dict) -> Optional[dict]`
- `delete(session_id: str) -> bool`

### ChatNodeRepository
- `create(...) -> dict` - Create a new chat node
- `get(node_id: str) -> Optional[dict]` - Get node by ID
- `find_by_session(session_id: str) -> List[dict]` - Get all nodes in a session
- `find_by_ids(node_ids: List[str]) -> List[dict]` - Batch get nodes
- `delete(node_id: str) -> bool` - Delete a node

## Testing the Migration

1. **Backup your MongoDB data** before switching:
   ```bash
   mongodump --db treechat --out ./backup
   ```

2. **Test Firestore implementation** with a fresh database

3. **Migrate data** (you'll need to write a migration script):
   ```python
   # Example migration pseudocode
   from backend.repositories.mongodb import MongoDatabase
   from backend.repositories.firestore import FirestoreDatabase

   mongo = MongoDatabase()
   firestore = FirestoreDatabase()

   await mongo.initialize()
   await firestore.initialize()

   # Migrate sessions
   sessions = await mongo.get_session_repository().list_all()
   for session in sessions:
       await firestore.get_session_repository().create(...)

   # Migrate nodes
   # ... similar process
   ```

## Benefits of This Architecture

1. **Easy Database Swapping** - Change `DATABASE_TYPE` in `.env` and you're done
2. **No Code Changes Required** - All endpoints use the repository interface
3. **Testability** - Easy to create mock repositories for testing
4. **Future-Proof** - Can add new databases (PostgreSQL, DynamoDB, etc.) without touching application code
5. **Gradual Migration** - MongoDB implementation remains intact while you build Firestore

## File Structure

```
backend/
├── repositories/
│   ├── __init__.py          # Package exports
│   ├── base.py              # Abstract base classes
│   ├── mongodb.py           # MongoDB implementation (✅ complete)
│   ├── firestore.py         # Firestore implementation (🚧 stub)
│   └── factory.py           # Database factory
├── database.py              # Database initialization
├── main.py                  # FastAPI endpoints (database-agnostic)
├── models.py                # Beanie models (for MongoDB)
└── llm.py                   # LLM service (database-agnostic)
```

## Notes

- The MongoDB implementation is **fully functional** and tested
- The Firestore implementation is a **stub** with `NotImplementedError` - you need to complete it
- The application code in `main.py` is **completely database-agnostic**
- All database operations go through the repository interfaces
- The factory pattern ensures only one database instance is created (singleton)

## Next Steps

When you're ready to implement Firestore:

1. Review [backend/repositories/firestore.py](backend/repositories/firestore.py)
2. Check the docstring in `FirestoreDatabase` class for implementation guidance
3. Implement each method following the MongoDB implementation as a reference
4. Test with a small dataset first
5. Update `DATABASE_TYPE` to switch over

Good luck with your migration! 🚀
