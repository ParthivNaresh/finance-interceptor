from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from services.analytics.computation_manager import SpendingComputationManager
    from services.analytics.merchant_stats_aggregator import MerchantStatsAggregator


@dataclass(frozen=True, slots=True)
class WorkerContext:
    spending_manager: "SpendingComputationManager"
    merchant_aggregator: "MerchantStatsAggregator"
