from __future__ import annotations

import os
from typing import Any, Optional

from databricks.sdk.service.iam import User as UserOut

from .core import Dependencies, create_router
from .db import COMPANIES, METRICS, build_where, query
from .models import (
    CompanyOption,
    CompanyRow,
    EnvironmentalRow,
    FilterOptions,
    FinancialRow,
    GenieAskRequest,
    GenieAskResponse,
    KpiSummary,
    SectorBar,
    TrendPoint,
    VersionOut,
)

GENIE_SPACE_ID = os.getenv("GENIE_SPACE_ID", "01f11894d0b411d4b44aafa3d41e98c5")

router = create_router()


@router.get("/version", response_model=VersionOut, operation_id="version")
async def version() -> VersionOut:
    return VersionOut.from_metadata()


@router.get("/current-user", response_model=UserOut, operation_id="currentUser")
def me(user_ws: Dependencies.UserClient) -> UserOut:
    return user_ws.current_user.me()


# ── Filters ───────────────────────────────────────────────────────────────────

@router.get("/filters", response_model=FilterOptions, operation_id="getFilters")
def get_filters(ws: Dependencies.UserClient) -> FilterOptions:
    sector_rows = query(ws, f"SELECT DISTINCT industry FROM {COMPANIES} ORDER BY 1")
    company_rows = query(ws, f"""
        SELECT MIN(company_id) AS company_id, company_name, MIN(industry) AS industry
        FROM {COMPANIES}
        GROUP BY company_name
        ORDER BY industry, company_name
    """)
    year_rows = query(ws, f"SELECT DISTINCT year FROM {METRICS} ORDER BY 1")

    return FilterOptions(
        sectors=[r["industry"] for r in sector_rows],
        companies=[
            CompanyOption(
                company_id=int(r["company_id"]),
                company_name=r["company_name"],
                industry=r["industry"],
            )
            for r in company_rows
        ],
        years=[int(r["year"]) for r in year_rows],
    )


# ── KPIs ──────────────────────────────────────────────────────────────────────

@router.get("/kpis", response_model=KpiSummary, operation_id="getKpis")
def get_kpis(
    ws: Dependencies.UserClient,
    sector: Optional[str] = None,
    company_id: Optional[int] = None,
    year: Optional[int] = None,
) -> KpiSummary:
    where = build_where(sector=sector, company_id=company_id, year=year)
    sql = f"""
        SELECT
            AVG(m.esg_overall)       AS esg_overall,
            AVG(m.esg_environmental) AS esg_environmental,
            AVG(m.esg_social)        AS esg_social,
            AVG(m.esg_governance)    AS esg_governance
        FROM {METRICS} m
        JOIN {COMPANIES} c ON m.company_id = c.company_id
        {where}
    """
    rows = query(ws, sql)
    r = rows[0] if rows else {}
    return KpiSummary(
        esg_overall=float(r.get("esg_overall") or 0),
        esg_environmental=float(r.get("esg_environmental") or 0),
        esg_social=float(r.get("esg_social") or 0),
        esg_governance=float(r.get("esg_governance") or 0),
    )


# ── ESG Trends (Overview tab) ─────────────────────────────────────────────────

@router.get("/esg-trends", response_model=list[TrendPoint], operation_id="getEsgTrends")
def get_esg_trends(
    ws: Dependencies.UserClient,
    sector: Optional[str] = None,
    company_id: Optional[int] = None,
) -> list[TrendPoint]:
    where = build_where(sector=sector, company_id=company_id)
    sql = f"""
        SELECT
            m.year,
            AVG(m.esg_overall)       AS esg_overall,
            AVG(m.esg_environmental) AS esg_environmental,
            AVG(m.esg_social)        AS esg_social,
            AVG(m.esg_governance)    AS esg_governance
        FROM {METRICS} m
        JOIN {COMPANIES} c ON m.company_id = c.company_id
        {where}
        GROUP BY m.year
        ORDER BY m.year
    """
    rows = query(ws, sql)
    return [
        TrendPoint(
            year=int(r["year"]),
            esg_overall=float(r["esg_overall"] or 0),
            esg_environmental=float(r["esg_environmental"] or 0),
            esg_social=float(r["esg_social"] or 0),
            esg_governance=float(r["esg_governance"] or 0),
        )
        for r in rows
    ]


# ── ESG by Sector (Overview tab) ──────────────────────────────────────────────

@router.get("/esg-by-sector", response_model=list[SectorBar], operation_id="getEsgBySector")
def get_esg_by_sector(
    ws: Dependencies.UserClient,
    year: Optional[int] = None,
) -> list[SectorBar]:
    where = build_where(year=year)
    # year filter needs both tables joined
    if year is not None:
        sql = f"""
            SELECT
                c.industry                   AS sector,
                AVG(m.esg_environmental)     AS esg_environmental,
                AVG(m.esg_social)            AS esg_social,
                AVG(m.esg_governance)        AS esg_governance
            FROM {METRICS} m
            JOIN {COMPANIES} c ON m.company_id = c.company_id
            {where}
            GROUP BY c.industry
            ORDER BY c.industry
        """
    else:
        sql = f"""
            SELECT
                c.industry                   AS sector,
                AVG(m.esg_environmental)     AS esg_environmental,
                AVG(m.esg_social)            AS esg_social,
                AVG(m.esg_governance)        AS esg_governance
            FROM {METRICS} m
            JOIN {COMPANIES} c ON m.company_id = c.company_id
            GROUP BY c.industry
            ORDER BY c.industry
        """
    rows = query(ws, sql)
    return [
        SectorBar(
            sector=r["sector"],
            esg_environmental=float(r["esg_environmental"] or 0),
            esg_social=float(r["esg_social"] or 0),
            esg_governance=float(r["esg_governance"] or 0),
        )
        for r in rows
    ]


# ── Environmental (Environmental tab) ────────────────────────────────────────

@router.get("/environmental", response_model=list[EnvironmentalRow], operation_id="getEnvironmental")
def get_environmental(
    ws: Dependencies.UserClient,
    sector: Optional[str] = None,
    company_id: Optional[int] = None,
) -> list[EnvironmentalRow]:
    where = build_where(sector=sector, company_id=company_id)
    sql = f"""
        SELECT
            m.year,
            AVG(m.carbon_emissions)   AS carbon_emissions,
            AVG(m.water_usage)        AS water_usage,
            AVG(m.energy_consumption) AS energy_consumption
        FROM {METRICS} m
        JOIN {COMPANIES} c ON m.company_id = c.company_id
        {where}
        GROUP BY m.year
        ORDER BY m.year
    """
    rows = query(ws, sql)
    return [
        EnvironmentalRow(
            year=int(r["year"]),
            carbon_emissions=float(r["carbon_emissions"] or 0),
            water_usage=float(r["water_usage"] or 0),
            energy_consumption=float(r["energy_consumption"] or 0),
        )
        for r in rows
    ]


# ── Financial (Financial tab) ────────────────────────────────────────────────

@router.get("/financial", response_model=list[FinancialRow], operation_id="getFinancial")
def get_financial(
    ws: Dependencies.UserClient,
    sector: Optional[str] = None,
    company_id: Optional[int] = None,
) -> list[FinancialRow]:
    where = build_where(sector=sector, company_id=company_id)
    sql = f"""
        SELECT
            m.year,
            AVG(m.revenue)       AS revenue,
            AVG(m.profit_margin) AS profit_margin,
            AVG(m.market_cap)    AS market_cap,
            AVG(m.growth_rate)   AS growth_rate
        FROM {METRICS} m
        JOIN {COMPANIES} c ON m.company_id = c.company_id
        {where}
        GROUP BY m.year
        ORDER BY m.year
    """
    rows = query(ws, sql)
    return [
        FinancialRow(
            year=int(r["year"]),
            revenue=float(r["revenue"] or 0),
            profit_margin=float(r["profit_margin"] or 0),
            market_cap=float(r["market_cap"] or 0),
            growth_rate=float(r["growth_rate"]) if r.get("growth_rate") is not None else None,
        )
        for r in rows
    ]


# ── Companies (Comparison tab) ────────────────────────────────────────────────

@router.get("/companies", response_model=list[CompanyRow], operation_id="getCompanies")
def get_companies(
    ws: Dependencies.UserClient,
    sector: Optional[str] = None,
    year: Optional[int] = None,
) -> list[CompanyRow]:
    # Default to latest year if no year specified
    where = build_where(sector=sector, year=year)
    if year is None:
        # Get latest year per company; apply sector filter in WHERE before QUALIFY
        sector_filter = f"WHERE c.industry = '{sector.replace(chr(39), chr(39)*2)}'" if sector else ""
        sql = f"""
            SELECT
                c.company_id, c.company_name, c.industry, c.region,
                m.year,
                m.esg_overall, m.esg_environmental, m.esg_social, m.esg_governance,
                m.revenue, m.profit_margin, m.market_cap
            FROM {METRICS} m
            JOIN {COMPANIES} c ON m.company_id = c.company_id
            {sector_filter}
            QUALIFY ROW_NUMBER() OVER (PARTITION BY m.company_id ORDER BY m.year DESC) = 1
            ORDER BY m.esg_overall DESC
            LIMIT 200
        """
    else:
        sql = f"""
            SELECT
                c.company_id, c.company_name, c.industry, c.region,
                m.year,
                m.esg_overall, m.esg_environmental, m.esg_social, m.esg_governance,
                m.revenue, m.profit_margin, m.market_cap
            FROM {METRICS} m
            JOIN {COMPANIES} c ON m.company_id = c.company_id
            {where}
            ORDER BY m.esg_overall DESC
            LIMIT 200
        """
    rows = query(ws, sql)
    return [
        CompanyRow(
            company_id=int(r["company_id"]),
            company_name=r["company_name"],
            industry=r["industry"],
            region=r["region"],
            year=int(r["year"]),
            esg_overall=float(r["esg_overall"] or 0),
            esg_environmental=float(r["esg_environmental"] or 0),
            esg_social=float(r["esg_social"] or 0),
            esg_governance=float(r["esg_governance"] or 0),
            revenue=float(r["revenue"]) if r.get("revenue") is not None else None,
            profit_margin=float(r["profit_margin"]) if r.get("profit_margin") is not None else None,
            market_cap=float(r["market_cap"]) if r.get("market_cap") is not None else None,
        )
        for r in rows
    ]


# ── Genie Ask AI ──────────────────────────────────────────────────────────────

@router.post("/genie/ask", response_model=GenieAskResponse, operation_id="genieAsk")
def genie_ask(body: GenieAskRequest, ws: Dependencies.UserClient) -> GenieAskResponse:
    """Send a question to the Genie Space and return the answer + SQL + data."""
    try:
        if body.conversation_id:
            msg = ws.genie.create_message_and_wait(
                space_id=GENIE_SPACE_ID,
                conversation_id=body.conversation_id,
                content=body.question,
            )
        else:
            msg = ws.genie.start_conversation_and_wait(
                space_id=GENIE_SPACE_ID,
                content=body.question,
            )
    except Exception as e:
        return GenieAskResponse(
            conversation_id=body.conversation_id or "",
            message_id="",
            question=body.question,
            status="FAILED",
            error=str(e),
        )

    text_content: Optional[str] = None
    sql_query: Optional[str] = None
    columns: list[str] = []
    rows: list[list[Any]] = []

    for attachment in (msg.attachments or []):
        if attachment.text and attachment.text.content:
            text_content = attachment.text.content
        if attachment.query and attachment.query.query:
            sql_query = attachment.query.query
            # Fetch results using the statement_id if available
            stmt_id = attachment.query.statement_id
            if stmt_id:
                try:
                    stmt = ws.statement_execution.get_statement(stmt_id)
                    if stmt.manifest and stmt.manifest.schema and stmt.manifest.schema.columns:
                        columns = [c.name or "" for c in stmt.manifest.schema.columns]
                    if stmt.result and stmt.result.data_array:
                        rows = [list(r) for r in stmt.result.data_array]
                except Exception:
                    pass

    return GenieAskResponse(
        conversation_id=msg.conversation_id or "",
        message_id=msg.message_id or "",
        question=body.question,
        text=text_content,
        sql=sql_query,
        columns=columns,
        rows=rows,
        row_count=len(rows),
        status=msg.status.value if msg.status else "COMPLETED",
    )
