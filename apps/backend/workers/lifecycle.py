from typing import Any

from observability import configure_logging, get_logger
from workers.context import WorkerContext

logger = get_logger("workers.lifecycle")


async def startup(ctx: dict[str, Any]) -> None:
    from config import get_settings

    settings = get_settings()

    configure_logging(
        log_level=settings.log_level,
        log_format=settings.log_format,
        service_name="finance-interceptor-worker",
        service_version=settings.app_version,
    )

    logger.info("worker.startup.initializing_services")

    from repositories.analytics_log import AnalyticsComputationLogRepositoryContainer
    from repositories.category_spending import CategorySpendingRepositoryContainer
    from repositories.merchant_spending import MerchantSpendingRepositoryContainer
    from repositories.merchant_stats import MerchantStatsRepositoryContainer
    from repositories.spending_period import SpendingPeriodRepositoryContainer
    from repositories.transaction import TransactionRepositoryContainer
    from services.analytics.computation_manager import SpendingComputationManagerContainer
    from services.analytics.merchant_stats_aggregator import MerchantStatsAggregatorContainer
    from services.analytics.spending_aggregator import SpendingAggregatorContainer
    from services.analytics.transfer_detector import TransferDetectorContainer
    from services.database import DatabaseServiceContainer

    DatabaseServiceContainer.get()
    TransactionRepositoryContainer.get()
    SpendingPeriodRepositoryContainer.get()
    CategorySpendingRepositoryContainer.get()
    MerchantSpendingRepositoryContainer.get()
    MerchantStatsRepositoryContainer.get()
    AnalyticsComputationLogRepositoryContainer.get()
    TransferDetectorContainer.get()
    SpendingAggregatorContainer.get()

    spending_manager = SpendingComputationManagerContainer.get()
    merchant_aggregator = MerchantStatsAggregatorContainer.get()

    worker_context = WorkerContext(
        spending_manager=spending_manager,
        merchant_aggregator=merchant_aggregator,
    )

    ctx["worker_context"] = worker_context

    logger.info("worker.startup.complete")


async def shutdown(_ctx: dict[str, Any]) -> None:
    logger.info("worker.shutdown.started")

    from repositories.analytics_log import AnalyticsComputationLogRepositoryContainer
    from repositories.category_spending import CategorySpendingRepositoryContainer
    from repositories.merchant_spending import MerchantSpendingRepositoryContainer
    from repositories.merchant_stats import MerchantStatsRepositoryContainer
    from repositories.spending_period import SpendingPeriodRepositoryContainer
    from repositories.transaction import TransactionRepositoryContainer
    from services.analytics.computation_manager import SpendingComputationManagerContainer
    from services.analytics.merchant_stats_aggregator import MerchantStatsAggregatorContainer
    from services.analytics.spending_aggregator import SpendingAggregatorContainer
    from services.analytics.transfer_detector import TransferDetectorContainer
    from services.database import DatabaseServiceContainer

    SpendingComputationManagerContainer.reset()
    MerchantStatsAggregatorContainer.reset()
    SpendingAggregatorContainer.reset()
    TransferDetectorContainer.reset()
    AnalyticsComputationLogRepositoryContainer.reset()
    MerchantStatsRepositoryContainer.reset()
    MerchantSpendingRepositoryContainer.reset()
    CategorySpendingRepositoryContainer.reset()
    SpendingPeriodRepositoryContainer.reset()
    TransactionRepositoryContainer.reset()
    DatabaseServiceContainer.reset()

    logger.info("worker.shutdown.complete")
