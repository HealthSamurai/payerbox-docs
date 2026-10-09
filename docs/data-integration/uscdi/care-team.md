---
description: >-
  Columns for practitioners, organizations, and care_team, mapped from the
  USCDI v3.1 Care Team Member(s) data class to US Core 6.1.0 FHIR.
---

# Care Team Members

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`practitioners`](#practitioners) | [US Core Practitioner](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitioner.html), [US Core PractitionerRole](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-practitionerrole.html) |
| [`organizations`](#organizations) | [US Core Organization](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-organization.html) |
| [`care_team`](#care-team) | [US Core CareTeam](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-careteam.html) |

## practitioners

One row per practitioner, organization, and location: each row becomes one PractitionerRole, so a clinician practising at two locations produces two rows. Multiple specialties at the same location share a row.

If you already send the [Provider Directory](../provider-directory/README.md) feed, list here only the clinicians missing from it, such as an external ordering physician.

{% file src="../../assets/data-integration/practitioners.983dad30.csv" %}
practitioners.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `npi` | Yes | 10 digits, Luhn-valid over the `80840` prefix, or another stable id with `practitioner_identifier_system` | `9999999995` |
| `practitioner_identifier_system` | If `npi` is not an NPI | URI of the issuing system, a URL you control or an OID; NPI (`http://hl7.org/fhir/sid/us-npi`) assumed when empty | `http://acme.org/provider-ids` |
| `last_name` | Yes | text | `Roe` |
| `first_name` | Recommended | text | `Richard` |
| `specialty_nucc` | Recommended | NUCC taxonomy code(s), `;`-separated [Healthcare Provider Taxonomy](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.114222.4.11.1066&server=https://tx.fhir.org/r4) | `207R00000X` |
| `primary_org_identifier` | Recommended | key from [`organizations`](#organizations) | `9999999979` |
| `practitioner_role_code` | Recommended | SNOMED CT or v3 participation-function code [Care Team Member Function](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.30&server=https://tx.fhir.org/r4) | `PCP` primary care physician |
| `location_id` | Recommended | `locations` key | `LOC-221` |
| `phone` | Recommended | 10 digits | `5551234567` |
| `email` | If available | email address | |
| `role_period_start` | If available | date | `2021-04-01` |
| `role_period_end` | If available | date | |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A clinician without an NPI, an out-of-state consultant or a reviewer a utilization-management vendor knows only internally, may be identified by another stable id; then `practitioner_identifier_system` names who issued it, the same way it works for organizations. US Core requires a Practitioner to carry an identifier and a family name, so a clinician sent as a bare name cannot be published.
- A row is keyed by `npi`, `location_id` and `practitioner_role_code` together — the roster has no key of its own, so do not mint one. Keep those three stable and the role updates in place.

## organizations

One row per organization, defined once: an in-network facility is its Provider Directory [`facilities`](../provider-directory/README.md#facilities) row; every other organization a `*_org_identifier` column names, including the plan issuer, is a row here. A directory-only sender ships this one file with the directory.

{% file src="../../assets/data-integration/organizations.c9b5ff65.csv" %}
organizations.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `org_identifier` | Yes | NPI, NAIC company code, CLIA number or your own id, see [identifier options](#organization-identifier-options); unique across the dataset | `9999999979` |
| `org_identifier_system` | If `org_identifier` is not an NPI | URI of the issuing system, see [identifier options](#organization-identifier-options); NPI assumed when empty | `urn:oid:2.16.840.1.113883.6.300` |
| `org_name` | Yes | text | `Family Medical Group` |
| `active` | Recommended | `true` / `false` (`true` assumed when empty); `false` retires an organization without deleting it | `true` |
| `org_type_code` | If available | `prov` provider, `pay` payer, `ins` insurance company, `dept` hospital department, `bus` non-healthcare business [organization-type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/organization-type%7C4.0.1) | `prov` |
| `telecom_code` | Recommended | `phone`, `fax`, `email`, `pager`, `url`, `sms`, `other` [contact-point-system](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/contact-point-system%7C4.0.1) | `phone` |
| `telecom_value` | Recommended | the number, address, or URL itself | `5551234567` |
| `address_line1` | Recommended | text | `225 Broadway` |
| `city` | Recommended | text | `New York` |
| `state` | Recommended | 2-letter USPS [USPS states](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-usps-state) | `NY` |
| `zip` | Recommended | 5 or 9 digits, as a string | `10007` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- Every `*_org_identifier` column in every feed carries this `org_identifier` value as is; the system is declared once, here.

### Organization identifier options

| Identifier | `org_identifier` | `org_identifier_system` | Typical organization |
|---|---|---|---|
| NPI | 10 digits, Luhn-valid over the `80840` prefix | empty, or `http://hl7.org/fhir/sid/us-npi` | practice, hospital, pharmacy |
| NAIC company code | 5 digits | `urn:oid:2.16.840.1.113883.6.300` | insurer, plan issuer |
| CLIA number | 10 characters, `D` in the third position | `urn:oid:2.16.840.1.113883.4.7` | clinical laboratory |
| Your own id | any stable string | a URL you control or an OID | anything else |

Identifiers and formats as [US Core Organization](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-organization.html) defines them. One identifier per row: an organization with an NPI is keyed by the NPI.
- `telecom_code` and `telecom_value` travel together: FHIR requires the system code whenever a contact value is sent, so a `telecom_value` with an empty `telecom_code` is rejected.
- FHIR requires `name` and `active` on every Organization, so a row without `org_name` is rejected, and an empty `active` is taken as `true`.

## care_team

One row per patient and team member.

{% file src="../../assets/data-integration/care_team.bd7abfb9.csv" %}
care_team.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MBR0000012` |
| `member_npi` | Yes, unless `member_related_person_id` is sent | 10 digits, Luhn-valid over the `80840` prefix | `9999999995` |
| `member_related_person_id` | Yes, unless `member_npi` is sent | `record_id` of the `related_persons` row, for non-clinicians | `RP-3310` |
| `role_code` | Yes | SNOMED CT or v3 participation-function code [Care Team Member Function](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113762.1.4.1099.30&server=https://tx.fhir.org/r4) | `446050000` primary care physician |
| `status` | Recommended | `proposed`, `active`, `suspended`, `inactive`, `entered-in-error` [care-team-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/care-team-status%7C4.0.1) | `active` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A row is keyed by `patient_identifier`, the member (`member_npi` or `member_related_person_id`) and `role_code` together — a roster has no key of its own for a membership, so do not mint one. Keep those stable and the membership updates in place.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
