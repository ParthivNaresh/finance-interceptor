from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import TYPE_CHECKING
from uuid import UUID

from arq import create_pool
from arq.connections import ArqRedis, RedisSettings
from arq.jobs import Job, JobStatus

from config import Settings, get_settings
from observability import get_logger

if TYPE_CHECKING:
    pass

logger = get_logger("services.task_queue")

_CANCELLABLE_STATUSES: frozenset[JobStatus] = frozenset({
    JobStatus.queued,
    JobStatus.deferred,
})


@dataclass(frozen=True, slots=True)
class EnqueueResult:
    job_id: str
    was_debounced: bool
    defer_seconds: int


class TaskQueueError(Exception):
    def __init__(self, message: str = "Task queue operation failed") -> None:
        self.message = message
        super().__init__(self.message)


class TaskQueueService:
    _ANALYTICS_JOB_PREFIX = "analytics"
    _QUEUE_NAME = "finance-interceptor:tasks"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._redis: ArqRedis | None = None

    async def _get_redis(self) -> ArqRedis:
        if self._redis is None:
            redis_settings = RedisSettings.from_dsn(self._settings.redis_url)
            self._redis = await create_pool(redis_settings)
        return self._redis

    async def close(self) -> None:
        if self._redis is not None:
            await self._redis.close()
            self._redis = None

    def _get_analytics_job_id(self, user_id: UUID) -> str:
        return f"{self._ANALYTICS_JOB_PREFIX}:{user_id}"

    async def _get_job_status_and_handle(self, job_id: str) -> tuple[JobStatus | None, bool]:
        redis = await self._get_redis()
        job = Job(job_id, redis)

        try:
            status = await job.status()

            if status in _CANCELLABLE_STATUSES:
                await job.abort()
                logger.debug("task_queue.job_cancelled", job_id=job_id, previous_status=status.value)
                return status, True

            if status == JobStatus.complete:
                result_key = f"arq:result:{job_id}"
                await redis.delete(result_key)
                logger.debug("task_queue.result_cleared", job_id=job_id)
                return status, False

            if status == JobStatus.in_progress:
                logger.debug("task_queue.job_in_progress", job_id=job_id)
                return status, False

            return status, False

        except Exception as e:
            logger.warning("task_queue.status_check_failed", job_id=job_id, error=str(e))
            return None, False

    async def enqueue_analytics_computation(
        self,
        user_id: UUID,
        defer_seconds: int | None = None,
    ) -> EnqueueResult:
        if not self._settings.task_queue_enabled:
            raise TaskQueueError("Task queue is disabled")

        if defer_seconds is None:
            defer_seconds = self._settings.task_debounce_seconds

        job_id = self._get_analytics_job_id(user_id)
        log = logger.bind(user_id=str(user_id), job_id=job_id)

        previous_status, was_debounced = await self._get_job_status_and_handle(job_id)

        if was_debounced:
            log.info(
                "task_queue.analytics.debounced",
                defer_seconds=defer_seconds,
                previous_status=previous_status.value if previous_status else "unknown",
            )

        redis = await self._get_redis()

        job = await redis.enqueue_job(
            "compute_analytics_for_user",
            str(user_id),
            _job_id=job_id,
            _defer_by=timedelta(seconds=defer_seconds),
            _queue_name=self._QUEUE_NAME,
        )

        if job is None:
            log.warning(
                "task_queue.analytics.enqueue_failed",
                reason="job_already_exists_or_enqueue_failed",
            )

        log.info(
            "task_queue.analytics.enqueued",
            defer_seconds=defer_seconds,
            was_debounced=was_debounced,
        )

        return EnqueueResult(
            job_id=job_id,
            was_debounced=was_debounced,
            defer_seconds=defer_seconds,
        )

    async def get_job_status(self, job_id: str) -> JobStatus | None:
        redis = await self._get_redis()
        job = Job(job_id, redis)

        try:
            return await job.status()
        except Exception:
            return None

    async def get_analytics_job_status(self, user_id: UUID) -> JobStatus | None:
        job_id = self._get_analytics_job_id(user_id)
        return await self.get_job_status(job_id)

    def is_enabled(self) -> bool:
        return self._settings.task_queue_enabled


class TaskQueueServiceContainer:
    _instance: TaskQueueService | None = None

    @classmethod
    def get(cls) -> TaskQueueService:
        if cls._instance is None:
            settings = get_settings()
            cls._instance = TaskQueueService(settings)
        return cls._instance

    @classmethod
    def reset(cls) -> None:
        cls._instance = None

    @classmethod
    async def close(cls) -> None:
        if cls._instance is not None:
            await cls._instance.close()
            cls._instance = None


def get_task_queue_service() -> TaskQueueService:
    return TaskQueueServiceContainer.get()
