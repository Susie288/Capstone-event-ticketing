"""Custom CloudWatch metrics for API observability.

Publishes metrics to the 'EventTicketingSystem' namespace so CloudWatch
dashboards and alarms can track request counts, failed registrations,
and Lambda execution duration.
"""

import os
import time
from contextlib import contextmanager
from typing import Any

import boto3

from shared.logger import log

NAMESPACE = "EventTicketingSystem"
STACK_NAME = os.getenv("AWS_SAM_LOCAL", "") or os.getenv(
    "AWS_CLOUDFORMATION_STACK_NAME", "event-ticketing-system"
)

_cloudwatch_client = None


def _client():
    """Lazy-initialise the CloudWatch client (re-used across warm starts)."""
    global _cloudwatch_client
    if _cloudwatch_client is None:
        _cloudwatch_client = boto3.client("cloudwatch")
    return _cloudwatch_client


def emit_metric(
    metric_name: str,
    value: float,
    unit: str,
    dimensions: list[dict[str, str]] | None = None,
) -> None:
    """Publish a single custom metric data point to CloudWatch."""
    try:
        metric_data: dict[str, Any] = {
            "MetricName": metric_name,
            "Value": value,
            "Unit": unit,
        }
        if dimensions:
            metric_data["Dimensions"] = [
                {"Name": k, "Value": v} for d in dimensions for k, v in d.items()
            ]
        _client().put_metric_data(Namespace=NAMESPACE, MetricData=[metric_data])
    except Exception as exc:
        # Metrics should never break the request — log and continue.
        log("warning", "metric_publish_failed", metric=metric_name, error=str(exc))


def track_request(function_name: str, status_code: int) -> None:
    """Record an API request with success/failure categorisation."""
    status = "Success" if 200 <= status_code < 400 else "Error"
    emit_metric(
        "ApiRequestCount",
        1,
        "Count",
        [{"FunctionName": function_name}, {"Status": status}],
    )


def track_failed_registration(reason: str) -> None:
    """Record a failed registration attempt with a reason dimension."""
    emit_metric(
        "FailedRegistrations",
        1,
        "Count",
        [{"Reason": reason}],
    )


def track_duration(function_name: str, duration_ms: float) -> None:
    """Record Lambda handler execution time in milliseconds."""
    emit_metric(
        "HandlerDuration",
        duration_ms,
        "Milliseconds",
        [{"FunctionName": function_name}],
    )


@contextmanager
def request_tracker(function_name: str):
    """Context manager that tracks duration and request count automatically.

    Yields a dict where the caller can set ``status_code`` before exiting.
    On exit, the metrics are published.

    Usage::

        with request_tracker("RegisterFunction") as ctx:
            response = do_work()
            ctx["status_code"] = response["statusCode"]
    """
    ctx: dict[str, Any] = {"status_code": 500}
    start = time.perf_counter()
    try:
        yield ctx
    finally:
        duration_ms = (time.perf_counter() - start) * 1000
        track_request(function_name, ctx["status_code"])
        track_duration(function_name, duration_ms)
