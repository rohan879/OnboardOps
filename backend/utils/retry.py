"""
Retry utility with exponential backoff for OnboardOps backend
Used for GitHub API calls and other network operations
"""

import time
import httpx
from typing import Callable, TypeVar, Tuple, Type
from functools import wraps

T = TypeVar("T")

# Default retryable exceptions
DEFAULT_RETRYABLE_EXCEPTIONS = (
    httpx.TimeoutException,
    httpx.NetworkError,
    httpx.ConnectError,
    httpx.RemoteProtocolError,
)


def with_retry(
    max_retries: int = 3,
    backoff_base: float = 1.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = DEFAULT_RETRYABLE_EXCEPTIONS,
    log_func: Callable[[str], None] = None,
) -> Callable:
    """
    Decorator for retrying functions with exponential backoff

    Args:
        max_retries: Maximum number of retry attempts (default: 3)
        backoff_base: Base delay in seconds (default: 1.0)
                     Delays will be: 1s, 2s, 4s for base=1.0
        retryable_exceptions: Tuple of exception types to retry on
        log_func: Optional logging function for retry attempts

    Returns:
        Decorated function that retries on specified exceptions

    Example:
        @with_retry(max_retries=3, backoff_base=1.0)
        def fetch_data():
            response = httpx.get("https://api.example.com/data")
            return response.json()
    """

    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @wraps(func)
        def wrapper(*args, **kwargs) -> T:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except retryable_exceptions as e:
                    last_exception = e

                    if attempt < max_retries:
                        # Calculate exponential backoff delay
                        delay = backoff_base * (2**attempt)

                        if log_func:
                            log_func(
                                f"Retry attempt {attempt + 1}/{max_retries} "
                                f"after {delay}s delay. Error: {type(e).__name__}: {str(e)}"
                            )

                        time.sleep(delay)
                    else:
                        # Max retries exhausted
                        if log_func:
                            log_func(
                                f"Max retries ({max_retries}) exhausted. "
                                f"Final error: {type(e).__name__}: {str(e)}"
                            )

            # If we get here, all retries failed
            raise last_exception

        return wrapper

    return decorator


def retry_on_transient_errors(func: Callable[..., T]) -> Callable[..., T]:
    """
    Convenience decorator with sensible defaults for transient network errors

    Retries up to 3 times with exponential backoff (1s, 2s, 4s)
    on common network exceptions.

    Example:
        @retry_on_transient_errors
        def fetch_github_data():
            response = httpx.get("https://api.github.com/repos/...")
            return response.json()
    """
    return with_retry(
        max_retries=3,
        backoff_base=1.0,
        retryable_exceptions=DEFAULT_RETRYABLE_EXCEPTIONS,
        log_func=lambda msg: print(f"[retry] {msg}"),
    )(func)


# Made with Bob
