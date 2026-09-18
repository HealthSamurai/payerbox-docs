---
description: >-
  Columns for goals, mapped from the USCDI v3.1 Goals data class to US Core
  6.1.0 FHIR.
---

# Goals

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`goals`](#goals) | [US Core Goal](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-goal.html) |

## goals

One row per goal per patient.

{% file src="../../assets/data-integration/goals.f393bfdf.csv" %}
goals.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this goal | `GL-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `lifecycle_status` | Yes | `proposed`, `planned`, `accepted`, `active`, `on-hold`, `completed`, `cancelled`, `entered-in-error`, `rejected` [goal-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/goal-status%7C4.0.1) | `active` |
| `description_code` | Yes | SNOMED CT or LOINC code, with `description_system`; or plain text [us-core-goal-description](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-goal-description) | `289169006` exercising to lose weight |
| `start_date` | If available | date | `2026-04-18` |
| `target_date` | If available | date | `2026-10-18` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `description_code` is the one field with no fallback: a row without it cannot become a Goal. Send a SNOMED CT code (`description_system` = `http://snomed.info/sct`) or a LOINC code (`description_system` = `http://loinc.org`); the binding's own value set spans essentially all of SNOMED CT, and LOINC comes in through its extensibility. A source that records goals only as narrative may put the text itself in `description_code` and leave `description_system` empty.
- `lifecycle_status` marks each row: `active` for a goal being pursued, `completed`/`cancelled`/`rejected` for closed ones, `entered-in-error` to retract a record that should never have existed.
- `target_date` is the USCDI "Goal Target Date". US Core requires supporting at least one of `Goal.startDate` and `Goal.target.dueDate`, so send whichever your source tracks — either or both are fine.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
