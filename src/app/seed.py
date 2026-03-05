"""
seed.py — Load ESG CSV from a Databricks Volume into Unity Catalog tables.

Source : /Volumes/serverless_stable_ulobtu_catalog/esg/data/company_esg_financial_dataset.csv
Target : serverless_stable_ulobtu_catalog.esg.companies
         serverless_stable_ulobtu_catalog.esg.metrics

Usage:
    uv run --with databricks-sdk python3 src/app/seed.py
    uv run --with databricks-sdk python3 src/app/seed.py --truncate   # re-seed from scratch
"""

import argparse
import time
from databricks.sdk import WorkspaceClient
from databricks.sdk.service.sql import StatementState

PROFILE       = "fe-vm-1"
WAREHOUSE_ID  = "490be1d9f2635bec"
CATALOG       = "serverless_stable_ulobtu_catalog"
SCHEMA        = "esg"
VOLUME_PATH   = f"/Volumes/{CATALOG}/{SCHEMA}/data/company_esg_financial_dataset.csv"


def run_sql(w: WorkspaceClient, sql: str, label: str = "") -> bool:
    resp = w.statement_execution.execute_statement(
        statement=sql,
        warehouse_id=WAREHOUSE_ID,
        wait_timeout="50s",
    )
    stmt_id = resp.statement_id
    for _ in range(60):
        if resp.status.state in (
            StatementState.SUCCEEDED, StatementState.FAILED,
            StatementState.CANCELED, StatementState.CLOSED,
        ):
            break
        time.sleep(5)
        resp = w.statement_execution.get_statement(stmt_id)

    if resp.status.state == StatementState.SUCCEEDED:
        rows = resp.result.data_array if resp.result else []
        print(f"  OK   {label}" + (f" ({len(rows)} rows)" if rows else ""))
        return True
    else:
        err = resp.status.error.message if resp.status.error else str(resp.status.state)
        print(f"  FAIL {label}: {err}")
        return False


def seed(truncate: bool = False) -> None:
    w = WorkspaceClient(profile=PROFILE)

    if truncate:
        print("Truncating existing data...")
        # metrics first (FK child)
        run_sql(w, f"TRUNCATE TABLE {CATALOG}.{SCHEMA}.metrics", "TRUNCATE metrics")
        run_sql(w, f"TRUNCATE TABLE {CATALOG}.{SCHEMA}.companies", "TRUNCATE companies")

    print(f"\nLoading from Volume: {VOLUME_PATH}")

    # ── 1. companies (dimension) ──────────────────────────────────────────────
    # Deduplicate on CompanyID — take the single stable row per company.
    sql_companies = f"""
INSERT INTO {CATALOG}.{SCHEMA}.companies
    (company_id, company_name, industry, region)
SELECT DISTINCT
    CAST(CompanyID   AS INT)     AS company_id,
    CompanyName                  AS company_name,
    Industry                     AS industry,
    Region                       AS region
FROM read_files(
    '{VOLUME_PATH}',
    format  => 'csv',
    header  => true
)
WHERE CompanyID IS NOT NULL
"""
    ok = run_sql(w, sql_companies.strip(), "INSERT companies")
    if not ok:
        return

    # ── 2. metrics (fact) ─────────────────────────────────────────────────────
    sql_metrics = f"""
INSERT INTO {CATALOG}.{SCHEMA}.metrics
    (company_id, year, revenue, profit_margin, market_cap, growth_rate,
     esg_overall, esg_environmental, esg_social, esg_governance,
     carbon_emissions, water_usage, energy_consumption)
SELECT
    CAST(CompanyID        AS INT)          AS company_id,
    CAST(Year             AS SMALLINT)     AS year,
    CAST(Revenue          AS DECIMAL(12,2)) AS revenue,
    CAST(ProfitMargin     AS DECIMAL(6,2))  AS profit_margin,
    CAST(MarketCap        AS DECIMAL(15,2)) AS market_cap,
    CAST(GrowthRate       AS DECIMAL(6,2))  AS growth_rate,
    CAST(ESG_Overall      AS DECIMAL(5,2))  AS esg_overall,
    CAST(ESG_Environmental AS DECIMAL(5,2)) AS esg_environmental,
    CAST(ESG_Social       AS DECIMAL(5,2))  AS esg_social,
    CAST(ESG_Governance   AS DECIMAL(5,2))  AS esg_governance,
    CAST(CarbonEmissions  AS DECIMAL(15,2)) AS carbon_emissions,
    CAST(WaterUsage       AS DECIMAL(15,2)) AS water_usage,
    CAST(EnergyConsumption AS DECIMAL(15,2)) AS energy_consumption
FROM read_files(
    '{VOLUME_PATH}',
    format  => 'csv',
    header  => true
)
WHERE CompanyID IS NOT NULL
  AND Year      IS NOT NULL
"""
    ok = run_sql(w, sql_metrics.strip(), "INSERT metrics")
    if not ok:
        return

    # ── 3. Verify row counts ──────────────────────────────────────────────────
    print("\nVerification:")
    for table in ("companies", "metrics"):
        resp = w.statement_execution.execute_statement(
            statement=f"SELECT COUNT(*) FROM {CATALOG}.{SCHEMA}.{table}",
            warehouse_id=WAREHOUSE_ID,
            wait_timeout="50s",
        )
        count = resp.result.data_array[0][0] if resp.result and resp.result.data_array else "?"
        print(f"  {CATALOG}.{SCHEMA}.{table}: {count} rows")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed ESG tables from Kaggle CSV.")
    parser.add_argument("--truncate", action="store_true",
                        help="Truncate tables before inserting (idempotent re-seed).")
    args = parser.parse_args()
    seed(truncate=args.truncate)
