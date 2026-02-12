from fastapi import APIRouter

from models.common import CacheStatsResponse, DomainCacheStats, HealthResponse
from services.cache.base import get_cache_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    return HealthResponse(status="healthy", version="0.1.0")


@router.get("/health/cache", response_model=CacheStatsResponse)
async def cache_stats() -> CacheStatsResponse:
    cache = get_cache_service()
    stats = cache.get_stats()
    available = cache.is_available()

    return CacheStatsResponse(
        enabled=cache._enabled,
        available=available,
        total_hits=stats["total_hits"],
        total_misses=stats["total_misses"],
        hit_rate=stats["hit_rate"],
        domains={
            name: DomainCacheStats(**domain_stats)
            for name, domain_stats in stats["domains"].items()
        },
    )
