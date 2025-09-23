#!/usr/bin/env python
"""
Test runner script for RAG service.
This script runs the tests and reports their status.
In TDD, we expect these to fail initially (Red phase).
"""

import sys
import subprocess
import os

def run_tests():
    """Run all tests and report results."""
    print("=" * 60)
    print("Running RAG Service Tests (TDD - Red Phase)")
    print("=" * 60)
    print("\nNote: Tests are expected to fail initially in TDD.")
    print("This demonstrates we have proper test coverage before implementation.\n")

    # Set Python path to include project root
    project_root = os.path.dirname(os.path.abspath(__file__))
    os.environ['PYTHONPATH'] = project_root

    test_commands = [
        ("Unit Tests - Embeddings", ["pytest", "tests/test_embeddings.py", "-v", "-m", "not integration"]),
        ("Unit Tests - Search", ["pytest", "tests/test_search.py", "-v", "-m", "not integration"]),
        ("Unit Tests - Reranking", ["pytest", "tests/test_reranking.py", "-v", "-m", "not integration"]),
    ]

    results = []

    for test_name, command in test_commands:
        print(f"\n{'=' * 40}")
        print(f"Running: {test_name}")
        print('=' * 40)

        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                cwd=project_root
            )

            # In TDD, we expect tests to fail initially
            if result.returncode != 0:
                print(f"✗ {test_name}: Tests failed (Expected in Red phase)")
                # Check if it's import error (expected) vs other errors
                if "ModuleNotFoundError" in result.stderr or "ImportError" in result.stderr:
                    print("  → Import errors detected (modules not yet implemented)")
                else:
                    print("  → Test assertions failed")
            else:
                print(f"✓ {test_name}: Tests passed")

            results.append((test_name, result.returncode))

            # Print output for debugging
            if result.stdout:
                print("\nStdout:")
                print(result.stdout[:500])  # Truncate long output
            if result.stderr:
                print("\nStderr:")
                print(result.stderr[:500])  # Truncate long output

        except FileNotFoundError:
            print(f"✗ {test_name}: pytest not found. Please install: pip install pytest pytest-cov pytest-asyncio")
            results.append((test_name, -1))
        except Exception as e:
            print(f"✗ {test_name}: Error running tests: {e}")
            results.append((test_name, -1))

    # Summary
    print("\n" + "=" * 60)
    print("Test Summary (TDD - Red Phase)")
    print("=" * 60)

    for name, code in results:
        status = "FAILED (Expected)" if code != 0 else "PASSED"
        print(f"{name}: {status}")

    print("\n" + "=" * 60)
    print("TDD Status: RED PHASE ✓")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Implement the RAG service modules")
    print("2. Run tests again to verify they pass (Green phase)")
    print("3. Refactor code while keeping tests green")
    print("\nTo install dependencies:")
    print("pip install -r requirements.txt")

    return 0  # Return 0 even if tests fail (expected in TDD)

if __name__ == "__main__":
    sys.exit(run_tests())