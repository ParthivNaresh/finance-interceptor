from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from repositories.plaid_item import PlaidItemRepository
    from repositories.webhook_event import WebhookEventRepository
    from services.analytics.baseline_calculator import BaselineCalculator
    from services.analytics.cash_flow_aggregator import CashFlowAggregator
    from services.analytics.computation_manager import SpendingComputationManager
    from services.analytics.creep_scorer import CreepScorer
    from services.analytics.merchant_stats_aggregator import MerchantStatsAggregator
    from services.recurring import RecurringSyncService
    from services.task_queue import TaskQueueService
    from services.transaction_sync import TransactionSyncService


@dataclass(frozen=True, slots=True)
class WorkerContext:
    spending_manager: "SpendingComputationManager"
    merchant_aggregator: "MerchantStatsAggregator"
    cash_flow_aggregator: "CashFlowAggregator"
    baseline_calculator: "BaselineCalculator"
    creep_scorer: "CreepScorer"


@dataclass(frozen=True, slots=True)
class WebhookWorkerContext:
    webhook_event_repo: "WebhookEventRepository"
    plaid_item_repo: "PlaidItemRepository"
    transaction_sync_service: "TransactionSyncService"
    recurring_sync_service: "RecurringSyncService"
    task_queue_service: "TaskQueueService"
    spending_manager: "SpendingComputationManager"
    merchant_aggregator: "MerchantStatsAggregator"
    cash_flow_aggregator: "CashFlowAggregator"
    baseline_calculator: "BaselineCalculator"
    creep_scorer: "CreepScorer"
