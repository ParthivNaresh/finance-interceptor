from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from testing.fixtures.scenarios.result import ScenarioResult


SCENARIO_FIXTURES = [
    "baseline_user",
    "stable_user",
    "creep_user",
]


class TestExpectedOutcomesValidation:
    @pytest.mark.parametrize("scenario_fixture", SCENARIO_FIXTURES)
    def test_scenario_meets_expectations(
        self,
        scenario_fixture: str,
        request: pytest.FixtureRequest,
    ) -> None:
        result: ScenarioResult = request.getfixturevalue(scenario_fixture)
        validation = result.validate()
        assert validation.passed, validation.summary()
