---
description: Three access paths for analytics on Payerbox's FHIR data - FHIR API, raw SQL, materialized views - and how to choose between them.
---

# Analytics

How many prior auths last month? What's the denial rate? Payerbox
stores every prior auth and member API call as FHIR resources in
Aidbox, and this section is how you turn that into numbers.

Three surfaces read the same data. Pick the one that matches who's
asking.

## When to use what

| Need | Use | Why |
|---|---|---|
| Member-facing app, FHIR interop | FHIR API | Standard contract, auth + audit + AccessPolicy, paginated |
| Stable column-shaped reports for BI | Materialized view | Pre-computed, simple SQL |
| Bulk ETL, internal jobs, ad-hoc reporting | Raw SQL / view | Direct, no per-request overhead |

## Pages

- [Querying via FHIR API](fhir-api.md)
- [Flat views on FHIR data](flat-views.md)
- [SQL on FHIR data](sql-on-fhir.md)
- [Common queries](common-queries.md)
