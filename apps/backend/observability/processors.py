from collections.abc import MutableMapping
from typing import Any

from structlog.typing import EventDict, WrappedLogger

from observability.constants import MASKED_VALUE, SENSITIVE_KEYS, SENSITIVE_PATTERNS


def scrub_sensitive_data(
    _logger: WrappedLogger,
    _method_name: str,
    event_dict: EventDict,
) -> EventDict:
    return _scrub_mapping(event_dict)


def _scrub_mapping(data: MutableMapping[str, Any]) -> dict[str, Any]:
    result: dict[str, Any] = {}
    for key, value in data.items():
        scrubbed_value = _scrub_value(key, value)
        result[key] = scrubbed_value
    return result


def _scrub_value(key: str, value: Any) -> Any:
    key_lower = key.lower()

    if key_lower in SENSITIVE_KEYS:
        return MASKED_VALUE

    if isinstance(value, str):
        return _scrub_string(value)

    if isinstance(value, dict):
        return _scrub_mapping(value)

    if isinstance(value, list):
        return [_scrub_value("", item) for item in value]

    return value


def _scrub_string(value: str) -> str:
    for pattern in SENSITIVE_PATTERNS:
        if pattern.search(value):
            return MASKED_VALUE
    return value


def drop_color_message(
    _logger: WrappedLogger,
    _method_name: str,
    event_dict: EventDict,
) -> EventDict:
    event_dict.pop("color_message", None)
    return event_dict


def add_service_info(
    service_name: str,
    service_version: str,
) -> Any:
    def processor(
        _logger: WrappedLogger,
        _method_name: str,
        event_dict: EventDict,
    ) -> EventDict:
        event_dict["service"] = service_name
        event_dict["version"] = service_version
        return event_dict

    return processor
