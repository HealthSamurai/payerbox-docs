---
description: >-
  Columns for vital_signs, mapped from the USCDI v3.1 Vital Signs data class
  to US Core 6.1.0 FHIR.
---

# Vital Signs

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`vital_signs`](#vital-signs) | [US Core Vital Signs](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-vital-signs.html), [US Core Blood Pressure](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-blood-pressure.html) |

## vital_signs

One row per measurement, except blood pressure: systolic and diastolic are two components of a single reading, so they share a row.

{% file src="../../assets/data-integration/vital_signs.csv" %}
vital_signs.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `vital_sign_id` | Yes | your key for this reading | `VS-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `registered`, `preliminary`, `final`, `amended`, `corrected`, `cancelled`, `entered-in-error`, `unknown` [observation-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/observation-status%7C4.0.1) | `final` |
| `loinc_code` | Yes | one of the [vital sign codes](#vital-sign-codes) below [US Core Vital Signs](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-vital-signs) | `8867-4` |
| `effective_datetime` | Yes | datetime | `2026-04-18T09:05:00-04:00` |
| `value` | Unless blood pressure | decimal | `72` |
| `unit` | With `value` | UCUM | `/min` |
| `component_systolic` | Blood pressure only | decimal | `128` |
| `component_diastolic` | Blood pressure only | decimal | `82` |
| `encounter_id` | If applicable | `encounters` key | `ENC-9912` |
| `performer_npi` | If available | 10 digits | `9999999991` |

- `effective_datetime` is mandatory on this profile: a vital sign without a time is not a conformant reading. Smoking status and pregnancy status require one too.
- A quantitative vital needs both `value` and `unit`, and the unit must be UCUM. `/min` for heart and respiratory rate, `cm` for height, `kg` for weight, `Cel` for temperature, `%` for oxygen saturation, `kg/m2` for BMI.
- Blood pressure is the exception: leave `value` and `unit` empty and send `component_systolic` and `component_diastolic` on the same row with `loinc_code` `85354-9`. Both components are required, so a row with only one is rejected.
- Payerbox sets the `vital-signs` category on every row.

### Vital sign codes

| LOINC | Measurement | Unit |
|---|---|---|
| `85354-9` | Blood pressure panel | components, no unit |
| `8480-6` | Systolic blood pressure | `mm[Hg]` |
| `8462-4` | Diastolic blood pressure | `mm[Hg]` |
| `8867-4` | Heart rate | `/min` |
| `9279-1` | Respiratory rate | `/min` |
| `8310-5` | Body temperature | `Cel` |
| `8302-2` | Body height | `cm` |
| `29463-7` | Body weight | `kg` |
| `39156-5` | Body mass index | `kg/m2` |
| `59408-5` | Oxygen saturation by pulse oximetry | `%` |
| `9843-4` | Head circumference | `cm` |
| `8289-1` | Head circumference percentile | `%` |
| `59576-9` | Body mass index percentile | `%` |
| `77606-2` | Weight for length percentile | `%` |

The last four are the paediatric percentiles. The binding also accepts `2708-6`, `3150-0` and `3151-8` for oxygen measures, `8478-0` for mean blood pressure, and `85353-1` for the full vital signs panel.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
