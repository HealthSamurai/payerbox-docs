---
description: >-
  Columns for labs, mapped from the USCDI v3.1 Laboratory data class to US Core
  6.1.0 FHIR.
---

# Laboratory

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`labs`](#labs) | [US Core Laboratory Result Observation](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-lab.html), [US Core Specimen](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-specimen.html) |

## labs

One row per analyte result. A panel flattens: each member analyte is its own row, grouped back together by a shared `diagnostic_report_id`. The FHIR category is fixed to `laboratory` — non-lab test results belong in `clinical_observations`.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this result | `LAB-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `registered`, `preliminary`, `final`, `amended`, `corrected`, `cancelled`, `entered-in-error`, `unknown` [observation-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/observation-status%7C4.0.1) | `final` |
| `loinc_code` | Yes | LOINC [us-core-laboratory-test-codes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-laboratory-test-codes) | `2339-0` glucose [mass/volume] in blood |
| `value_quantity` | If numeric | decimal | `104` |
| `unit` | If `value_quantity` | UCUM [ucum-common](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/ucum-common%7C4.0.1) | `mg/dL` |
| `value_comparator` | If censored | `<`, `<=`, `>=`, `>` [quantity-comparator](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/quantity-comparator%7C4.0.1) | |
| `value_string` | If non-numeric | text | `POSITIVE` |
| `value_code` | If coded | SNOMED CT code, with `value_system` (SNOMED CT assumed when empty) | |
| `data_absent_reason` | If no value | `unknown`, `not-performed`, `error`, etc. [data-absent-reason](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/data-absent-reason%7C4.0.1) | |
| `interpretation` | If available | `H` high, `L` low, `N` normal, `A` abnormal [observation-interpretation](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/observation-interpretation%7C4.0.1) | `H` |
| `reference_range_low` | If available | decimal | `70` |
| `reference_range_high` | If available | decimal | `99` |
| `effective_datetime` | Recommended | datetime, at least to the day | `2026-04-18T08:40:00-04:00` |
| `specimen_type_code` | If available | SNOMED CT specimen code [Specimen Type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.54&server=https://tx.fhir.org/r4) | `119297000` blood specimen |
| `diagnostic_report_id` | If available | `record_id` of the `diagnostic_reports` row | `DR-771` |
| `performer_npi` | If available | 10 digits | `9999999991` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `loinc_code` is the USCDI Tests element and the one coded field with no fallback: a row without it cannot become an Observation. The binding accepts any laboratory LOINC code (`http://loinc.org` assumed).
- **Every row needs a result or a reason it is missing.** Send exactly one of `value_quantity` (+ `unit`), `value_string`, or `value_code`; when the source has none — the test was cancelled, the specimen was unsatisfactory — `data_absent_reason` becomes required. A row with neither is rejected.
- `unit` is not free text: US Core requires UCUM for quantity results. `value_code` should be SNOMED CT, e.g. `260385009` Negative for a coded qualitative result.
- A censored numeric result — below or above the assay's detection limit — stays structured: `<0.5` is `value_quantity` `0.5` with `value_comparator` `<`, not a `value_string`.
- `interpretation` and the `reference_range_*` pair go beyond the USCDI v3.1 floor (they joined USCDI in v4), but pass them through whenever your source has them — they are what makes a bare number readable.
- `specimen_type_code` is the USCDI Specimen Type element; it becomes a companion US Core Specimen resource the Observation points at, not a separate dataset you deliver.
- `diagnostic_report_id` groups the analytes of one panel under a report in the `diagnostic_reports` dataset. A lab row is complete without it.
- `performer_npi` is the resulting lab or clinician and must match a row in [`practitioners`](care-team.md#practitioners) or [`organizations`](care-team.md#organizations).

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
