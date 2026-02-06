from datetime import datetime
from typing import Annotated, Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from middleware.auth import get_current_user
from middleware.rate_limit import get_limiter, get_rate_limits
from models.auth import AuthenticatedUser
from models.enums import AlertSeverity, AlertStatus, AlertType, UserActionType
from models.recurring import (
    AlertAcknowledgeRequest,
    AlertListResponse,
    AlertResponse,
    AlertWithStreamResponse,
)
from repositories.alert import AlertRepository, get_alert_repository
from repositories.recurring_stream import RecurringStreamRepository, get_recurring_stream_repository

router = APIRouter()
limiter = get_limiter()
limits = get_rate_limits()

CurrentUserDep = Annotated[AuthenticatedUser, Depends(get_current_user)]
AlertRepoDep = Annotated[AlertRepository, Depends(get_alert_repository)]
RecurringStreamRepoDep = Annotated[RecurringStreamRepository, Depends(get_recurring_stream_repository)]


def _parse_datetime(value: str | datetime | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _to_alert_response(alert: dict[str, Any]) -> AlertResponse:
    return AlertResponse(
        id=UUID(alert["id"]),
        user_id=UUID(alert["user_id"]),
        recurring_stream_id=UUID(alert["recurring_stream_id"]) if alert.get("recurring_stream_id") else None,
        alert_type=AlertType(alert["alert_type"]),
        severity=AlertSeverity(alert["severity"]),
        title=alert["title"],
        message=alert["message"],
        data=alert.get("data"),
        status=AlertStatus(alert["status"]),
        user_action=UserActionType(alert["user_action"]) if alert.get("user_action") else None,
        created_at=_parse_datetime(alert["created_at"]) or datetime.now(),
        read_at=_parse_datetime(alert.get("read_at")),
        dismissed_at=_parse_datetime(alert.get("dismissed_at")),
        actioned_at=_parse_datetime(alert.get("actioned_at")),
    )


def _to_alert_with_stream(
    alert: dict[str, Any],
    stream: dict[str, Any] | None,
) -> AlertWithStreamResponse:
    from routers.recurring import _to_stream_response

    alert_response = _to_alert_response(alert)

    return AlertWithStreamResponse(
        id=alert_response.id,
        user_id=alert_response.user_id,
        recurring_stream_id=alert_response.recurring_stream_id,
        alert_type=alert_response.alert_type,
        severity=alert_response.severity,
        title=alert_response.title,
        message=alert_response.message,
        data=alert_response.data,
        status=alert_response.status,
        user_action=alert_response.user_action,
        created_at=alert_response.created_at,
        read_at=alert_response.read_at,
        dismissed_at=alert_response.dismissed_at,
        actioned_at=alert_response.actioned_at,
        stream=_to_stream_response(stream) if stream else None,
    )


@router.get(
    "",
    response_model=AlertListResponse,
    summary="List alerts",
    description="Returns paginated list of alerts",
)
@limiter.limit(limits.default)
async def list_alerts(
    request: Request,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
    recurring_repo: RecurringStreamRepoDep,
    unread_only: bool = Query(default=False, description="Only return unread alerts"),
    limit: int = Query(default=50, ge=1, le=200, description="Number of results"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
) -> AlertListResponse:
    if unread_only:
        alerts = alert_repo.get_unread_by_user_id(current_user.id)
    else:
        alerts = alert_repo.get_by_user_id(current_user.id, limit=limit, offset=offset)

    unread_count = alert_repo.count_unread(current_user.id)
    total = alert_repo.count_by_user_id(current_user.id)

    stream_cache: dict[str, dict[str, Any] | None] = {}

    alerts_with_streams: list[AlertWithStreamResponse] = []
    for alert in alerts:
        stream_id = alert.get("recurring_stream_id")
        stream = None

        if stream_id:
            if stream_id not in stream_cache:
                stream_cache[stream_id] = recurring_repo.get_by_id(UUID(stream_id))
            stream = stream_cache[stream_id]

        alerts_with_streams.append(_to_alert_with_stream(alert, stream))

    return AlertListResponse(
        alerts=alerts_with_streams,
        total=total,
        unread_count=unread_count,
    )


@router.get(
    "/unread/count",
    summary="Get unread alert count",
    description="Returns the count of unread alerts",
)
@limiter.limit(limits.default)
async def get_unread_count(
    request: Request,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
) -> dict[str, int]:
    count = alert_repo.count_unread(current_user.id)
    return {"count": count}


@router.get(
    "/{alert_id}",
    response_model=AlertWithStreamResponse,
    summary="Get alert details",
    description="Returns details for a single alert",
)
@limiter.limit(limits.default)
async def get_alert(
    request: Request,
    alert_id: UUID,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
    recurring_repo: RecurringStreamRepoDep,
) -> AlertWithStreamResponse:
    alert = alert_repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    if alert["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    stream = None
    if alert.get("recurring_stream_id"):
        stream = recurring_repo.get_by_id(UUID(alert["recurring_stream_id"]))

    return _to_alert_with_stream(alert, stream)


@router.post(
    "/{alert_id}/read",
    response_model=AlertResponse,
    summary="Mark alert as read",
    description="Marks an alert as read",
)
@limiter.limit(limits.default)
async def mark_as_read(
    request: Request,
    alert_id: UUID,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
) -> AlertResponse:
    alert = alert_repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    if alert["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    updated = alert_repo.mark_as_read(alert_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update alert",
        )

    return _to_alert_response(updated)


@router.post(
    "/{alert_id}/dismiss",
    response_model=AlertResponse,
    summary="Dismiss alert",
    description="Dismisses an alert",
)
@limiter.limit(limits.default)
async def dismiss_alert(
    request: Request,
    alert_id: UUID,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
) -> AlertResponse:
    alert = alert_repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    if alert["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    updated = alert_repo.dismiss(alert_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to dismiss alert",
        )

    return _to_alert_response(updated)


@router.post(
    "/{alert_id}/acknowledge",
    response_model=AlertResponse,
    summary="Acknowledge alert with action",
    description="Acknowledges an alert and optionally records user action",
)
@limiter.limit(limits.default)
async def acknowledge_alert(
    request: Request,
    alert_id: UUID,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
    acknowledge_request: AlertAcknowledgeRequest,
) -> AlertResponse:
    alert = alert_repo.get_by_id(alert_id)
    if not alert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    if alert["user_id"] != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alert not found",
        )

    updated = alert_repo.acknowledge(alert_id, acknowledge_request.user_action)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to acknowledge alert",
        )

    return _to_alert_response(updated)


@router.post(
    "/read-all",
    summary="Mark all alerts as read",
    description="Marks all unread alerts as read",
)
@limiter.limit(limits.default)
async def mark_all_as_read(
    request: Request,
    current_user: CurrentUserDep,
    alert_repo: AlertRepoDep,
) -> dict[str, int]:
    count = alert_repo.mark_all_as_read(current_user.id)
    return {"marked_as_read": count}
