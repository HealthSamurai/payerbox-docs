---
description: >-
  Columns for practitioners and care_team, mapped from the USCDI v3.1 Care Team
  Member(s) data class to US Core 6.1.0 FHIR.
---

# Care Team Members

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`practitioners`](#practitioners) | [US Core Practitioner](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitioner.html), [US Core PractitionerRole](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitionerrole.html) |
| [`care_team`](#care-team) | [US Core CareTeam](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careteam.html) |

## practitioners

One row per practitioner, organization, and location: each row becomes one PractitionerRole, so a clinician practising at two locations produces two rows. Multiple specialties at the same location share a row.

If you already send the [Provider Directory](../provider-directory/README.md) feed, list here only the clinicians missing from it, such as an external ordering physician.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `npi` | Yes | 10 digits | `1407006835` |
| `last_name` | Yes | text | `Roe` |
| `first_name` | Recommended | text | `Richard` |
| `specialty_nucc` | Recommended | NUCC taxonomy code(s), `;`-separated [Healthcare Provider Taxonomy](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.114222.4.11.1066&server=https://tx.fhir.org/r4) | `207R00000X` |
| `primary_org_npi` | Recommended | 10 digits | `1234567893` |
| `practitioner_role_code` | Recommended | role code [Care Team Member Function](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.30&server=https://tx.fhir.org/r4) | `doctor` |
| `address_line1` | Recommended | text | `225 Broadway` |
| `address_line2` | If available | text | `Suite 400` |
| `city` | Recommended | text | `New York` |
| `state` | Recommended | 2-letter USPS [USPS states](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state) | `NY` |
| `zip` | Recommended | 5 digits, as a string | `10007` |
| `phone` | Recommended | 10 digits | `5551234567` |
| `email` | If available | email address | |
| `role_period_start` | If available | date | `2021-04-01` |
| `role_period_end` | If available | date | |

Payerbox identifies the practice location by its address and deduplicates, so you assign it no id. Send the same address here that you send in the [Provider Directory](../provider-directory/README.md) feed for that site — matching addresses are the same Location.

## care_team

One row per patient and team member.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `member_npi` | Yes | 10 digits; send this or `member_related_person_id` | `1407006835` |
| `member_related_person_id` | Yes | `related_persons` key, for non-clinicians; send this or `member_npi` | |
| `role_code` | Yes | SNOMED or NUCC code [Care Team Member Function](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.30&server=https://tx.fhir.org/r4) | `223366009` |
| `status` | Recommended | `active`, `proposed`, `inactive` [care-team-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/care-team-status) | `active` |

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
