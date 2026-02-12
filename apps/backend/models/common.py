from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["healthy", "unhealthy"] = Field(description="API health status")
    version: str = Field(description="API version")


class DomainCacheStats(BaseModel):
    hits: int = Field(description="Number of cache hits")
    misses: int = Field(description="Number of cache misses")
    hit_rate: float = Field(description="Hit rate (0.0 to 1.0)")


class CacheStatsResponse(BaseModel):
    enabled: bool = Field(description="Whether caching is enabled")
    available: bool = Field(description="Whether Redis is reachable")
    total_hits: int = Field(description="Total cache hits across all domains")
    total_misses: int = Field(description="Total cache misses across all domains")
    hit_rate: float = Field(description="Overall hit rate (0.0 to 1.0)")
    domains: dict[str, DomainCacheStats] = Field(description="Per-domain cache statistics")
