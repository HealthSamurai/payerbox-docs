---
description: Declare a flat, spreadsheet-shaped projection of Payerbox's FHIR data with a ViewDefinition - then run it ad-hoc or materialize it.
---

# Flat views on FHIR data

A [ViewDefinition](https://www.health-samurai.io/docs/aidbox/modules/sql-on-fhir/defining-flat-views-with-view-definitions)
declares a flat table: which
[FHIRPath](http://hl7.org/fhirpath/) expressions become columns,
which arrays unnest into rows, what `where` clause filters the
input. Aidbox can run it on the fly or persist it as a Postgres
relation.

The example below is the view Payerbox uses for prior-auth
analytics: `pdex_prior_authorization_item`. The Aidbox UI has a
**ViewDefinition Builder** for editing it visually:

![ViewDefinition Builder showing pdex_prior_authorization_item with its WHERE clauses, columns, and a sample EOB instance side-by-side](../../assets/analytics/viewdefinition-builder.avif)

## The ViewDefinition

The same view as JSON - fields a prior-auth analyst usually needs,
flattened from `ExplanationOfBenefit`:

```json
{
  "resourceType": "ViewDefinition",
  "name": "pdex_prior_authorization_item",
  "resource": "ExplanationOfBenefit",
  "where": [
    {"path": "meta.profile.where($this = 'http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-priorauthorization').exists()"},
    {"path": "use = 'preauthorization'"}
  ],
  "select": [{"column": [
    {"path": "id",                        "name": "eob_id",                    "type": "string"},
    {"path": "identifier.first().value",  "name": "business_identifier",       "type": "string"},
    {"path": "identifier.first().system", "name": "business_identifier_system","type": "uri"},
    {"path": "status",                    "name": "status",                    "type": "code"},
    {"path": "outcome",                   "name": "outcome",                   "type": "code"},
    {"path": "created",                   "name": "created",                   "type": "dateTime"}
  ]}]
}
```

The `where` clause restricts to EOBs tagged with the
[PDex Prior Authorization](http://hl7.org/fhir/us/davinci-pdex/StructureDefinition-pdex-priorauthorization.html)
profile and with `use = 'preauthorization'`.

## Materialize it

`$materialize` turns the ViewDefinition into a Postgres relation.

{% tabs %}
{% tab title="Request" %}
```http
POST /fhir/ViewDefinition/pdex_prior_authorization_item/$materialize
Content-Type: application/json

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "type", "valueCode": "materialized-view"}
  ]
}
```
{% endtab %}
{% tab title="Response" %}
```http
HTTP/1.1 200 OK

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "schema",   "valueString": "sof"},
    {"name": "relation", "valueString": "pdex_prior_authorization_item"},
    {"name": "type",     "valueCode":   "materialized-view"}
  ]
}
```
{% endtab %}
{% endtabs %}

The result is `sof.pdex_prior_authorization_item` - a regular
Postgres relation any client can `SELECT` from. `type` accepts
`view`, `materialized-view`, or `table`; full parameter list in
[`$materialize` operation](https://www.health-samurai.io/docs/aidbox/modules/sql-on-fhir/operation-materialize)
in the Aidbox docs.

## Run it ad-hoc - no materialization

`$run` returns rows without persisting anything:

```http
POST /fhir/ViewDefinition/pdex_prior_authorization_item/$run
Content-Type: application/json

{
  "resourceType": "Parameters",
  "parameter": [
    {"name": "_format", "valueCode": "csv"}
  ]
}
```

Output formats (`csv`, `json`, `ndjson`, `fhir`) and the rest of the
parameters live in
[`$run` operation](https://www.health-samurai.io/docs/aidbox/modules/sql-on-fhir/operation-run)
in the Aidbox docs.

## De-identifying columns

Any column can carry a de-identification extension that transforms
its value at SQL generation time - useful for BI dashboards exposed
to vendors, HIPAA Safe Harbor reporting, or analytics roles that
shouldn't see raw identifiers.

```json
{
  "name": "business_identifier",
  "path": "identifier.first().value",
  "type": "string",
  "extension": [{
    "url": "http://health-samurai.io/fhir/core/StructureDefinition/de-identification",
    "extension": [
      {"url": "method", "valueCode": "cryptoHash"},
      {"url": "cryptoHashKey", "valueString": "..."}
    ]
  }]
}
```

Full method list and parameters in
[De-identification](https://www.health-samurai.io/docs/aidbox/modules/sql-on-fhir/de-identification)
in the Aidbox docs.
