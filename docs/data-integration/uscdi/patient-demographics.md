---
description: >-
  Columns for patients and related_persons, mapped from the USCDI v3.1
  Patient Demographics/Information data class to US Core 6.1.0 FHIR.
---

# Patient Demographics/Information

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`patients`](#patients) | [US Core Patient](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-patient.html) |
| [`related_persons`](#related-persons) | [US Core RelatedPerson](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-relatedperson.html) |
| [`social_history`](#social-history) | [US Core Observation Occupation](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-occupation.html), [US Core Smoking Status](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-smokingstatus.html), [US Core Observation Pregnancy Status](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-pregnancystatus.html), [US Core Observation Pregnancy Intent](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-pregnancyintent.html) |

## patients

One row per member. The sections below group its columns.

{% file src="../../assets/data-integration/patients.4d87f019.csv" %}
patients.csv Data template with example rows
{% endfile %}

### Identity

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | your most stable patient key; must not change for a person or be reused for another | `MRN-4471903` |
| `patient_identifier_system` | Yes | URI of the identifier system; a URL you control or an OID | `http://example.org/mrns` |
| `patient_identifier_type` | Recommended | `MR` medical record, `MB` member number, `MC` Medicare, `MA` Medicaid [v2-0203](https://terminology.hl7.org/CodeSystem-v2-0203.html) | `MR` |
| `patient_identifier_use` | Recommended | `usual`, `official`, `temp`, `secondary`, `old` [identifier-use](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/identifier-use%7C4.0.1) | `official` |
| `patient_identifier_assigner_org_npi` | Recommended | 10 digits | `9999999993` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

### Additional identifiers

| Column | Required | Format / values | Example |
|---|---|---|---|
| `identifier_<n>_value` | Yes | the identifier as issued | `HSX9930012` |
| `identifier_<n>_system` | Yes | URI of the identifier system; a URL you control or an OID | `http://example.org/member-ids` |
| `identifier_<n>_type` | Recommended | [v2-0203](https://terminology.hl7.org/CodeSystem-v2-0203.html) code | `MB` |
| `identifier_<n>_use` | Recommended | `usual`, `official`, `temp`, `secondary`, `old` [identifier-use](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/identifier-use%7C4.0.1) | `official` |
| `identifier_<n>_period_start` | Recommended | date | `2024-01-01` |
| `identifier_<n>_period_end` | Recommended | date | `2025-12-31` |
| `identifier_<n>_assigner_org_npi` | Recommended | 10 digits | `9999999993` |

- If you use a slot, fill both `value` and `system`. A value without a system is rejected. A slot left blank is ignored.
- Number slots from 2 upward, contiguously. Never 2 and 4.

### Name

| Column | Required | Format / values | Example |
|---|---|---|---|
| `last_name` | Yes | text | `Doe` |
| `first_name` | Yes | text | `Jane` |
| `middle_name` | Recommended | text | `L` |
| `name_suffix` | Recommended | Jr. / Sr. / III | |
| `previous_name` | Recommended | `family, given` | `Smith, Jane` |

### Demographics

| Column | Required | Format / values | Example |
|---|---|---|---|
| `gender` | Yes | `male`, `female`, `other`, `unknown` [AdministrativeGender](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/administrative-gender%7C4.0.1) | `female` |
| `sex` | Recommended | `248152002` Female, `248153007` Male [US Core Sex](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-sex.html) | `248152002` |
| `birth_date` | Recommended | YYYY-MM-DD | `1957-03-11` |
| `deceased_date` | If applicable | datetime | |
| `race_omb_code` | Recommended | `2106-3` White, `2054-5` Black or African American, `2028-9` Asian, `1002-5` American Indian or Alaska Native, `2076-8` Native Hawaiian or Other Pacific Islander, `UNK` unknown, `ASKU` asked but declined; `;`-separated [OMB race categories](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/omb-race-category) | `2106-3` |
| `race_detailed_code` | If available | CDC race code(s), `;`-separated [detailed race](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/detailed-race) | `2108-9` |
| `ethnicity_omb_code` | Recommended | `2135-2` Hispanic or Latino, `2186-5` Not Hispanic or Latino, `UNK` unknown, `ASKU` asked but declined [OMB ethnicity categories](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/omb-ethnicity-category) | `2186-5` |
| `ethnicity_detailed_code` | If available | CDC ethnicity code(s) [detailed ethnicity](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/detailed-ethnicity) | |
| `tribal_affiliation_code` | Recommended | tribal-entity code [TribalEntityUS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://terminology.hl7.org/ValueSet/v3-TribalEntityUS) | |
| `preferred_language` | Recommended | BCP 47 [simple-language](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/simple-language) | `en` |

### Address and contact

| Column | Required | Format / values | Example |
|---|---|---|---|
| `address_line1` | Recommended | text | `123 Main St` |
| `address_line2` | No | text | `Apt 3` |
| `city` | Recommended | text | `Anytown` |
| `state` | Recommended | 2-letter USPS [USPS states](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state) | `NY` |
| `zip` | Recommended | 5 or 9 digits, as a string | `12345` |
| `phone` | Recommended | 10 digits | `5551234567` |
| `phone_type` | Recommended | `home`, `work`, `mobile`, `temp`, `old` [ContactPointUse](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/contact-point-use%7C4.0.1) | `mobile` |
| `email` | Recommended | email address | |
| `previous_address` | Recommended | `line, city, state, zip` | `45 Oak St, Anytown, NY, 12345` |
| `previous_address_end` | If available | date | `2024-08-31` |

## related_persons

Contacts and non-clinician care-team members, such as a daughter, spouse, or guardian. One row per person per patient.

{% file src="../../assets/data-integration/related_persons.8c1bfb5d.csv" %}
related_persons.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this person; `care_team` references it | `RP-3310` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `relationship_code` | Recommended | `DAU` daughter, `SPS` spouse, `CHILD` child [v3-RoleCode](https://terminology.hl7.org/CodeSystem-v3-RoleCode.html), [v2-0131](https://terminology.hl7.org/CodeSystem-v2-0131.html) | `DAU` |
| `last_name` | Recommended | text | `Doe` |
| `first_name` | Recommended | text | `Mary` |
| `phone` | If available | 10 digits | `5559876543` |
| `address_line1` | If available | text | `45 Oak St` |
| `city` | If available | text | `Anytown` |
| `state` | If available | 2-letter USPS [USPS states](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state) | `NY` |
| `zip` | If available | 5 digits, as a string | `12345` |
| `active` | Yes | `true` / `false`; `false` retires a contact without deleting them | `true` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

## social_history

{% file src="../../assets/data-integration/social_history.1d8b2b61.csv" %}
social_history.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this row | `SH-0001` |
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `observation_type` | Yes | `occupation` for the demographics rows; `smoking-status`, `pregnancy-status`, `pregnancy-intent` are Health Status/Assessments | `occupation` |
| `status` | Yes | `registered`, `preliminary`, `final`, `amended`, `corrected`, `cancelled`, `entered-in-error`, `unknown` [observation-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/observation-status%7C4.0.1) | `final` |
| `value_code` | Yes | the value for this `observation_type`, with `value_system`: O*NET-SOC for `occupation` [Occupation ONETSOC Detail](https://phinvads.cdc.gov/vads/ViewValueSet.action?oid=2.16.840.1.114222.4.11.7901), SNOMED CT for `smoking-status`, `pregnancy-status` and `pregnancy-intent` | `29-1141.00`, `266919005` |
| `industry_code` | occupation only | NAICS industry code [Industry NAICS Detail](https://phinvads.cdc.gov/vads/ViewValueSet.action?oid=2.16.840.1.114222.4.11.7900) | `622110` |
| `effective_datetime` | Yes, except on `occupation` rows | datetime | `2026-04-18` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
