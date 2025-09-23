"""
Pytest configuration and fixtures for RAG service tests.
"""

import pytest
import sys
import os

# Add parent directory to path so we can import rag_service
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def sample_workouts():
    """Sample workout data for testing."""
    return [
        {
            "id": "workout-1",
            "name": "Chest Day",
            "exercises": ["bench press", "flys", "push-ups"],
            "content": "Complete chest workout with bench press, flys, and push-ups"
        },
        {
            "id": "workout-2",
            "name": "Leg Day",
            "exercises": ["squats", "lunges", "leg press"],
            "content": "Lower body workout focusing on squats and lunges"
        },
        {
            "id": "workout-3",
            "name": "Back and Biceps",
            "exercises": ["pull-ups", "rows", "curls"],
            "content": "Back and biceps training with pull-ups and rows"
        }
    ]


@pytest.fixture
def create_test_user():
    """Create test user function."""
    def _create_user():
        import uuid
        return str(uuid.uuid4())
    return _create_user


@pytest.fixture
def add_workout_history():
    """Add workout history for test user."""
    def _add_history(user_id, workouts):
        # Mock function - in production would add to database
        return True
    return _add_history