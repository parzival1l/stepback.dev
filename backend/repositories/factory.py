import os
from backend.repositories.base import DatabaseRepository
from backend.repositories.mongodb import MongoDatabase
from backend.repositories.firestore import FirestoreDatabase


class DatabaseFactory:
    """Factory for creating database repository instances"""

    _instance: DatabaseRepository = None

    @classmethod
    def get_database(cls) -> DatabaseRepository:
        """
        Get or create database instance based on configuration

        The database type is determined by the DATABASE_TYPE environment variable:
        - "mongodb" (default): Use MongoDB with Beanie
        - "firestore": Use Google Cloud Firestore

        Returns:
            DatabaseRepository: The configured database instance
        """
        if cls._instance is None:
            db_type = os.getenv("DATABASE_TYPE", "mongodb").lower()

            if db_type == "mongodb":
                cls._instance = MongoDatabase()
            elif db_type == "firestore":
                cls._instance = FirestoreDatabase()
            else:
                raise ValueError(
                    f"Unsupported database type: {db_type}. "
                    f"Supported types: 'mongodb', 'firestore'"
                )

        return cls._instance

    @classmethod
    def reset(cls):
        """Reset the singleton instance (useful for testing)"""
        cls._instance = None
