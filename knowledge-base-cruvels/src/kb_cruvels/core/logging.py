import logging
import sys


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """Configure structured logging across the application."""
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)

    formatter = logging.Formatter(
        fmt="%(asctime)s [%(levelname)s] [%(name)s]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger("kb_cruvels")
    root_logger.setLevel(numeric_level)

    # Remove existing handlers to prevent duplicate outputs
    if not root_logger.handlers:
        root_logger.addHandler(handler)

    return root_logger


logger = setup_logging()
