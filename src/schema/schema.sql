-- ESG Radar — Lakebase Schema
-- Dataset: Kaggle ESG & Financial Performance Dataset
-- ~1,000 companies × 2015–2025 = ~11,000 rows

CREATE SCHEMA IF NOT EXISTS esg;

-- ── Dimension: Companies ────────────────────────────────────────────────────
-- Stable master data that doesn't change year-over-year (~1,000 rows)

CREATE TABLE esg.companies (
    company_id    INTEGER      PRIMARY KEY,
    company_name  VARCHAR(100) NOT NULL,
    industry      VARCHAR(50)  NOT NULL,
    region        VARCHAR(50)  NOT NULL
);

CREATE INDEX idx_companies_industry ON esg.companies (industry);
CREATE INDEX idx_companies_region   ON esg.companies (region);

-- ── Fact: Annual Metrics ────────────────────────────────────────────────────
-- One row per company per year (~11,000 rows)

CREATE TABLE esg.metrics (
    id                  SERIAL       PRIMARY KEY,
    company_id          INTEGER      NOT NULL REFERENCES esg.companies (company_id),
    year                SMALLINT     NOT NULL CHECK (year BETWEEN 2015 AND 2030),

    -- Financial
    revenue             NUMERIC(12,2),           -- millions USD
    profit_margin       NUMERIC(6,2),            -- % of revenue
    market_cap          NUMERIC(15,2),           -- millions USD
    growth_rate         NUMERIC(6,2),            -- YoY %; NULL for 2015 (no prior year)

    -- ESG Scores (0–100)
    esg_overall         NUMERIC(5,2) CHECK (esg_overall       BETWEEN 0 AND 100),
    esg_environmental   NUMERIC(5,2) CHECK (esg_environmental BETWEEN 0 AND 100),
    esg_social          NUMERIC(5,2) CHECK (esg_social        BETWEEN 0 AND 100),
    esg_governance      NUMERIC(5,2) CHECK (esg_governance    BETWEEN 0 AND 100),

    -- Environmental Impact
    carbon_emissions    NUMERIC(15,2),           -- tons CO₂
    water_usage         NUMERIC(15,2),           -- cubic meters
    energy_consumption  NUMERIC(15,2),           -- MWh

    UNIQUE (company_id, year)
);

CREATE INDEX idx_metrics_year    ON esg.metrics (year);
CREATE INDEX idx_metrics_esg     ON esg.metrics (esg_overall);
CREATE INDEX idx_metrics_company ON esg.metrics (company_id, year);
