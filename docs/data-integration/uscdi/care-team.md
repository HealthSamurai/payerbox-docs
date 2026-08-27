---
description: >-
  Columns for practitioners and care_team, mapped from the USCDI v3.1 Care Team
  Member(s) data class to US Core 6.1.0 FHIR.
---

# Care Team Members

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`practitioners`](#practitioners) | [US Core Practitioner](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitioner.html), [US Core PractitionerRole](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitionerrole.html) |
| [`care_team`](#care-team) | [US Core CareTeam](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careteam.html) |

## practitioners

One row per practitioner, organization, and location: each row becomes one PractitionerRole, so a clinician practising at two locations produces two rows. Multiple specialties at the same location share a row.

If you already send the [Provider Directory](../provider-directory/README.md) feed, list here only the clinicians missing from it, such as an external ordering physician.

{% file src="../../assets/data-integration/practitioners.8d3ebf30.csv" %}
practitioners.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `npi` | Yes | 10 digits | `9999999991` |
| `last_name` | Yes | text | `Roe` |
| `first_name` | Recommended | text | `Richard` |
| `specialty_nucc` | Recommended | NUCC taxonomy code(s), `;`-separated [Healthcare Provider Taxonomy](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.114222.4.11.1066&server=https://tx.fhir.org/r4) | `207R00000X` |
| `primary_org_npi` | Recommended | 10 digits | `9999999993` |
| `practitioner_role_code` | Recommended | SNOMED CT or v3 participation-function code [Care Team Member Function](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.30&server=https://tx.fhir.org/r4) | `PCP` primary care physician |
| `location_id` | Recommended | `locations` key | `LOC-221` |
| `phone` | Recommended | 10 digits | `5551234567` |
| `email` | If available | email address | |
| `role_period_start` | If available | date | `2021-04-01` |
| `role_period_end` | If available | date | |

- A row is keyed by `npi`, `location_id` and `practitioner_role_code` together — the roster has no key of its own, so do not mint one. Keep those three stable and the role updates in place.

## care_team

One row per patient and team member.

{% file src="../../assets/data-integration/care_team.b875e2b2.csv" %}
care_team.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `member_npi` | Yes, unless `member_related_person_id` is sent | 10 digits | `9999999991` |
| `member_related_person_id` | Yes, unless `member_npi` is sent | `record_id` of the `related_persons` row, for non-clinicians | `RP-3310` |
| `role_code` | Yes | SNOMED CT or v3 participation-function code [Care Team Member Function](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.30&server=https://tx.fhir.org/r4) | `446050000` primary care physician |
| `status` | Recommended | `proposed`, `active`, `suspended`, `inactive`, `entered-in-error` [care-team-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/care-team-status%7C4.0.1) | `active` |

- A row is keyed by `patient_identifier`, the member (`member_npi` or `member_related_person_id`) and `role_code` together — a roster has no key of its own for a membership, so do not mint one.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
