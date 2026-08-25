---
description: >-
  Columns for practitioners and care_team, mapped from the USCDI v3.1 Care Team
  Member(s) data class to US Core 6.1.0 FHIR.
---

# Care Team Members

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR ([Implementation Guides](../../api-reference/implementation-guides.md)).

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`practitioners`](#practitioners) | [US Core Practitioner](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitioner.html), [US Core PractitionerRole](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitionerrole.html) |
| [`care_team`](#care-team) | [US Core CareTeam](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careteam.html) |

## practitioners

The clinicians clinical rows reference by NPI. If you already send the [Provider Directory](../provider-directory/README.md) feed, list here only the ones missing from it, such as an external ordering physician.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `npi` | Yes | 10 digits | `1407006835` |
| `last_name` | Yes | text | `Roe` |
| `first_name` | Recommended | text | `Richard` |
| `specialty_nucc` | Recommended | NUCC taxonomy code(s) [Healthcare Provider Taxonomy](https://vsac.nlm.nih.gov/valueset/2.16.840.1.114222.4.11.1066/expansion) | `207R00000X` |
| `primary_org_npi` | Recommended | 10 digits | `1234567893` |
| `practitioner_role_code` | Recommended | role code [Care Team Member Function](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1099.30/expansion) | `doctor` |
| `location_id` | Recommended | `locations` key | `LOC-221` |
| `phone` | Recommended | 10 digits | `5551234567` |
| `email` | If available | email address | |
| `role_period_start` | If available | date | `2021-04-01` |
| `role_period_end` | If available | date | |

## care_team

One row per patient and team member.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `member_npi` | Yes | 10 digits; send this or `member_related_person_id` | `1407006835` |
| `member_related_person_id` | Yes | `related_persons` key, for non-clinicians; send this or `member_npi` | |
| `role_code` | Yes | SNOMED or NUCC code [Care Team Member Function](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1099.30/expansion) | `223366009` |
| `status` | Recommended | `active`, `proposed`, `inactive` [care-team-status](https://hl7.org/fhir/R4/valueset-care-team-status.html) | `active` |

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
