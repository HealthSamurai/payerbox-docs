---
description: >-
  Columns for encounters and locations, mapped from the USCDI v3.1 Encounter
  Information data class to US Core 6.1.0 FHIR.
---

# Encounter Information

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`encounters`](#encounters) | [US Core Encounter](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-encounter.html) |
| [`locations`](#locations) | [US Core Location](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-location.html) |

## encounters

One row per encounter. Several diagnoses or participants stay one row: list the keys `;`-separated.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `encounter_id` | Yes | stable encounter key; the key other datasets reference | `ENC-9912` |
| `encounter_id_system` | Yes | URI of the identifier system; a URL you control or an OID | `urn:oid:2.16.840.1.113883.3.99.2` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `planned`, `arrived`, `triaged`, `in-progress`, `onleave`, `finished`, `cancelled`, `entered-in-error`, `unknown` [encounter-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/encounter-status%7C4.0.1) | `finished` |
| `class` | Yes | `AMB` ambulatory, `IMP` inpatient, `EMER` emergency, `OBSENC` observation [v3-ActEncounterCode](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://terminology.hl7.org/ValueSet/v3-ActEncounterCode) | `AMB` |
| `type_code` | Yes | CPT or SNOMED CT code(s), `;`-separated [US Core Encounter Type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-encounter-type) | `99213` |
| `period_start` | Recommended | datetime | `2026-04-18T09:00:00-04:00` |
| `period_end` | Recommended | datetime | `2026-04-18T09:30:00-04:00` |
| `reason_code` | If available | SNOMED CT or ICD-10-CM code(s), `;`-separated [encounter-reason](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/encounter-reason%7C4.0.1) | `29857009` chest pain |
| `location_id` | Recommended | `locations` key | `LOC-221` |
| `diagnosis_condition_id` | If available | `conditions` key(s), `;`-separated | `CND-4501` |
| `participant_npi` | If available | 10 digits, `;`-separated | `1407006835` |
| `discharge_disposition_code` | If applicable | NUBC patient discharge status code, as carried in UB-04 field 17 [AHA NUBC Patient Discharge Status](https://terminology.hl7.org/5.5.0/CodeSystem-AHANUBCPatientDischargeStatus.html) | `01` discharged to home or self-care |
| `service_provider_npi` | If available | 10 digits | `1234567893` |

- A bare code uses the column's default system: CPT for `type_code`, SNOMED CT for `reason_code`, NUBC for `discharge_disposition_code`. For any other system, prefix it with a pipe. Several codes are `;`-separated, each carrying its own system:

  ```csv
  reason_code
  29857009
  29857009;25064002
  http://snomed.info/sct|29857009;http://hl7.org/fhir/sid/icd-10-cm|R07.9
  ```

- `reason_code` is the presenting complaint, not the diagnosis (`diagnosis_condition_id`). Its binding is preferred, so an ICD-10-CM code off the claim is accepted.
- NUBC is a billing code set, not clinical terminology: send the discharge status off the claim. AHA licenses the codes, so the linked page cannot list them.

## locations

One row per physical location: a clinic, a hospital ward, a lab draw station.

If you already send the [Provider Directory](../provider-directory/README.md) feed, list here only the locations missing from it, such as a facility outside your network where a member was treated.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `location_id` | Yes | stable id; the key `encounters` references | `LOC-221` |
| `location_name` | Yes | text | `Riverdale Family Practice` |
| `managing_org_npi` | Recommended | 10 digits | `1234567893` |
| `address_line1` | Recommended | text | `88 River Rd` |
| `city` | Recommended | text | `Yonkers` |
| `state` | Recommended | 2-letter USPS [USPS states](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state) | `NY` |
| `zip` | Recommended | 5 or 9 digits, as a string | `10701` |

- `location_name` is the one mandatory field: a row without it cannot become a Location.
- `managing_org_npi` must match a row in your organizations dataset.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
