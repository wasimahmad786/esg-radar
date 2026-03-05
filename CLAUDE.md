# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This project is in initial setup. No application code exists yet.

## MCP Servers

A Databricks MCP server is configured in `.mcp.json`, using the `DEFAULT` profile from `~/.databrickscfg`. It runs via the `ai-dev-kit` venv at `~/.ai-dev-kit/`.

## Tooling

- `apx` — the intended app framework CLI (not yet installed); install before running `uv run apx dev start`
- `shadcn` — UI component library, initialized via `npx shadcn@latest init`
- `uv` — Python package/environment manager

