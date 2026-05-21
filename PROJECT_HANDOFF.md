# SQL Visualizer - Project Handoff

This document summarizes the recent development session, highlighting completed features, bugs that were identified and resolved, and potential pending work for future iterations.

## ✅ What Has Been Completed

1. **Dynamic Query History Metrics (Rows & Costs)**
   - Updated the `useQueryHistory` hook and UI to accept, store, and dynamically render execution costs and row counts for each executed query in the history panel.
   - Integrated these metrics into the `Home.tsx` execution flow so that once a plan is fetched, its root metrics are passed to the history list.

2. **MySQL Execution Plan Parsing Enhancements**
   - **Cost Decimal Preservation:** Modified the MySQL adapter (`mysql.ts`) to maintain up to 2 decimal places for query costs. Previously, `Math.round()` was rounding costs like `0.35` down to `0`.
   - **Row Count Prioritization:** Updated the parser to properly extract the `rows` estimate from MySQL `EXPLAIN FORMAT=JSON` output, prioritizing the `rows` property over `rows_examined_per_scan`, which can sometimes be artificially low.
   - **Parent Metric Bubbling:** Fixed an issue where the root `QUERY BLOCK` in the visualization would always show `ROWS: 0` and `COST: 0`. The adapter now calculates the sum of all child operations and bubbles those totals up to the parent `QUERY BLOCK`.

3. **UI Clarity & Bug Fixes**
   - **Estimate Labels:** Changed the labels in the execution graph (`PlanNode.tsx`) from `ROWS:` and `COST:` to `EST. ROWS:` and `EST. COST:`. This clarifies that the visualizer displays the Query Optimizer's *estimates* (from `EXPLAIN`), which can differ from actual query results—especially for small tables in engines like InnoDB.
   - **Database Config Reset Glitch:** Fixed a frustrating UI bug in `DatabaseConfigPanel.tsx`. Previously, opening the "Configure Database" panel would reset the inputs back to the default `localhost/postgres` values, overriding any loaded `localStorage` data if the user hit save. The panel now strictly synchronizes its internal state with the active configuration immediately upon being opened.

## ⚠️ Errors & Challenges Faced

1. **"One Row" MySQL Bug**
   - **Symptom:** The user noticed that running `SELECT * FROM elections` (which contained 4 actual rows) resulted in the visualizer displaying `ROWS: 1`.
   - **Root Cause & Resolution:** This was partially a parsing priority issue (fixed by prioritizing the main `rows` property) and partially expected MySQL behavior. MySQL's Query Optimizer frequently estimates `1` row for very small InnoDB tables because it caches statistics to save performance. We resolved the confusion by adding the `EST.` prefix to the UI so users understand these are pre‑execution optimizer estimates.

2. **React State Stale Initialization**
   - **Symptom:** The database configuration panel didn't respect saved settings on the first click.
   - **Root Cause & Resolution:** The local React state for the form was initialized *before* the asynchronous `localStorage` fetch was completed. Fixed by ensuring `localConfig` is re‑synced right before the user toggles the form open.

## 🚀 Pending / Future Work

- **EXPLAIN ANALYZE Support:** While we currently parse the optimizer's execution *plan*, we could look into executing `EXPLAIN ANALYZE` (where available) to capture the *actual* execution time and row counts, plotting the difference between Estimated vs. Actual.
- **Further Database Support:** Currently, the system has adapters for PostgreSQL and MySQL. The architecture easily allows adding SQLite, SQL Server, or Oracle adapters in the future.
- **Query Optimization Hints:** We can improve the AI‑driven query optimizer to provide more detailed reasoning for why a query is a bottleneck (e.g. missing indexes, full table scans) in a dedicated side‑panel instead of just a code block.
- **End‑to‑End Testing:** Adding a basic test suite for the `mysql.ts` and `postgres.ts` parsers using mocked JSON payloads to prevent future regressions when traversing the `EXPLAIN` trees.
