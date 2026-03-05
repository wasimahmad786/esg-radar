"""Databricks SQL warehouse query helper."""
from __future__ import annotations

import os
import time
from typing import Any

from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

WAREHOUSE_ID = os.getenv("DATABRICKS_SQL_WAREHOUSE_ID", "490be1d9f2635bec")
CATALOG = "serverless_stable_ulobtu_catalog"
SCHEMA = "esg"
COMPANIES = f"{CATALOG}.{SCHEMA}.companies"
METRICS = f"{CATALOG}.{SCHEMA}.metrics"


def query(ws: WorkspaceClient, sql: str) -> list[dict[str, Any]]:
    """Execute SQL against the warehouse; return rows as dicts."""
    resp = ws.statement_execution.execute_statement(
        statement=sql,
        warehouse_id=WAREHOUSE_ID,
        wait_timeout="50s",
    )
    stmt_id = resp.statement_id

    # Poll up to ~5 min if not yet complete
    for _ in range(60):
        status = resp.status
        if status is not None and status.state in (
            StatementState.SUCCEEDED,
            StatementState.FAILED,
            StatementState.CANCELED,
            StatementState.CLOSED,
        ):
            break
        time.sleep(5)
        if stmt_id is not None:
            resp = ws.statement_execution.get_statement(str(stmt_id))

    status = resp.status
    if status is None or status.state != StatementState.SUCCEEDED:
        state_name = str(status.state) if status is not None else "UNKNOWN"
        err = status.error.message if status is not None and status.error is not None else state_name
        raise RuntimeError(f"SQL failed: {err}")

    result = resp.result
    if result is None:
        return []

    data_array = result.data_array
    if not data_array:
        return []

    manifest = resp.manifest
    columns: list[str] = []
    if manifest is not None:
        schema = manifest.schema
        if schema is not None and schema.columns is not None:
            columns = [col.name or "" for col in schema.columns]

    return [dict(zip(columns, row)) for row in data_array]


def build_where(
    *,
    sector: str | None = None,
    company_id: int | None = None,
    year: int | None = None,
    extra: list[str] | None = None,
) -> str:
    """Build a WHERE clause from optional filter params."""
    conditions: list[str] = []
    if sector:
        escaped = sector.replace("'", "''")
        conditions.append(f"c.industry = '{escaped}'")
    if company_id is not None:
        conditions.append(f"m.company_id = {int(company_id)}")
    if year is not None:
        conditions.append(f"m.year = {int(year)}")
    if extra:
        conditions.extend(extra)
    return ("WHERE " + " AND ".join(conditions)) if conditions else ""
