"""FastAPI Dependencies for database session and authentication."""


from kb_cruvels.core.security import verify_api_key
from kb_cruvels.database.session import get_db

__all__ = ["get_db", "verify_api_key"]
