---
description: The materialized view Payerbox builds for prior-auth analytics, the raw EOB table, and the FHIR ↔ SQL routing.
---

# SQL on FHIR data

For joins, aggregates, and other complex SQL manipulation, drop to
SQL. This page covers the materialized view Payerbox uses for
prior-auth analytics, the raw EOB table underneath it, and how to
expose SQL through the FHIR API.

## The materialized view

`sof.pdex_prior_authorization_item` is materialized from the
[ViewDefinition of the same name](flat-views.md). Same columns, just
persisted as a Postgres relation:

```sql
SELECT eob_id, business_identifier, status, outcome, created, disposition
FROM   sof.pdex_prior_authorization_item
WHERE  status = 'active' AND outcome = 'complete'
LIMIT  10;
```

Reads are plain column access - the expensive JSONB extraction ran
once at refresh time.

### Refresh

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY sof.pdex_prior_authorization_item;
```

`CONCURRENTLY` keeps the view readable while it refreshes (requires
a unique index on the view). Cadence is whatever your dashboard
tolerates. For ~30M EOBs: ~20 min from-scratch build, a few minutes
for refresh.

## The raw EOB table

Every FHIR resource lives in a lowercase Postgres table -
`ExplanationOfBenefit` is at `public.explanationofbenefit`. The
whole FHIR payload sits in the `resource` jsonb column, with `id`,
`cts`, `ts`, and a few other columns alongside. The full layout is
in
[Database schema](https://www.health-samurai.io/docs/aidbox/database/database-schema)
in the Aidbox docs.

For analytics, prefer the materialized view; reach for the raw table when
you need fields the materialized view doesn't expose.

## SQL through the FHIR API

`AidboxQuery` packages SQL as a named REST endpoint with typed
parameters, defaults, and an optional total-count query. Define
once with `PUT` - the example below exposes
[denial rate by month](common-queries.md#8.-denial-rate-by-month)
as a callable endpoint, parameterized by start date:

```http
PUT /AidboxQuery/denial-rate-since
Content-Type: application/json

{
  "params": {"since": {"isRequired": true}},
  "query": "SELECT date_trunc('month', created::date)::date AS month, round(100.0 * count(*) FILTER (WHERE outcome = 'error') / nullif(count(*), 0), 1) AS denial_pct FROM sof.pdex_prior_authorization_item WHERE created::date >= {{params.since}}::date GROUP BY 1 ORDER BY 1 DESC",
  "count-query": "SELECT count(*) FROM sof.pdex_prior_authorization_item WHERE created::date >= {{params.since}}::date"
}
```

Call it as `GET` or, for long parameter lists, `POST`:

```http
GET  /$query/denial-rate-since?since=2025-05-01
POST /$query/denial-rate-since
{"params": {"since": "2025-05-01"}}
```

Full parameter spec, format strings, and access control in
[AidboxQuery](https://www.health-samurai.io/docs/aidbox/api/rest-api/aidbox-search#aidboxquery)
in the Aidbox docs.

## Connecting BI tools

BI tools (Tableau, Looker, Metabase, Power BI) connect to
`sof.pdex_prior_authorization_item` over Postgres. Freshness
follows your `REFRESH MATERIALIZED VIEW` schedule.
