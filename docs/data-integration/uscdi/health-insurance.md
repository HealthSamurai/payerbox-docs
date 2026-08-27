---
description: >-
  Columns for coverage, mapped from the USCDI v3.1 Health Insurance
  Information data class to US Core 6.1.0 FHIR.
---

# Health Insurance Information

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) data element onto a FHIR element.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`coverage`](#coverage) | [US Core Coverage](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-coverage.html) |

## coverage

One row per coverage. A member with more than one plan, or a plan year that changed mid-year, produces more than one row.

{% file src="../../assets/data-integration/coverage.csv" %}
coverage.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `status` | Yes | `active`, `cancelled`, `draft`, `entered-in-error` [fm-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/fm-status) | `active` |
| `member_id` | Recommended | plan member id | `HSX9930012` |
| `subscriber_id` | Recommended | text | `HSX9930012` |
| `relationship_code` | Yes | `self`, `spouse`, `child`, `other` [subscriber-relationship](https://terminology.hl7.org/CodeSystem-subscriber-relationship.html) | `self` |
| `coverage_type_code` | Recommended | Source of Payment Typology [Payer Type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.114222.4.11.3591) | `1` Medicare |
| `payer_org_npi` | Yes | 10 digits, or your payer id | `1234567893` |
| `group_number` | If available | text | `GRP-4410` |
| `group_name` | If available | text | `Acme Manufacturing` |
| `plan_number` | If available | text | `H6776-001` |
| `plan_name` | If available | text | `Gold PPO` |
| `period_start` | Recommended | date | `2026-01-01` |
| `period_end` | Recommended | date | `2026-12-31` |

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
