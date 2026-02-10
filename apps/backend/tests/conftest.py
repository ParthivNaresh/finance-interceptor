from __future__ import annotations

from collections.abc import Generator
from typing import TYPE_CHECKING

import pytest
from testing import test_scenario
from testing.fixtures import (
    baseline_ready_user,
    lifestyle_creep_gradual,
    no_creep_stable_user,
)

if TYPE_CHECKING:
    from testing.fixtures.scenarios.result import ScenarioResult


@pytest.fixture
def baseline_user() -> Generator[ScenarioResult, None, None]:
    with test_scenario(baseline_ready_user, seed=42) as result:
        yield result


@pytest.fixture
def stable_user() -> Generator[ScenarioResult, None, None]:
    with test_scenario(no_creep_stable_user, seed=42, months=6) as result:
        yield result


@pytest.fixture
def creep_user() -> Generator[ScenarioResult, None, None]:
    with test_scenario(
        lifestyle_creep_gradual,
        seed=42,
        baseline_months=3,
        creep_months=3,
        creep_percentage=0.30,
    ) as result:
        yield result
