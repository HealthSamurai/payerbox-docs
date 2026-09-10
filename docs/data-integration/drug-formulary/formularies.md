---
description: >-
  Columns for formularies, mapped to the US Drug Formulary STU 2.1.0 Formulary profile: one row per plan-year drug list.
---

# Formularies

## Datasets

Part of the [Drug Formulary](README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`formularies`](#formularies) | [Formulary](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-Formulary.html) (InsurancePlan) |

The formulary's identifiers and contacts repeat, so they are the datasets [`formulary_identifiers`](formulary-identifiers.md) and [`formulary_contacts`](formulary-contacts.md).

## formularies

One row per formulary. A formulary is a plan-year list; a new plan year is a new row with a new `formulary_id`.

{% file src="../../assets/data-integration/formularies.3b50688b.csv" %}
formularies.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `formulary_id` | Yes | your stable key; `payer_plans` and `formulary_items` reference it | `FORM-2027-A` |
| `formulary_name` | Recommended | text | `Example Health 2027 Part D Formulary` |
| `formulary_aliases` | If renamed | earlier names, `;`-separated, so old searches still find it | |
| `status` | Yes | `active`, `draft`, `retired`, `unknown` [publication-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/publication-status%7C4.0.1) | `active` |
| `period_start` | Recommended | date the formulary takes effect | `2027-01-01` |
| `period_end` | Recommended | date the formulary expires | `2027-12-31` |
| `owned_by_org_npi` | Recommended | 10 digits; the plan sponsor that issues the formulary; key from `organizations` | `9999999993` |
| `administered_by_org_npi` | If different | 10 digits; the PBM or administrator that maintains it; key from `organizations` | `9999999994` |
| `network_ids` | If available | pharmacy networks the formulary applies to, keys from Provider Directory `networks`, `;`-separated | `NET-001` |
| `coverage_area_ids` | If available | keys from [`coverage_areas`](payer-plans/coverage-areas.md), `;`-separated | `AREA-NY` |
| `last_updated` | Yes | datetime the formulary last changed in your system | `2026-10-01T09:00:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- The profile requires at least one identifier. `formulary_id` becomes it, under the identifier namespace fixed for your engagement. Every other identifier, such as the CMS formulary id from your HPMS submission, is a row in [`formulary_identifiers`](formulary-identifiers.md) with its own namespace.
- A formulary needs a name or an id; both are better. Payerbox sets its type to drug policy and its plan type to drug, which is what marks an InsurancePlan as a formulary rather than a payer plan.
- `owned_by_org_npi`, `administered_by_org_npi` and `network_ids` are the same keys the Provider Directory `plans` dataset uses, so a formulary and the plan that uses it name the same sponsor and networks. `coverage_area_ids` point at the same `coverage_areas` rows the plans use.
- Contacts, including the printable formulary the IG expects to be reachable from the resource, are rows in [`formulary_contacts`](formulary-contacts.md).
- Not collected: `endpoint`, and the Formulary's own `coverage` and `plan` structures. The IG uses the Formulary as an organizing construct; cost sharing lives on the payer plan.

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
