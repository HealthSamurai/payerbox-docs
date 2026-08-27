---
description: >-
  Columns for immunizations, mapped from the USCDI v3.1 Immunizations data
  class to US Core 6.1.0 FHIR.
---

# Immunizations



## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`immunizations`](#immunizations) | [US Core Immunization](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-immunization.html) |

## immunizations

One row per administered (or refused) dose per patient. A member with three seasonal flu shots is three rows.

{% file src="../../assets/data-integration/immunizations.csv" %}
immunizations.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `immunization_id` | Yes | your key for this dose | `IM-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `completed`, `entered-in-error`, `not-done` [immunization-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/immunization-status%7C4.0.1) | `completed` |
| `status_reason_code` | If `not-done` | SNOMED CT or v3 ActReason code, with `status_reason_system` [immunization-status-reason](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/immunization-status-reason%7C4.0.1) | `PATOBJ` patient objection |
| `vaccine_code` | Yes | CVX code, with `vaccine_system`; CVX if omitted [CVX Vaccines Administered Vaccine Set](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/vaccine-code%7C4.0.1) | `140` influenza, seasonal, injectable, preservative free |
| `occurrence_date` | Yes | datetime | `2025-10-02` |
| `performer_npi` | If available | 10 digits | `9999999991` |
| `primary_source` | Recommended | `true` / `false` | `true` |

- `vaccine_code` is the one coded field with no fallback: a row without it cannot become an Immunization. Send `vaccine_system` as `http://hl7.org/fhir/sid/cvx`. US Core requires the CVX coding, so a row sourced from a billed claim that only carries an NDC should send that NDC with `vaccine_system` as `http://hl7.org/fhir/sid/ndc`; Payerbox crosswalks it to CVX.
- `status` marks each row: `completed` for a dose that was given, `not-done` for one that was not, `entered-in-error` to retract a record that should never have existed.
- `status_reason_code` belongs only on `not-done` rows: why the vaccine was not given — patient objection, medical precaution, out of stock, immunity, or a SNOMED CT refusal code. Send `status_reason_system` as `http://terminology.hl7.org/CodeSystem/v3-ActReason` or `http://snomed.info/sct`.
- `occurrence_date` is the administration date (for `not-done` rows, the date the dose was due or refused). A date without a time is fine.
- `performer_npi` identifies the administering practitioner and must match a row in [`practitioners`](care-team.md#practitioners).
- `primary_source` is `true` when the record comes from the party that administered the vaccine, `false` for secondhand reports — member-reported doses or history imported from another system.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
