---
description: >-
  Columns for patients and related_persons, mapped from the USCDI v3.1
  Patient Demographics/Information data class to US Core 6.1.0 FHIR.
---

# Patient Demographics/Information

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`patients`](#patients) | [US Core Patient](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-patient.html) |
| [`related_persons`](#related-persons) | [US Core RelatedPerson](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-relatedperson.html) |
| [`social_history`](#social-history) | [US Core Observation Occupation](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-observation-occupation.html) |

## patients

One row per member. The sections below group its columns.

### Identity

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | your most stable patient key; must not change for a person or be reused for another | `MRN-4471903` |
| `patient_identifier_system` | Yes | URI of the identifier system; a URL you control or an OID | `http://acme.org/mrns` |
| `patient_identifier_type` | Recommended | `MR` medical record, `MB` member number, `MC` Medicare, `MA` Medicaid [v2-0203](https://terminology.hl7.org/CodeSystem-v2-0203.html) | `MR` |
| `patient_identifier_use` | Recommended | `usual`, `official`, `temp`, `secondary` [identifier-use](https://hl7.org/fhir/R4/valueset-identifier-use.html) | `official` |
| `patient_identifier_assigner_org_npi` | Recommended | 10 digits | `1234567893` |

### Additional identifiers

| Column | Required | Format / values | Example |
|---|---|---|---|
| `identifier_<n>_value` | Yes | the identifier as issued | `HSX9930012` |
| `identifier_<n>_system` | Yes | URI of the identifier system; a URL you control or an OID | `http://acme.org/member-ids` |
| `identifier_<n>_type` | Recommended | [v2-0203](https://terminology.hl7.org/CodeSystem-v2-0203.html) code | `MB` |
| `identifier_<n>_use` | Recommended | `usual`, `official`, `temp`, `secondary`, `old` [identifier-use](https://hl7.org/fhir/R4/valueset-identifier-use.html) | `official` |
| `identifier_<n>_period_start` | Recommended | date | `2024-01-01` |
| `identifier_<n>_period_end` | Recommended | date | `2025-12-31` |
| `identifier_<n>_assigner_org_npi` | Recommended | 10 digits | `1234567893` |

- If you use a slot, fill both `value` and `system`. A value without a system is rejected. A slot left blank is ignored.
- Number slots from 2 upward, contiguously. Never 2 and 4.

### Name

| Column | Required | Format / values | Example |
|---|---|---|---|
| `last_name` | Yes | text | `Doe` |
| `first_name` | Yes | text | `Jane` |
| `middle_name` | Recommended | text | `L` |
| `name_prefix` | No | Mr. / Mrs. / Ms. / Dr. | `Ms.` |
| `name_suffix` | Recommended | Jr. / Sr. / III | |
| `previous_name` | Recommended | `family, given` | `Smith, Jane` |

### Demographics

| Column | Required | Format / values | Example |
|---|---|---|---|
| `gender` | Yes | `male`, `female`, `other`, `unknown` [AdministrativeGender](https://hl7.org/fhir/R4/valueset-administrative-gender.html) | `female` |
| `sex` | Recommended | `248152002` Female, `248153007` Male [US Core Sex](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-sex.html) | `248152002` |
| `birth_date` | Recommended | YYYY-MM-DD | `1957-03-11` |
| `deceased_date` | If applicable | datetime | |
| `race_omb_code` | Recommended | `2106-3` White, `2054-5` Black or African American, `2028-9` Asian, `1002-5` American Indian or Alaska Native, `2076-8` Native Hawaiian or Other Pacific Islander; `;`-separated [OMB race categories](https://hl7.org/fhir/us/core/STU6.1/ValueSet-omb-race-category.html) | `2106-3` |
| `race_detailed_code` | If available | CDC race code(s), `;`-separated [detailed race](https://hl7.org/fhir/us/core/STU6.1/ValueSet-detailed-race.html) | `2108-9` |
| `ethnicity_omb_code` | Recommended | `2135-2` Hispanic or Latino, `2186-5` Not Hispanic or Latino [OMB ethnicity categories](https://hl7.org/fhir/us/core/STU6.1/ValueSet-omb-ethnicity-category.html) | `2186-5` |
| `ethnicity_detailed_code` | If available | CDC ethnicity code(s) [detailed ethnicity](https://hl7.org/fhir/us/core/STU6.1/ValueSet-detailed-ethnicity.html) | |
| `tribal_affiliation_code` | Recommended | tribal-entity code [TribalEntityUS](https://terminology.hl7.org/ValueSet-v3-TribalEntityUS.html) | |
| `preferred_language` | Recommended | BCP 47 [simple-language](https://hl7.org/fhir/us/core/STU6.1/ValueSet-simple-language.html) | `en` |

### Address and contact

| Column | Required | Format / values | Example |
|---|---|---|---|
| `address_line1` | Recommended | text | `88 River Rd` |
| `address_line2` | No | text | `Apt 3` |
| `city` | Recommended | text | `Yonkers` |
| `state` | Recommended | 2-letter USPS [USPS states](https://hl7.org/fhir/us/core/STU6.1/ValueSet-us-core-usps-state.html) | `NY` |
| `zip` | Recommended | 5 or 9 digits, as a string | `10701` |
| `county` | If available | text | `Westchester` |
| `phone` | Recommended | 10 digits | `5551234567` |
| `phone_type` | Recommended | `home`, `work`, `mobile` [ContactPointUse](https://hl7.org/fhir/R4/valueset-contact-point-use.html) | `mobile` |
| `email` | Recommended | email address | |
| `previous_address` | Recommended | `line, city, state, zip` | `12 Elm St, Bronx, NY, 10453` |
| `previous_address_end` | If available | date | `2024-08-31` |

## related_persons

Contacts and non-clinician care-team members, such as a daughter, spouse, or guardian. One row per person per patient.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `relationship_code` | Recommended | `DAU` daughter, `SPS` spouse, `NCH` child [v3-RoleCode](https://terminology.hl7.org/CodeSystem-v3-RoleCode.html), [v2-0131](https://terminology.hl7.org/CodeSystem-v2-0131.html) | `DAU` |
| `last_name` | Recommended | text | `Doe` |
| `first_name` | Recommended | text | `Mary` |
| `phone` | If available | 10 digits | `5559876543` |
| `preferred_language` | If available | BCP 47 [simple-language](https://hl7.org/fhir/us/core/STU6.1/ValueSet-simple-language.html) | `en` |

## social_history

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `observation_type` | Yes | `occupation` for the demographics rows; `smoking-status`, `pregnancy-status`, `pregnancy-intent` are Health Status/Assessments | `occupation` |
| `status` | Yes | `final`, `amended`, `corrected`, `entered-in-error` [observation-status](https://hl7.org/fhir/R4/valueset-observation-status.html) | `final` |
| `value_code` | Yes | O*NET-SOC occupation code, with `value_system` [Occupation ONETSOC Detail](https://phinvads.cdc.gov/vads/ViewValueSet.action?oid=2.16.840.1.114222.4.11.7901) | `29-1141.00` |
| `industry_code` | occupation only | NAICS industry code [Industry NAICS Detail](https://phinvads.cdc.gov/vads/ViewValueSet.action?oid=2.16.840.1.114222.4.11.7900) | `622110` |
| `effective_datetime` | Recommended | datetime | `2026-04-18` |

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
