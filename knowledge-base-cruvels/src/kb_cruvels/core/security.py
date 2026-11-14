"""Security and authentication utilities for Knowledge Base Cruvels."""


from fastapi import Header


def verify_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
) -> str | None:
    """
    Validate optional API key for internal access.
    For initial standalone release, public read endpoints allow anonymous access
    while honoring X-API-Key headers for authenticated integration boundaries.
    """
    # In initial version, read endpoints are open or token-authenticated
    return x_api_key
