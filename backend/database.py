from backend.repositories.factory import DatabaseFactory

async def init_db():
    """Initialize database using the configured repository"""
    db = DatabaseFactory.get_database()
    await db.initialize()
    return db

async def close_db():
    """Close database connection"""
    db = DatabaseFactory.get_database()
    await db.close()
