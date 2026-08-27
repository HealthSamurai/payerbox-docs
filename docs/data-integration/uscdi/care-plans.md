---
description: >-
  Columns for care_plans, mapped from the USCDI v3.1 Assessment and Plan of
  Treatment data class to US Core 6.1.0 FHIR.
---

# Assessment and Plan of Treatment

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`care_plans`](#care-plans) | [US Core CarePlan](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careplan.html) |

## care_plans

One row per care plan. This dataset carries the **Assessment and Plan of Treatment** narrative; the SDOH Assessment element of the same class comes from `clinical_observations`.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `narrative_text` | Yes | text or HTML; the assessment and plan itself | `Assessment: … Plan: …` |
| `status` | Yes | `draft`, `active`, `on-hold`, `revoked`, `completed`, `entered-in-error`, `unknown` [request-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/request-status%7C4.0.1) | `active` |
| `intent` | Yes | `proposal`, `plan`, `order`, `option` [care-plan-intent](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/care-plan-intent%7C4.0.1) | `plan` |
| `period_start` | If available | datetime | `2026-04-18` |
| `period_end` | If available | datetime | |

- `narrative_text` is the payload of this dataset, not a summary of it. US Core requires the narrative on every CarePlan, so a row without it cannot become one. Send the assessment and the plan as your source holds them; HTML is preserved, plain text is wrapped.
- Payerbox sets the `assess-plan` category and the narrative status on every row. Both are fixed by the profile, so there is nothing for you to send.
- `status` and `intent` are required bindings, so a value outside these lists is rejected. A plan a payer holds is normally `active` with intent `plan`.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
