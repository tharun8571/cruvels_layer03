"""Standard Error Response schemas for the API."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    code: str = Field(..., description="Machine-readable error code")
    message: str = Field(..., description="Human-readable error description")
    field: str | None = Field(default=None, description="Request field causing the error")


class ErrorResponse(BaseModel):
    error: str = Field(..., description="Error type identifier")
    message: str = Field(..., description="Primary error message")
    details: list[ErrorDetail] | None = Field(default=None, description="Detailed validation or resolution errors")
