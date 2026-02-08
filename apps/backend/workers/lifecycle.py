from typing import Any

from observability import configure_logging, get_logger
from workers.context import WebhookWorkerContext, WorkerContext

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

    from repositories.account import AccountRepositoryContainer
    from repositories.analytics_log import AnalyticsComputationLogRepositoryContainer
    from repositories.cash_flow_metrics import CashFlowMetricsRepositoryContainer
    from repositories.category_spending import CategorySpendingRepositoryContainer
    from repositories.income_source import IncomeSourceRepositoryContainer
    from repositories.lifestyle_baseline import LifestyleBaselineRepositoryContainer
    from repositories.lifestyle_creep_score import LifestyleCreepScoreRepositoryContainer
    from repositories.merchant_spending import MerchantSpendingRepositoryContainer
    from repositories.merchant_stats import MerchantStatsRepositoryContainer
    from repositories.plaid_item import PlaidItemRepositoryContainer
    from repositories.spending_period import SpendingPeriodRepositoryContainer
    from repositories.transaction import TransactionRepositoryContainer
    from repositories.webhook_event import WebhookEventRepositoryContainer
    from services.analytics.baseline_calculator import BaselineCalculatorContainer
    from services.analytics.cash_flow_aggregator import CashFlowAggregatorContainer
    from services.analytics.computation_manager import SpendingComputationManagerContainer
    from services.analytics.creep_scorer import CreepScorerContainer
    from services.analytics.merchant_stats_aggregator import MerchantStatsAggregatorContainer
    from services.analytics.spending_aggregator import SpendingAggregatorContainer
    from services.analytics.transfer_detector import TransferDetectorContainer
    from services.database import DatabaseServiceContainer
    from services.encryption import EncryptionServiceContainer
    from services.plaid import PlaidServiceContainer
    from services.recurring import RecurringSyncServiceContainer
    from services.task_queue import TaskQueueServiceContainer
    from services.transaction_sync import TransactionSyncServiceContainer

    DatabaseServiceContainer.get()
    TransactionRepositoryContainer.get()
    SpendingPeriodRepositoryContainer.get()
    CategorySpendingRepositoryContainer.get()
    MerchantSpendingRepositoryContainer.get()
    MerchantStatsRepositoryContainer.get()
    CashFlowMetricsRepositoryContainer.get()
    IncomeSourceRepositoryContainer.get()
    AnalyticsComputationLogRepositoryContainer.get()
    LifestyleBaselineRepositoryContainer.get()
    LifestyleCreepScoreRepositoryContainer.get()
    TransferDetectorContainer.get()
    SpendingAggregatorContainer.get()

    spending_manager = SpendingComputationManagerContainer.get()
    merchant_aggregator = MerchantStatsAggregatorContainer.get()
    cash_flow_aggregator = CashFlowAggregatorContainer.get()
    baseline_calculator = BaselineCalculatorContainer.get()
    creep_scorer = CreepScorerContainer.get()

    worker_context = WorkerContext(
        spending_manager=spending_manager,
        merchant_aggregator=merchant_aggregator,
        cash_flow_aggregator=cash_flow_aggregator,
        baseline_calculator=baseline_calculator,
        creep_scorer=creep_scorer,
    )

    ctx["worker_context"] = worker_context

    PlaidServiceContainer.get()
    EncryptionServiceContainer.get()
    AccountRepositoryContainer.get()
    PlaidItemRepositoryContainer.get()
    WebhookEventRepositoryContainer.get()
    TransactionSyncServiceContainer.get()
    RecurringSyncServiceContainer.get()
    TaskQueueServiceContainer.get()

    webhook_context = WebhookWorkerContext(
        webhook_event_repo=WebhookEventRepositoryContainer.get(),
        plaid_item_repo=PlaidItemRepositoryContainer.get(),
        transaction_sync_service=TransactionSyncServiceContainer.get(),
        recurring_sync_service=RecurringSyncServiceContainer.get(),
        task_queue_service=TaskQueueServiceContainer.get(),
        spending_manager=spending_manager,
        merchant_aggregator=merchant_aggregator,
        cash_flow_aggregator=cash_flow_aggregator,
        baseline_calculator=baseline_calculator,
        creep_scorer=creep_scorer,
    )

    ctx["webhook_context"] = webhook_context

    logger.info("worker.startup.complete")


async def shutdown(_ctx: dict[str, Any]) -> None:
    logger.info("worker.shutdown.started")

    from repositories.account import AccountRepositoryContainer
    from repositories.analytics_log import AnalyticsComputationLogRepositoryContainer
    from repositories.cash_flow_metrics import CashFlowMetricsRepositoryContainer
    from repositories.category_spending import CategorySpendingRepositoryContainer
    from repositories.income_source import IncomeSourceRepositoryContainer
    from repositories.lifestyle_baseline import LifestyleBaselineRepositoryContainer
    from repositories.lifestyle_creep_score import LifestyleCreepScoreRepositoryContainer
    from repositories.merchant_spending import MerchantSpendingRepositoryContainer
    from repositories.merchant_stats import MerchantStatsRepositoryContainer
    from repositories.plaid_item import PlaidItemRepositoryContainer
    from repositories.spending_period import SpendingPeriodRepositoryContainer
    from repositories.transaction import TransactionRepositoryContainer
    from repositories.webhook_event import WebhookEventRepositoryContainer
    from services.analytics.baseline_calculator import BaselineCalculatorContainer
    from services.analytics.cash_flow_aggregator import CashFlowAggregatorContainer
    from services.analytics.computation_manager import SpendingComputationManagerContainer
    from services.analytics.creep_scorer import CreepScorerContainer
    from services.analytics.merchant_stats_aggregator import MerchantStatsAggregatorContainer
    from services.analytics.spending_aggregator import SpendingAggregatorContainer
    from services.analytics.transfer_detector import TransferDetectorContainer
    from services.database import DatabaseServiceContainer
    from services.encryption import EncryptionServiceContainer
    from services.plaid import PlaidServiceContainer
    from services.recurring import RecurringSyncServiceContainer
    from services.task_queue import TaskQueueServiceContainer
    from services.transaction_sync import TransactionSyncServiceContainer

    await TaskQueueServiceContainer.close()
    TransactionSyncServiceContainer.reset()
    RecurringSyncServiceContainer.reset()
    PlaidServiceContainer.reset()
    EncryptionServiceContainer.reset()
    WebhookEventRepositoryContainer.reset()
    PlaidItemRepositoryContainer.reset()
    AccountRepositoryContainer.reset()

    CreepScorerContainer.reset()
    BaselineCalculatorContainer.reset()
    CashFlowAggregatorContainer.reset()
    SpendingComputationManagerContainer.reset()
    MerchantStatsAggregatorContainer.reset()
    SpendingAggregatorContainer.reset()
    TransferDetectorContainer.reset()
    AnalyticsComputationLogRepositoryContainer.reset()
    LifestyleCreepScoreRepositoryContainer.reset()
    LifestyleBaselineRepositoryContainer.reset()
    MerchantStatsRepositoryContainer.reset()
    MerchantSpendingRepositoryContainer.reset()
    CategorySpendingRepositoryContainer.reset()
    CashFlowMetricsRepositoryContainer.reset()
    IncomeSourceRepositoryContainer.reset()
    SpendingPeriodRepositoryContainer.reset()
    TransactionRepositoryContainer.reset()
    DatabaseServiceContainer.reset()

    logger.info("worker.shutdown.complete")
