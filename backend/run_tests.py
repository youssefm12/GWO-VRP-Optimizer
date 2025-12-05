"""
Run all backend tests.
"""
import pytest
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    exit_code = pytest.main([
        "tests/",
        "-v",
        "--tb=short",
        "-x"  # Stop on first failure
    ])
    sys.exit(exit_code)
