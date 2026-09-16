---
description: The SQL-on-FHIR package Payerbox ships to compute the Da Vinci PAS Implementation Guide's suggested prior-auth metrics directly from stored FHIR data.
---

# PAS Metrics

Payerbox ships a SQL-on-FHIR package that computes the Da Vinci
Prior Authorization Support (PAS) Implementation Guide's suggested
metrics straight from the resources Aidbox already stores - the
`Claim`, `ClaimResponse` and `CommunicationRequest` produced by the
prior-auth flow. No separate reporting database, no ETL: the metrics
read the live FHIR data.

## What the IG proposes

The PAS IG describes a set of
[suggested metrics](https://hl7.org/fhir/us/davinci-pas/metrics.html)
that a prior-authorization system can report, together with a
logical **PASMetricData** model - one entry per submitted service
line, carrying the request and response timestamps, the item result,
the exchange type (initial, update, cancel, query), and the payer,
provider and line-of-business identifiers.

This package implements that model. A layer of
[SQL-on-FHIR](sql-on-fhir.md) `ViewDefinition`s flattens the raw FHIR
resources; a set of `Library` (SQLQuery) resources assembles the
`PASMetricData` rows from those views; and one `Library` per metric
computes the metric on top. The output is queryable as plain SQL, so
it feeds any BI tool.

## Metrics

The IG suggests ten metrics. The package implements all ten; two
query-based views additionally require the deployment to persist
inquiry (`Claim/$inquire`) exchanges.

| # | Metric | What it reports |
|---|---|---|
| 1 | Submission volume | Count of prior-auth requests submitted, by day, payer, provider and line of business |
| 2 | Updates, cancels and queries | Volume split into initial, update, cancel and query exchanges |
| 3 | Non-ordering provider queries | Query exchanges made by a provider other than the ordering one |
| 4 | Error percentage | Share of exchanges that carried a business error (`ClaimResponse.error`) |
| 5 | Final response on initial submission | Share of requests decided on the first response, without a pend |
| 6 | Pend volume and resolution | Items currently pended vs resolved, with average time to resolution |
| 7 | Time to final result | Elapsed time from request to final decision, per service line - the 100 slowest decided items per payer |
| 8 | Segmentation | Item counts by result (approved, denied, modified, pended, cancelled), segmented by day, payer, provider and line of business |
| 9 | Outstanding requests | Requests still awaiting a final decision |
| 10 | Pend aging | How long currently pended items have been waiting |

The **query bucket of metric 2** and **metric 3** report on
`Claim/$inquire` exchanges. `$inquire` is a read operation and
persists nothing by default; enable
[`PAS_PERSIST_INQUIRIES=true`](../prior-auth/pas.md#recording-inquiry-exchanges)
and every successful inquiry is stored as a query exchange record,
lighting up both. Metric 3 tells ordering from non-ordering queries
by comparing the inquiring provider's NPI with the NPI of the
provider on the original claim.

## The package

- **Download:**
  [`io.healthsamurai.pas-metrics-0.1.9.tar.gz`](https://storage.googleapis.com/payerbox-public/io.healthsamurai.pas-metrics-0.1.9.tar.gz)
- **Contents:** 26 SQL-on-FHIR resources - 10 `ViewDefinition`s and
  16 `Library` resources (6 source/model wrappers plus one per
  metric).
- **Dependencies:** `hl7.fhir.r4.core` only. The package reads PAS
  extensions by their canonical URL, so it installs and runs on any
  Aidbox that stores the prior-auth resources - the full PAS IG does
  not need to be loaded.

## Install

The package is a standard FHIR NPM package. `$fhir-package-install`
takes the tarball's location, which can be the download URL itself -
Aidbox fetches it directly, so there is nothing to download, mount or
vendor first:

```http
POST /fhir/$fhir-package-install
Content-Type: application/json

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "package", "valueString": "https://storage.googleapis.com/payerbox-public/io.healthsamurai.pas-metrics-0.1.9.tar.gz"}
  ]
}
```

The fetch is anonymous and happens from the Aidbox process, so this
form needs the instance to reach the bucket. Where it cannot - an
isolated or air-gapped deployment - download the tarball, put it where
Aidbox can read it, and pass a `file:///path/to/io.healthsamurai.pas-metrics-0.1.9.tar.gz`
location instead. Both forms take the same install path.

Re-running either is safe: canonical resources upsert by URL, so
installing the same version twice leaves one copy.

Alternatively, serve it from a package registry and reference it by
`io.healthsamurai.pas-metrics#0.1.9` in `BOX_BOOTSTRAP_FHIR_PACKAGES`
or an init bundle. Note that `BOX_BOOTSTRAP_FHIR_PACKAGES` only
installs into an empty package store - on a live instance use
`$fhir-package-install`. See
[FHIR packages](https://www.health-samurai.io/docs/aidbox/modules/fhir-package)
in the Aidbox docs for the mechanics.

### Large audit logs

Query exchanges are stored in the `auditevent` table, which Payerbox
shares with the platform audit log, so metrics 2 and 3 scan it directly.
On a deployment with a large audit log, create the matching partial
index once:

```sql
create index if not exists auditevent_pas_exchange_type
  on auditevent (ts)
  where resource @> '{"subtype":[{"system":"http://prior-auth.example.org/CodeSystem/pas-exchange-type"}]}'::jsonb;
```

The first `where` clause of the query is byte-identical to this
predicate, which is what lets the partial index apply. Deployments that
do not record inquiries do not need the index.

## Query the metrics

Each metric is a SQLQuery `Library`. Run it directly and get rows
back:

```http
POST /fhir/Library/$sqlquery-run
Content-Type: application/json

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "queryReference", "valueReference": {"reference": "Library/<metric-library-id>"}},
    {"name": "_format", "valueCode": "json"}
  ]
}
```

Look the Library up by name first, for example
`GET /fhir/Library?url=https://example.org/Library/metric-07-time-to-final-result`.

For dashboards, wrap each metric's compiled SQL in a Postgres view
and point a BI tool at it, the same way as any other
[SQL-on-FHIR](sql-on-fhir.md) analytics.

## Reading the results

Three things are worth knowing when you interpret the numbers:

- **Request time is the submitted `Claim.created`**, the time the
  request carries in its payload, not the moment the server received
  it. Test data with a fixed `created` will pile onto that one date;
  real submissions carry a realistic timestamp.
- **Rows are per service line.** A request with two service items
  produces two rows, keyed by item sequence, because items in one
  request can be decided independently (one approved while another
  pends or is denied). When every item shares the same outcome and
  timing, the rows differ only by item sequence.
- **Metric 4 counts business errors, and only on requests that were
  accepted.** An error is an entry in `ClaimResponse.error` - typically
  an X12 error code written back by the utilization-management system.
  A submission rejected up front, for example by profile validation, is
  answered with an `OperationOutcome` and never stored, so it appears in
  neither the numerator nor the denominator of this metric. To exercise
  metric 4, drive a request that is accepted and then answered with an
  error rather than a decision.

The same ten metrics render as charts natively in an Aidbox Notebook (see
the Aidbox docs on Notebooks) - one `sql-query` cell per metric, resolved by
`Library` url. It is published beside the package:

- **Download:**
  [`io.healthsamurai.pas-metrics-0.1.9-notebook.json`](https://storage.googleapis.com/payerbox-public/io.healthsamurai.pas-metrics-0.1.9-notebook.json)

Create it like any other resource, once the package itself is installed:

```http
PUT /Notebook/pas-metrics
Content-Type: application/json

<the downloaded file>
```

The notebook is not part of the package tarball and is not installed by
`$fhir-package-install`: that operation materializes canonical conformance
resources, and a `Notebook` has none - it would be skipped silently.

