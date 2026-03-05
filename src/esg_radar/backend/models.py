from __future__ import annotations

from typing import Optional

from pydantic import BaseModel

from .. import __version__


class VersionOut(BaseModel):
    version: str

    @classmethod
    def from_metadata(cls) -> "VersionOut":
        return cls(version=__version__)


# ── Filter options ────────────────────────────────────────────────────────────

class CompanyOption(BaseModel):
    company_id: int
    company_name: str
    industry: str


class FilterOptions(BaseModel):
    sectors: list[str]
    companies: list[CompanyOption]
    years: list[int]


# ── KPI summary ───────────────────────────────────────────────────────────────

class KpiSummary(BaseModel):
    esg_overall: float
    esg_environmental: float
    esg_social: float
    esg_governance: float


# ── Overview tab ──────────────────────────────────────────────────────────────

class TrendPoint(BaseModel):
    year: int
    esg_overall: float
    esg_environmental: float
    esg_social: float
    esg_governance: float


class SectorBar(BaseModel):
    sector: str
    esg_environmental: float
    esg_social: float
    esg_governance: float


# ── Environmental tab ─────────────────────────────────────────────────────────

class EnvironmentalRow(BaseModel):
    year: int
    carbon_emissions: float
    water_usage: float
    energy_consumption: float


# ── Financial tab ─────────────────────────────────────────────────────────────

class FinancialRow(BaseModel):
    year: int
    revenue: float
    profit_margin: float
    market_cap: float
    growth_rate: Optional[float] = None


# ── Comparison tab ────────────────────────────────────────────────────────────

class CompanyRow(BaseModel):
    company_id: int
    company_name: str
    industry: str
    region: str
    year: int
    esg_overall: float
    esg_environmental: float
    esg_social: float
    esg_governance: float
    revenue: Optional[float] = None
    profit_margin: Optional[float] = None
    market_cap: Optional[float] = None
