import pytest
from backend.database import init_db

@pytest.fixture(autouse=True, scope="session")
def setup_test_db():
    """Initializes the database schema for the test session."""
    init_db()
