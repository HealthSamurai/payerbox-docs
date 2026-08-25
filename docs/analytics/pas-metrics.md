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
persists nothing by default, so these views are populated only where
the deployment chooses to store inquiries as `Claim` resources.
Metric 3 additionally needs the identity of the inquiring provider
captured on those stored inquiries to tell ordering from
non-ordering queries.

## The package

- **Download:**
  [`io.healthsamurai.pas-metrics-0.1.6.tar.gz`](https://storage.googleapis.com/payerbox-public/io.healthsamurai.pas-metrics-0.1.6.tar.gz)
- **Contents:** 25 SQL-on-FHIR resources - 10 `ViewDefinition`s and
  15 `Library` resources (5 source/model wrappers plus one per
  metric).
- **Dependencies:** `hl7.fhir.r4.core` only. The package reads PAS
  extensions by their canonical URL, so it installs and runs on any
  Aidbox that stores the prior-auth resources - the full PAS IG does
  not need to be loaded.

## Install

The package is a standard FHIR NPM package. Make the tarball
reachable by the Aidbox process, then install it with
`$fhir-package-install`:

```http
POST /fhir/$fhir-package-install
Content-Type: application/json

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "package", "valueString": "file:///path/to/io.healthsamurai.pas-metrics-0.1.6.tar.gz"}
  ]
}
```

Alternatively, serve it from a package registry and reference it by
`io.healthsamurai.pas-metrics#0.1.6` in `BOX_BOOTSTRAP_FHIR_PACKAGES`
or an init bundle. Note that `BOX_BOOTSTRAP_FHIR_PACKAGES` only
installs into an empty package store - on a live instance use
`$fhir-package-install`. See
[FHIR packages](https://www.health-samurai.io/docs/aidbox/modules/fhir-package)
in the Aidbox docs for the mechanics.

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

Here is an example of a notebook which would demonstrate metrics rendered as charts natively on Aidbox.

```json
{
  "resourceType": "Notebook",
  "id": "pas-metrics",
  "name": "PAS Metrics",
  "description": "The ten Da Vinci PAS IG suggested metrics, charted live over stored FHIR data.",
  "tags": [
    "pas",
    "metrics",
    "sql-on-fhir"
  ],
  "cells": [
    {
      "id": "c00-intro",
      "type": "markdown",
      "nb-title": "PAS Metrics",
      "value": "# PAS Metrics\n\nThe ten metrics suggested by the [Da Vinci PAS Implementation Guide](https://hl7.org/fhir/us/davinci-pas/metrics.html), computed with SQL-on-FHIR directly over the `Claim`, `ClaimResponse` and `CommunicationRequest` resources this Aidbox already stores. No ETL, no reporting database: every chart below reads live data.\n\nEach metric is a SQLQuery `Library` from the `io.healthsamurai.pas-metrics` package. The cells resolve them **by url** (ids are generated on install), run them, and render the result.\n\n**Two things to know when reading the numbers:**\n\n- **Request time is `Claim.created`** - a payload field set by the submitter, not the server receive time. Test bundles with a hardcoded `created` pile every submission onto that one date.\n- **Rows are per service item**, not per claim. A request with two service lines produces two rows: in PAS each item carries its own decision, so one item can be approved while another pends."
    },
    {
      "id": "c01-md",
      "type": "markdown",
      "nb-title": "Metric 1 - submission volume",
      "value": "## Metric 1 - Volume of PAS submissions\n\nHow many prior-auth requests arrive, by day. `submission_count` counts distinct exchanges (claims); `item_count` counts the service lines inside them."
    },
    {
      "id": "c01-chart",
      "type": "sql-query",
      "nb-title": "Metric 1 - submissions per day",
      "value": "{\"url\": \"https://example.org/Library/metric-01-submission-volume\", \"chart\": {\"type\": \"custom\", \"x\": \"day\", \"y\": [\"submission_count\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"slice(datum.day, 0, 10)\\\", \\\"as\\\": \\\"date\\\"}], \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true, \\\"color\\\": \\\"#1e71d9\\\"}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"date\\\", \\\"type\\\": \\\"nominal\\\", \\\"sort\\\": \\\"ascending\\\", \\\"axis\\\": {\\\"title\\\": \\\"day\\\", \\\"labelAngle\\\": -45, \\\"labelOverlap\\\": \\\"greedy\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"submission_count\\\", \\\"type\\\": \\\"quantitative\\\", \\\"aggregate\\\": \\\"sum\\\", \\\"axis\\\": {\\\"title\\\": \\\"submissions\\\"}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c02-md",
      "type": "markdown",
      "nb-title": "Metric 2 - updates, cancels, queries",
      "value": "## Metric 2 - Updates, cancels and queries\n\nThe non-initial traffic, split by exchange type and stacked per day.\n\nA conformant 2.1.0 cancel is a `profile-claim-update` claim carrying certification type **3**, so it lands in the **cancel** bucket via that signal rather than `Claim.status`. The **query** bucket stays empty unless the deployment persists `$inquire` exchanges as `Claim` resources - `$inquire` is a read operation and stores nothing by default."
    },
    {
      "id": "c02-chart",
      "type": "sql-query",
      "nb-title": "Metric 2 - exchange types per day",
      "value": "{\"url\": \"https://example.org/Library/metric-02-updates-cancels-queries\", \"chart\": {\"type\": \"custom\", \"x\": \"day\", \"y\": [\"exchange_count\"], \"color\": \"exchange_type\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"slice(datum.day, 0, 10)\\\", \\\"as\\\": \\\"date\\\"}], \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"date\\\", \\\"type\\\": \\\"nominal\\\", \\\"sort\\\": \\\"ascending\\\", \\\"axis\\\": {\\\"title\\\": \\\"day\\\", \\\"labelAngle\\\": -45, \\\"labelOverlap\\\": \\\"greedy\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"exchange_count\\\", \\\"type\\\": \\\"quantitative\\\", \\\"axis\\\": {\\\"title\\\": \\\"exchanges\\\"}, \\\"stack\\\": \\\"zero\\\"}, \\\"color\\\": {\\\"field\\\": \\\"exchange_type\\\", \\\"type\\\": \\\"nominal\\\", \\\"legend\\\": {\\\"title\\\": \\\"exchange type\\\"}, \\\"scale\\\": {\\\"range\\\": [\\\"#8a8f98\\\", \\\"#e07a3f\\\", \\\"#2a9d8f\\\", \\\"#1e71d9\\\"]}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c03-md",
      "type": "markdown",
      "nb-title": "Metric 3 - non-ordering provider queries",
      "value": "## Metric 3 - Queries by a non-ordering provider\n\nOf all query exchanges, how many came from a provider other than the one who ordered the service.\n\n**Structurally zero in most deployments.** It needs two things the runtime does not capture by default: persisted inquiry exchanges (see metric 2) *and* the identity of the inquiring provider. Both light up together."
    },
    {
      "id": "c03-chart",
      "type": "sql-query",
      "nb-title": "Metric 3 - query split",
      "value": "{\"url\": \"https://example.org/Library/metric-03-non-ordering-provider-queries\", \"chart\": {\"type\": \"custom\", \"x\": \"metric\", \"y\": [\"value\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"fold\\\": [\\\"queries_total\\\", \\\"queries_by_non_ordering_provider\\\"], \\\"as\\\": [\\\"metric\\\", \\\"value\\\"]}], \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true, \\\"size\\\": 60}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"metric\\\", \\\"type\\\": \\\"nominal\\\", \\\"axis\\\": {\\\"labelAngle\\\": 0, \\\"title\\\": null}}, \\\"y\\\": {\\\"field\\\": \\\"value\\\", \\\"type\\\": \\\"quantitative\\\", \\\"axis\\\": {\\\"title\\\": \\\"queries\\\"}}, \\\"color\\\": {\\\"field\\\": \\\"metric\\\", \\\"type\\\": \\\"nominal\\\", \\\"legend\\\": null, \\\"scale\\\": {\\\"range\\\": [\\\"#1e71d9\\\", \\\"#2a9d8f\\\"]}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c04-md",
      "type": "markdown",
      "nb-title": "Metric 4 - error percentage",
      "value": "## Metric 4 - Error percentage\n\nShare of exchanges that came back carrying a business error (`ClaimResponse.error`), per day.\n\nThis is the FHIR-level proxy: the IG-true transport-layer HTTP status is not part of the stored resources."
    },
    {
      "id": "c04-chart",
      "type": "sql-query",
      "nb-title": "Metric 4 - error % per day",
      "value": "{\"url\": \"https://example.org/Library/metric-04-error-percent\", \"chart\": {\"type\": \"custom\", \"x\": \"day\", \"y\": [\"error_pct\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"slice(datum.day, 0, 10)\\\", \\\"as\\\": \\\"date\\\"}], \\\"layer\\\": [{\\\"mark\\\": {\\\"type\\\": \\\"line\\\", \\\"color\\\": \\\"#d1495b\\\", \\\"point\\\": {\\\"color\\\": \\\"#d1495b\\\"}, \\\"tooltip\\\": true}}], \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"date\\\", \\\"type\\\": \\\"nominal\\\", \\\"sort\\\": \\\"ascending\\\", \\\"axis\\\": {\\\"title\\\": \\\"day\\\", \\\"labelAngle\\\": -45, \\\"labelOverlap\\\": \\\"greedy\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"error_pct\\\", \\\"type\\\": \\\"quantitative\\\", \\\"aggregate\\\": \\\"mean\\\", \\\"axis\\\": {\\\"title\\\": \\\"error % (mean over payer / LOB)\\\"}, \\\"scale\\\": {\\\"domainMin\\\": 0}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c05-md",
      "type": "markdown",
      "nb-title": "Metric 5 - final response on initial submission",
      "value": "## Metric 5 - Final response on the initial submission\n\nShare of requests that got their final answer on the first response, without a pend round. Two readings: **all items** final on the initial response, and **any item** final.\n\n**Cancelled exchanges are excluded by design.** A cancellation is a requester withdrawal, not a payer decision, so it belongs in neither the numerator nor the denominator. Cancelled volume shows up in metric 8 instead."
    },
    {
      "id": "c05-chart",
      "type": "sql-query",
      "nb-title": "Metric 5 - final-on-initial %",
      "value": "{\"url\": \"https://example.org/Library/metric-05-final-on-initial-percent\", \"chart\": {\"type\": \"custom\", \"x\": \"day\", \"y\": [\"pct_all_items_final_on_initial\", \"pct_any_item_final_on_initial\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"slice(datum.day, 0, 10)\\\", \\\"as\\\": \\\"date\\\"}, {\\\"fold\\\": [\\\"pct_all_items_final_on_initial\\\", \\\"pct_any_item_final_on_initial\\\"], \\\"as\\\": [\\\"measure\\\", \\\"pct\\\"]}], \\\"mark\\\": {\\\"type\\\": \\\"line\\\", \\\"point\\\": true, \\\"tooltip\\\": true}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"date\\\", \\\"type\\\": \\\"nominal\\\", \\\"sort\\\": \\\"ascending\\\", \\\"axis\\\": {\\\"title\\\": \\\"day\\\", \\\"labelAngle\\\": -45, \\\"labelOverlap\\\": \\\"greedy\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"pct\\\", \\\"type\\\": \\\"quantitative\\\", \\\"aggregate\\\": \\\"mean\\\", \\\"axis\\\": {\\\"title\\\": \\\"% of exchanges (mean over payer / LOB)\\\"}, \\\"scale\\\": {\\\"domain\\\": [0, 100]}}, \\\"color\\\": {\\\"field\\\": \\\"measure\\\", \\\"type\\\": \\\"nominal\\\", \\\"legend\\\": {\\\"title\\\": null}, \\\"scale\\\": {\\\"range\\\": [\\\"#2e9e5b\\\", \\\"#1e71d9\\\"]}}, \\\"strokeDash\\\": {\\\"field\\\": \\\"measure\\\", \\\"type\\\": \\\"nominal\\\", \\\"legend\\\": null}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c06-md",
      "type": "markdown",
      "nb-title": "Metric 6 - pend volume and resolution",
      "value": "## Metric 6 - Pend volume and resolution\n\nPer payer: how many items sit pended right now versus how many are resolved, and how long resolution takes on average.\n\n`items_resolved` counts items that carry a real decision - the queued `ClaimResponse` a payer emits on receipt is not a resolution."
    },
    {
      "id": "c06-chart",
      "type": "sql-query",
      "nb-title": "Metric 6 - pended vs resolved per payer",
      "value": "{\"url\": \"https://example.org/Library/metric-06-pend-volume-and-resolution\", \"chart\": {\"type\": \"custom\", \"x\": \"payer_id\", \"y\": [\"items_currently_pended\", \"items_resolved\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"datum.payer_id == null ? 'unattributed' : datum.payer_id\\\", \\\"as\\\": \\\"payer\\\"}, {\\\"fold\\\": [\\\"items_currently_pended\\\", \\\"items_resolved\\\"], \\\"as\\\": [\\\"state\\\", \\\"items\\\"]}], \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"payer\\\", \\\"type\\\": \\\"nominal\\\", \\\"axis\\\": {\\\"labelAngle\\\": 0, \\\"title\\\": \\\"payer\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"items\\\", \\\"type\\\": \\\"quantitative\\\", \\\"aggregate\\\": \\\"sum\\\", \\\"axis\\\": {\\\"title\\\": \\\"items\\\"}}, \\\"xOffset\\\": {\\\"field\\\": \\\"state\\\"}, \\\"color\\\": {\\\"field\\\": \\\"state\\\", \\\"type\\\": \\\"nominal\\\", \\\"legend\\\": {\\\"title\\\": null}, \\\"scale\\\": {\\\"range\\\": [\\\"#e3b23c\\\", \\\"#2e9e5b\\\"]}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c07-md",
      "type": "markdown",
      "nb-title": "Metric 7 - time to final result",
      "value": "## Metric 7 - Time to final result\n\nHow long each decided service item waited, in hours. The metric returns the **100 slowest items per payer**, so a busy payer never crowds another one out of the list.\n\nPended items are excluded - they have no final result yet (they are metric 10's subject). The chart bins the durations into a distribution; the tooltip shows how many items fall in each bucket."
    },
    {
      "id": "c07-chart",
      "type": "sql-query",
      "nb-title": "Metric 7 - time-to-final distribution",
      "value": "{\"url\": \"https://example.org/Library/metric-07-time-to-final-result\", \"chart\": {\"type\": \"custom\", \"x\": \"time_to_final_hours\", \"y\": [\"count\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true, \\\"color\\\": \\\"#2a9d8f\\\"}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"time_to_final_hours\\\", \\\"type\\\": \\\"quantitative\\\", \\\"bin\\\": {\\\"maxbins\\\": 30}, \\\"axis\\\": {\\\"title\\\": \\\"hours to final decision\\\"}}, \\\"y\\\": {\\\"aggregate\\\": \\\"count\\\", \\\"type\\\": \\\"quantitative\\\", \\\"axis\\\": {\\\"title\\\": \\\"items\\\"}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c08-md",
      "type": "markdown",
      "nb-title": "Metric 8 - segmentation",
      "value": "## Metric 8 - Segmentation by result\n\nItem outcomes per day, stacked: approved, modified, denied, pended, cancelled. This is the one chart that shows every bucket at once, including the cancelled volume metric 5 deliberately leaves out."
    },
    {
      "id": "c08-chart",
      "type": "sql-query",
      "nb-title": "Metric 8 - item results per day",
      "value": "{\"url\": \"https://example.org/Library/metric-08-segmentation\", \"chart\": {\"type\": \"custom\", \"x\": \"day\", \"y\": [\"approved_items\", \"modified_items\", \"denied_items\", \"pended_items\", \"cancelled_items\"], \"color\": \"result\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"slice(datum.day, 0, 10)\\\", \\\"as\\\": \\\"date\\\"}, {\\\"fold\\\": [\\\"approved_items\\\", \\\"modified_items\\\", \\\"denied_items\\\", \\\"pended_items\\\", \\\"cancelled_items\\\"], \\\"as\\\": [\\\"result\\\", \\\"items\\\"]}, {\\\"calculate\\\": \\\"replace(datum.result, '_items', '')\\\", \\\"as\\\": \\\"result\\\"}], \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"date\\\", \\\"type\\\": \\\"nominal\\\", \\\"sort\\\": \\\"ascending\\\", \\\"axis\\\": {\\\"title\\\": \\\"day\\\", \\\"labelAngle\\\": -45, \\\"labelOverlap\\\": \\\"greedy\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"items\\\", \\\"type\\\": \\\"quantitative\\\", \\\"axis\\\": {\\\"title\\\": \\\"items\\\"}, \\\"stack\\\": \\\"zero\\\"}, \\\"color\\\": {\\\"field\\\": \\\"result\\\", \\\"type\\\": \\\"nominal\\\", \\\"legend\\\": {\\\"title\\\": \\\"result\\\"}, \\\"scale\\\": {\\\"domain\\\": [\\\"approved\\\", \\\"modified\\\", \\\"denied\\\", \\\"pended\\\", \\\"cancelled\\\"], \\\"range\\\": [\\\"#2e9e5b\\\", \\\"#e07a3f\\\", \\\"#d1495b\\\", \\\"#e3b23c\\\", \\\"#8a8f98\\\"]}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c09-md",
      "type": "markdown",
      "nb-title": "Metric 9 - outstanding requests",
      "value": "## Metric 9 - Outstanding requests\n\nRequests still waiting for a final decision, per payer - the current queue depth."
    },
    {
      "id": "c09-chart",
      "type": "sql-query",
      "nb-title": "Metric 9 - outstanding per payer",
      "value": "{\"url\": \"https://example.org/Library/metric-09-outstanding-requests\", \"chart\": {\"type\": \"custom\", \"x\": \"payer_id\", \"y\": [\"outstanding_requests\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"transform\\\": [{\\\"calculate\\\": \\\"datum.payer_id == null ? 'unattributed' : datum.payer_id\\\", \\\"as\\\": \\\"payer\\\"}], \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true, \\\"color\\\": \\\"#e3b23c\\\", \\\"size\\\": 60}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"payer\\\", \\\"type\\\": \\\"nominal\\\", \\\"sort\\\": \\\"-y\\\", \\\"axis\\\": {\\\"labelAngle\\\": 0, \\\"title\\\": \\\"payer\\\"}}, \\\"y\\\": {\\\"field\\\": \\\"outstanding_requests\\\", \\\"type\\\": \\\"quantitative\\\", \\\"aggregate\\\": \\\"sum\\\", \\\"axis\\\": {\\\"title\\\": \\\"outstanding requests\\\"}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c10-md",
      "type": "markdown",
      "nb-title": "Metric 10 - pend aging",
      "value": "## Metric 10 - Pend aging\n\nHow long the currently pended items have been waiting, in days. Where metric 9 gives the queue depth, this shows whether the queue is fresh or stale - the long tail is what turns into escalations."
    },
    {
      "id": "c10-chart",
      "type": "sql-query",
      "nb-title": "Metric 10 - age of pended items",
      "value": "{\"url\": \"https://example.org/Library/metric-10-pend-aging\", \"chart\": {\"type\": \"custom\", \"x\": \"age_days\", \"y\": [\"count\"], \"color\": \"\", \"rawSpec\": \"{\\\"$schema\\\": \\\"https://vega.github.io/schema/vega-lite/v6.json\\\", \\\"width\\\": \\\"container\\\", \\\"height\\\": 280, \\\"config\\\": {\\\"view\\\": {\\\"stroke\\\": null}, \\\"axis\\\": {\\\"grid\\\": false}}, \\\"mark\\\": {\\\"type\\\": \\\"bar\\\", \\\"tooltip\\\": true, \\\"color\\\": \\\"#e07a3f\\\"}, \\\"encoding\\\": {\\\"x\\\": {\\\"field\\\": \\\"age_days\\\", \\\"type\\\": \\\"quantitative\\\", \\\"bin\\\": {\\\"maxbins\\\": 30}, \\\"axis\\\": {\\\"title\\\": \\\"age, days\\\"}}, \\\"y\\\": {\\\"aggregate\\\": \\\"count\\\", \\\"type\\\": \\\"quantitative\\\", \\\"axis\\\": {\\\"title\\\": \\\"pended items\\\"}}}}\"}, \"view\": \"chart\"}"
    },
    {
      "id": "c11-outro",
      "type": "markdown",
      "nb-title": "Where the numbers come from",
      "value": "## Where the numbers come from\n\nEvery chart above runs one SQLQuery `Library` from `io.healthsamurai.pas-metrics`. The layering underneath:\n\n- **10 `ViewDefinition`s** flatten `Claim`, `ClaimResponse` (+ items, errors), `Coverage`, `Practitioner`, `PractitionerRole`, `Organization` and `CommunicationRequest`;\n- **5 wrapper `Library`s** assemble the IG's `PASMetricData` model from those views;\n- **10 metric `Library`s** compute the metrics on top.\n\nAidbox compiles the whole dependency chain into a single statement, so nothing is materialized - the views read the current rows every time. To use these outside the notebook, resolve a metric `Library` by url and `POST /fhir/Library/$sqlquery-run`, or wrap its compiled SQL in a Postgres view for a BI tool."
    }
  ]
}
```      
