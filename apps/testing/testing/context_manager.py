from __future__ import annotations

from contextlib import contextmanager
from typing import TYPE_CHECKING, Callable, Generator, TypeVar

from .cleanup import cleanup_context
from .context import TestContext

if TYPE_CHECKING:
    from .fixtures.scenarios.result import ScenarioResult


T = TypeVar("T", bound="ScenarioResult")


@contextmanager
def test_scenario(
    scenario_fn: Callable[..., T],
    **kwargs,
) -> Generator[T, None, None]:
    """
    Context manager for running pre-built test scenarios with automatic cleanup.

    Use this when you want a complete test scenario with users, transactions,
    and analytics already computed. The scenario function is called immediately,
    and cleanup runs automatically when the context exits (even on exception).

    Args:
        scenario_fn: A scenario function (e.g., lifestyle_creep_gradual, baseline_ready_user)
        **kwargs: Arguments passed to the scenario function (e.g., seed, creep_percentage)

    Yields:
        ScenarioResult with computed analytics, baselines, and query methods

    Example:
        with test_scenario(lifestyle_creep_gradual, seed=42, creep_percentage=0.30) as result:
            assert result.has_baselines
            trend = result.get_category_trend('FOOD_AND_DRINK')
            assert trend[-1][1] > trend[0][1]
    """
    result = scenario_fn(**kwargs)
    try:
        yield result
    finally:
        cleanup_context(result.context)


@contextmanager
def managed_context(
    context: TestContext | None = None,
) -> Generator[TestContext, None, None]:
    """
    Context manager for custom test setups with automatic cleanup.

    Use this when you need fine-grained control over test data creation,
    or when testing scenarios not covered by pre-built fixtures. You manually
    call fixture functions to build the exact data you need.

    Args:
        context: Optional existing TestContext. If None, creates a new one.

    Yields:
        TestContext for building custom test data

    Example:
        with managed_context() as ctx:
            create_user_with_bank(context=ctx)
            add_stable_spending(ctx, category_primary='FOOD_AND_DRINK', months=3)
            add_subscription(ctx, merchant_name='Netflix', amount=Decimal('15.99'))
            assert ctx.transaction_count() > 0
    """
    ctx = context or TestContext()
    try:
        yield ctx
    finally:
        if ctx.user is not None:
            cleanup_context(ctx)
