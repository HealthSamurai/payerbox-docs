---
description: >-
  Columns for clinical_observations, mapped from the USCDI v3.1 Clinical Tests
  data class to US Core 6.1.0 FHIR.
---

# Clinical Tests

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`clinical_observations`](#clinical-observations) | [US Core Observation Clinical Result](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-clinical-result.html), [US Core Observation Screening Assessment](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-screening-assessment.html), [US Core Simple Observation](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-simple-observation.html) |

## clinical_observations

One row per observation. This dataset carries every USCDI observation that is not a lab result, a vital sign or a social history row: non-lab test results, imaging findings, functional, disability and cognitive status, and SDOH screening answers.

{% file src="../../assets/data-integration/clinical_observations.csv" %}
clinical_observations.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `category` | Yes | one of the [categories](#categories) below | `sdoh` |
| `status` | Yes | `registered`, `preliminary`, `final`, `amended`, `corrected`, `cancelled`, `entered-in-error`, `unknown` [observation-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/observation-status%7C4.0.1) | `final` |
| `loinc_code` | Yes | LOINC, with `loinc_system` | `76504-0` |
| `value_quantity` | If numeric | decimal | `3` |
| `unit` | With `value_quantity` | UCUM | `{score}` |
| `value_string` | If free text | text | |
| `value_code` | If coded | SNOMED CT or LOINC code, with `value_system` | |
| `data_absent_reason` | If there is no result | `unknown`, `asked-declined`, `not-performed` [data-absent-reason](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/data-absent-reason%7C4.0.1) | |
| `effective_datetime` | Recommended | datetime | `2026-04-18` |
| `performer_npi` | If available | 10 digits | `1999999992` |
| `panel_id` | If available | `record_id` of the parent `clinical_observations` row | `CO-1200` |

- Send exactly one of `value_quantity`, `value_string`, `value_code` or `data_absent_reason`. A row with a result and an absent reason contradicts itself; a row with neither cannot become an Observation.
- `data_absent_reason` is how a screening question that was asked but not answered stays in the record. Leaving the row out instead loses the fact that it was asked.
- `panel_id` builds a panel: the member rows point at the parent row's key, and Payerbox links them as panel members. Only the screening-assessment categories support it, which is the case that needs it: a questionnaire whose answers belong to one instrument.

### Categories

`category` selects the profile, and each profile binds it differently.

| Category | Becomes | Use it for |
|---|---|---|
| `exam` | Clinical Result | a physical exam finding |
| `imaging` | Clinical Result | an imaging result observation, not the report |
| `procedure` | Clinical Result | a result produced by a procedure |
| `therapy` | Clinical Result | a therapy-related result |
| `activity` | Clinical Result | an activity measure |
| `sdoh` | Screening Assessment | a social-determinants screening answer |
| `functional-status` | Screening Assessment | a functional status assessment |
| `disability-status` | Screening Assessment | a disability status assessment |
| `cognitive-status` | Screening Assessment | a cognitive status assessment |
| `survey` | Simple Observation | a survey answer that is none of the above |

Payerbox adds the `survey` category to every screening assessment, so send only the specific one.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
