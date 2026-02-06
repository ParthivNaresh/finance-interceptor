from collections.abc import Callable
from datetime import timedelta
from typing import Any, ClassVar

from arq.connections import RedisSettings

from config import get_settings
from workers.lifecycle import shutdown, startup
from workers.retry import exponential_backoff
from workers.tasks import compute_analytics_for_user


def get_redis_settings() -> RedisSettings:
    settings = get_settings()
    return RedisSettings.from_dsn(settings.redis_url)


class WorkerSettings:
    functions: ClassVar[list[Callable[..., Any]]] = [compute_analytics_for_user]

    on_startup = startup
    on_shutdown = shutdown

    redis_settings = get_redis_settings()

    max_jobs = 10
    job_timeout = timedelta(minutes=5)
    max_tries = 3
    retry_jobs = True

    health_check_interval = timedelta(seconds=30)
    health_check_key = "finance-interceptor:worker:health"

    queue_name = "finance-interceptor:tasks"

    @staticmethod
    def retry_delay(attempt: int) -> timedelta:
        return exponential_backoff(attempt)
