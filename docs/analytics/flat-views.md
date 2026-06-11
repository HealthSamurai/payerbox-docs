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

The view as JSON - fields a prior-auth analyst usually needs,
flattened from `ExplanationOfBenefit`. Each row is one
`ExplanationOfBenefit.item`; EOB-level fields repeat for every item
row from the same EOB.

<details>

<summary>Show full ViewDefinition</summary>

```json
{
  "resourceType": "ViewDefinition",
  "name": "pdex_prior_authorization_item",
  "title": "PDex Prior Authorization — items (flat)",
  "status": "active",
  "resource": "ExplanationOfBenefit",
  "where": [
    {"path": "meta.profile.where($this = 'http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/pdex-priorauthorization').exists()"},
    {"path": "use = 'preauthorization'"}
  ],
  "select": [
    {
      "column": [
        {"path": "id",                                                                            "name": "eob_id",                      "type": "string"},
        {"path": "identifier.first().value",                                                      "name": "business_identifier",         "type": "string"},
        {"path": "identifier.first().system",                                                     "name": "business_identifier_system",  "type": "uri"},
        {"path": "status",                                                                        "name": "status",                      "type": "code"},
        {"path": "outcome",                                                                       "name": "outcome",                     "type": "code"},
        {"path": "disposition",                                                                   "name": "disposition",                 "type": "string"},
        {"path": "created",                                                                       "name": "created",                     "type": "dateTime"},
        {"path": "processNote.text",                                                              "name": "process_notes",               "type": "string", "collection": true},
        {"path": "diagnosis.where(sequence = 1).diagnosisCodeableConcept.coding.first().code",    "name": "primary_diagnosis_code",      "type": "code"},
        {"path": "diagnosis.where(sequence = 1).diagnosisCodeableConcept.coding.first().system",  "name": "primary_diagnosis_system",    "type": "uri"},
        {"path": "diagnosis.where(sequence = 1).diagnosisCodeableConcept.coding.first().display", "name": "primary_diagnosis_display",   "type": "string"},
        {"path": "diagnosis.diagnosisCodeableConcept.coding.code",                                "name": "diagnosis_codes",             "type": "code",   "collection": true},
        {"path": "diagnosis.diagnosisCodeableConcept.coding.display",                             "name": "diagnosis_displays",          "type": "string", "collection": true},
        {"path": "type.coding.first().code",                                                      "name": "type_code",                   "type": "code"},
        {"path": "subType.coding.first().code",                                                   "name": "subtype_code",                "type": "code"},
        {"path": "billablePeriod.start",                                                          "name": "billable_start",              "type": "dateTime"},
        {"path": "billablePeriod.end",                                                            "name": "billable_end",                "type": "dateTime"},
        {"path": "preAuthRefPeriod.start.first()",                                                "name": "preauth_start",               "type": "dateTime"},
        {"path": "preAuthRefPeriod.end.first()",                                                  "name": "preauth_end",                 "type": "dateTime"},
        {"path": "patient.reference",                                                             "name": "patient_ref",                 "type": "string"},
        {"path": "patient.identifier.value",                                                      "name": "patient_identifier",          "type": "string"},
        {"path": "patient.display",                                                               "name": "patient_display",             "type": "string"},
        {"path": "insurer.reference",                                                             "name": "insurer_ref",                 "type": "string"},
        {"path": "insurer.identifier.value",                                                      "name": "insurer_identifier",          "type": "string"},
        {"path": "insurer.display",                                                               "name": "insurer_display",             "type": "string"},
        {"path": "provider.identifier.value",                                                     "name": "provider",                    "type": "string"},
        {"path": "enterer.reference",                                                             "name": "enterer_ref",                 "type": "string"},
        {"path": "enterer.identifier.value",                                                      "name": "enterer_identifier",          "type": "string"},
        {"path": "facility.reference",                                                            "name": "facility_ref",                "type": "string"},
        {"path": "facility.identifier.value",                                                     "name": "facility_identifier",         "type": "string"},
        {"path": "insurance.where(focal=true).coverage.reference.first()",                        "name": "coverage_ref",                "type": "string"},
        {"path": "insurance.where(focal=true).coverage.identifier.value.first()",                 "name": "coverage_identifier",         "type": "string"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-levelOfServiceCode').valueCodeableConcept.coding.first().code", "name": "level_of_service_code", "type": "code"},
        {"path": "careTeam.first().provider.reference",                                           "name": "care_team_provider_ref",        "type": "string"},
        {"path": "careTeam.first().provider.identifier.value",                                    "name": "care_team_provider_identifier", "type": "string"},
        {"path": "careTeam.first().role.coding.first().code",                                     "name": "care_team_role_code",           "type": "code"},
        {"path": "total.first().category.coding.first().code",                                    "name": "total_category_code",           "type": "code"},
        {"path": "total.first().amount.value",                                                    "name": "total_amount_value",            "type": "decimal"},
        {"path": "total.first().amount.currency",                                                 "name": "total_amount_currency",         "type": "code"},
        {"path": "total.first().extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/PriorAuthorizationUtilization').valueQuantity.value", "name": "priorauth_utilization_value", "type": "decimal"},
        {"path": "total.first().extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/PriorAuthorizationUtilization').valueQuantity.unit",  "name": "priorauth_utilization_unit",  "type": "string"}
      ]
    },
    {
      "forEachOrNull": "item",
      "column": [
        {"path": "sequence",                                                                                                                        "name": "item_sequence",                "type": "integer"},
        {"path": "category.coding.first().code",                                                                                                    "name": "item_category_code",           "type": "code"},
        {"path": "productOrService.coding.first().code",                                                                                            "name": "item_product_or_service_code", "type": "code"},
        {"path": "servicedDate",                                                                                                                    "name": "item_serviced_date",           "type": "date"},
        {"path": "servicedPeriod.start",                                                                                                            "name": "item_serviced_start",          "type": "dateTime"},
        {"path": "servicedPeriod.end",                                                                                                              "name": "item_serviced_end",            "type": "dateTime"},
        {"path": "quantity.value",                                                                                                                  "name": "item_quantity",                "type": "decimal"},
        {"path": "quantity.unit",                                                                                                                   "name": "item_quantity_unit",           "type": "string"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-itemPreAuthIssueDate').valueDate",                   "name": "item_preauth_issue_date",      "type": "date"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-itemPreAuthPeriod').valuePeriod.start",              "name": "item_preauth_period_start",    "type": "dateTime"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-itemPreAuthPeriod').valuePeriod.end",                "name": "item_preauth_period_end",      "type": "dateTime"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-authorizationNumber').valueString",                  "name": "item_previous_auth_number",    "type": "string"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-itemTraceNumber').valueIdentifier.value",            "name": "item_trace_numbers",           "type": "string", "collection": true},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-administrationReferenceNumber').valueString",        "name": "item_admin_ref_number",        "type": "string"},
        {"path": "extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-itemAuthorizedProvider').valueReference.reference",  "name": "item_authorized_provider_refs","type": "string", "collection": true},
        {"path": "adjudication.extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewAction').extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewActionCode').valueCodeableConcept.coding.first().code",      "name": "item_review_action_code",    "type": "code"},
        {"path": "adjudication.extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewAction').extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewActionCode').valueCodeableConcept.coding.first().display",   "name": "item_review_action_display", "type": "string"},
        {"path": "adjudication.extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewAction').extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewReasonCode').valueCodeableConcept.coding.first().code",      "name": "item_review_reason_code",    "type": "code"},
        {"path": "adjudication.extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewAction').extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/extension-reviewNumber').valueString.first()",                               "name": "item_review_number",         "type": "string"},
        {"path": "adjudication.where(category.coding.where(code='allowedunits').exists()).value.first()",                                                                                                                "name": "item_allowed_units",            "type": "decimal"},
        {"path": "adjudication.where(category.coding.where(code='allowedunits').exists()).extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/base-ext-when-adjudicated').valueDateTime.first()",          "name": "item_allowed_units_action_date","type": "dateTime"},
        {"path": "adjudication.where(category.coding.where(code='consumedunits').exists()).value.first()",                                                                                                               "name": "item_consumed_units",           "type": "decimal"},
        {"path": "adjudication.where(category.coding.where(code='denialreason').exists()).reason.coding.code",                                                                                                           "name": "item_denial_reason_codes",      "type": "code",     "collection": true},
        {"path": "adjudication.where(category.coding.where(code='denialreason').exists()).reason.coding.display",                                                                                                        "name": "item_denial_reason_displays",   "type": "string",   "collection": true},
        {"path": "adjudication.where(category.coding.where(code='denialreason').exists()).extension('http://hl7.org/fhir/us/davinci-pdex/StructureDefinition/base-ext-when-adjudicated').valueDateTime.first()",         "name": "item_denial_action_date",       "type": "dateTime"},
        {"path": "adjudication.where(category.coding.where(code='submitted').exists()).amount.value.first()",                                                                                                            "name": "item_submitted_amount",         "type": "decimal"},
        {"path": "adjudication.where(category.coding.where(code='eligible').exists()).amount.value.first()",                                                                                                             "name": "item_eligible_amount",          "type": "decimal"},
        {"path": "adjudication.where(category.coding.where(code='benefit').exists()).amount.value.first()",                                                                                                              "name": "item_benefit_amount",           "type": "decimal"}
      ]
    }
  ]
}
```

</details>

`ViewDefinition` is a regular FHIR resource - the Builder is just one UI on top of it, and its **Edit** tab exposes the raw JSON for in-place editing. The same view can also be authored, versioned, and patched via `POST /fhir/ViewDefinition` or `PUT /fhir/ViewDefinition/<id>`. Every column, `where` clause, or `forEach` change is a normal FHIR write.

The `where` clause restricts to EOBs tagged with the
[PDex Prior Authorization](http://hl7.org/fhir/us/davinci-pdex/StructureDefinition-pdex-priorauthorization.html)
profile and with `use = 'preauthorization'`.

`forEachOrNull: "item"` unnests the item array into one row per
item, keeping EOBs that have no items (they produce a single row
with NULL item fields). `collection: true` makes a column a Postgres
array - used here for the multi-valued fields like
`item_denial_reason_codes`, `diagnosis_codes`, `process_notes`. See
[query 7 in Common queries](common-queries.md#7-eobs-by-denial-reason-code)
for the typical `LATERAL unnest` pattern.

The PDex extensions (`reviewAction`, `itemPreAuthPeriod`,
`PriorAuthorizationUtilization`, etc.) are pulled out as their own
columns so analysts don't have to navigate FHIR extensions in SQL.

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
