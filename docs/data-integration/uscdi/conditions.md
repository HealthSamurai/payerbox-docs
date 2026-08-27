---
description: >-
  Columns for conditions, mapped from the USCDI v3.1 Problems, Health Concerns,
  and Encounter Diagnosis data classes to US Core 6.1.0 FHIR.
---

# Problems

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`conditions`](#conditions) | [US Core Condition Problems and Health Concerns](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-condition-problems-health-concerns.html); [US Core Condition Encounter Diagnosis](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-condition-encounter-diagnosis.html) |

## conditions

One file covers all four USCDI condition flavours — problems, health concerns, encounter diagnoses, and SDOH — one row per condition per patient; the `category` column tells them apart.

{% file src="../../assets/data-integration/conditions.88f95a55.csv" %}
conditions.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your key for this condition; `encounters` reference it | `CND-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `category` | Yes | one of seven values — see [Categories](#categories) | `problem-list-item` |
| `code` | Yes | SNOMED CT or ICD-10-CM code, with `code_system` [us-core-condition-code](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-condition-code) | `44054006` Type 2 diabetes mellitus |
| `clinical_status` | Recommended | `active`, `recurrence`, `relapse`, `inactive`, `remission`, `resolved` [condition-clinical](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/condition-clinical%7C4.0.1) | `active` |
| `verification_status` | Recommended | `unconfirmed`, `provisional`, `differential`, `confirmed`, `refuted`, `entered-in-error` [condition-ver-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/condition-ver-status%7C4.0.1) | `confirmed` |
| `onset_date` | Recommended | datetime | `2021-08-14` |
| `abatement_date` | If resolved | datetime | `2023-11-30` |
| `recorded_date` | Recommended | datetime | `2021-08-15` |
| `asserted_date` | If available | datetime | `2021-08-15` |
| `encounter_id` | If `encounter-diagnosis` | encounter key | `ENC-9912` |

- `code` is the one coded field with no fallback: a row without it cannot become a Condition. The value set spans SNOMED CT, ICD-10-CM, and ICD-9-CM, so send problems and health concerns as SNOMED CT (`code_system` = `http://snomed.info/sct`) and claims-sourced encounter diagnoses as ICD-10-CM (`code_system` = `http://hl7.org/fhir/sid/icd-10-cm`) — no crosswalk needed. ICD-9-CM (`http://hl7.org/fhir/sid/icd-9-cm`) exists in the value set for historical records only.
- `clinical_status` and `verification_status` are coupled: FHIR requires `clinical_status` on every `problem-list-item` row whose `verification_status` is not `entered-in-error`, and forbids it on any row that is `entered-in-error`. Sending `active` on live rows and `resolved` or `inactive` on closed ones satisfies this.
- A row with an `abatement_date` must carry a `clinical_status` of `inactive`, `resolved`, or `remission` — FHIR rejects an abated condition still marked `active`.
- The three onset-side dates differ: `onset_date` is when the condition clinically began (USCDI Date of Diagnosis), `asserted_date` is when a practitioner first asserted it, and `recorded_date` is when the record entered the system. `abatement_date` is the Date of Resolution. Send whichever your source distinguishes — a source with one condition date puts it in `onset_date`.
- `encounter_id` belongs on `encounter-diagnosis` rows and must match a row in the `encounters` dataset.

### Categories

`category` says what kind of condition the row is, and that decides which US Core profile it becomes. `encounter-diagnosis` rows become Encounter Diagnosis resources; every other value becomes a Problems and Health Concerns resource. The four screening values also add their code to the resource as a second category, so the origin of the finding stays visible.

| `category` | Row is | FHIR it becomes | Binding |
|---|---|---|---|
| `problem-list-item` | an item managed over time on the problem list | Problems and Health Concerns | [us-core-problem-or-health-concern](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-problem-or-health-concern) |
| `health-concern` | a concern not on the formal problem list | Problems and Health Concerns | [us-core-problem-or-health-concern](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-problem-or-health-concern) |
| `encounter-diagnosis` | a diagnosis made during a visit | Encounter Diagnosis, tied to the encounter via `encounter_id` | [condition-category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/condition-category%7C4.0.1), fixed by the profile |
| `sdoh` | social-determinants screening finding | health concern + `sdoh` screening category | [us-core-screening-assessment-condition-category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-screening-assessment-condition-category) |
| `functional-status` | functional-status screening finding | health concern + `functional-status` screening category | [us-core-screening-assessment-condition-category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-screening-assessment-condition-category) |
| `disability-status` | disability screening finding | health concern + `disability-status` screening category | [us-core-screening-assessment-condition-category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-screening-assessment-condition-category) |
| `cognitive-status` | cognitive screening finding | health concern + `cognitive-status` screening category | [us-core-screening-assessment-condition-category](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-screening-assessment-condition-category) |

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
