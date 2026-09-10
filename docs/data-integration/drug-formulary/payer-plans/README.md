---
description: >-
  The payer plan group of the drug formulary feed: one root dataset per InsurancePlan and one child dataset per repeating element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile.
---

# Payer Plans

## Datasets

Part of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

A payer plan is one [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) (InsurancePlan). The profile nests several repeating structures, and every one that may repeat is its own dataset here: the root file carries what occurs once per plan, and each child file carries one repeating element, keyed back to its parent. This mirrors the profile's slices one to one.

A repeating element is carried one of two ways. A structure with fields of its own is a child dataset, one row per occurrence. A repeating reference, code or short text with no fields of its own is a `;`-separated list column on its parent row. Free-text lists such as aliases must not contain `;` inside a value; a value that needs one goes in a single-value column or its own row.

| Dataset | Element | Cardinality | Parent |
|---|---|---|---|
| [`payer_plans`](#payer_plans) | InsurancePlan | one per plan | |
| [`plan_identifiers`](plan-identifiers.md) | `identifier` | 1..* | `payer_plans` |
| [`plan_contacts`](plan-contacts.md) | `contact` | 0..*, must support | `payer_plans` |
| [`coverage_areas`](coverage-areas.md) | `coverageArea`, an Insurance Plan Location | 0..*, must support | `payer_plans`, `drug_plans`, `formularies` |
| [`plan_drug_coverages`](drug-coverages.md) | `coverage:drug-coverage` | 1..* | `payer_plans` |
| [`drug_coverage_benefits`](drug-coverage-benefits.md) | `coverage:drug-coverage.benefit:drug-plan` | 1..* | `plan_drug_coverages` |
| [`drug_plans`](drug-plans.md) | `plan:drug-plan` | 1..* | `payer_plans` |
| [`drug_plan_specific_costs`](drug-plan-specific-costs.md) | `plan:drug-plan.specificCost` | 1..* | `drug_plans` |
| [`drug_plan_tier_benefits`](drug-plan-tier-benefits.md) | `plan:drug-plan.specificCost.benefit` | 1..* | `drug_plan_specific_costs` |
| [`drug_plan_tier_costs`](drug-plan-tier-costs.md) | `plan:drug-plan.specificCost.benefit.cost` | 1..* | `drug_plan_tier_benefits` |

Repeating references and codes that carry no fields of their own stay as `;`-separated lists on their parent row: `network_ids`, `coverage_area_ids`, `formulary_ids`, `plan_aliases`.

## payer_plans

One row per plan: the elements of the InsurancePlan that occur once.

{% file src="../../../assets/data-integration/payer_plans.b83c1465.csv" %}
payer_plans.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `plan_id` | Yes | your stable key for the plan; every child dataset references it, and it is the same value as in Provider Directory `plans` | `PLAN-DSNP` |
| `plan_name` | Recommended | text | `Example Health D-SNP` |
| `plan_aliases` | If renamed | earlier names, `;`-separated | |
| `status` | Yes | `active`, `draft`, `retired`, `unknown` [publication-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/publication-status%7C4.0.1) | `active` |
| `plan_type` | Yes | `mediadv` Medicare Advantage, `mediadvhmo` MA HMO [InsuranceProductTypeVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-pdex-plan-net/ValueSet/InsuranceProductTypeVS%7C1.2.0) | `mediadv` |
| `period_start` | Recommended | date the plan year begins | `2027-01-01` |
| `period_end` | Recommended | date the plan year ends | `2027-12-31` |
| `coverage_area_ids` | Recommended | keys from [`coverage_areas`](coverage-areas.md), `;`-separated | `AREA-NY` |
| `owned_by_org_npi` | Recommended | 10 digits; the plan sponsor; key from `organizations` | `9999999993` |
| `administered_by_org_npi` | If different | 10 digits; the administrator or PBM; key from `organizations` | |
| `network_ids` | If available | networks of the product, keys from Provider Directory `networks`, `;`-separated | `NET-001` |
| `last_updated` | Yes | datetime the plan last changed in your system | `2026-10-01T09:00:00-05:00` |
| `is_deleted` | If retracting | `true` retracts the plan and every child row that references it | `true` |

- `plan_id` becomes the plan's first identifier, under the identifier namespace fixed for your engagement. Further identifiers, such as the CMS contract-plan-segment, are rows in [`plan_identifiers`](plan-identifiers.md).
- A plan is complete only with its children. The profile requires at least one drug coverage and at least one drug plan with a cost table, so a `payer_plans` row with no `plan_drug_coverages` row or no `drug_plans` row is reported and not published.
- `owned_by_org_npi`, `administered_by_org_npi` and `network_ids` reuse the Provider Directory keys, so the same plan described in both feeds names one sponsor and one set of networks.
- `is_deleted` on the plan retracts the whole tree. Child rows have their own `is_deleted` for retracting one contact, one cost cell or one identifier.

### How the datasets become the resource

| Element | Cardinality | Filled from |
|---|---|---|
| `meta.lastUpdated` | 1..1 | `payer_plans.last_updated` |
| `identifier` | 1..* | `plan_id`, then one per `plan_identifiers` row |
| `status`, `type`, `name`, `alias`, `period` | | `payer_plans` columns |
| `ownedBy`, `administeredBy` | | `owned_by_org_npi`, `administered_by_org_npi` |
| `coverageArea` | 0..*, must support | one Insurance Plan Location per `coverage_area_ids` value, from `coverage_areas` |
| `contact` | 0..*, must support | one per `plan_contacts` row |
| `network` | | `network_ids` |
| `coverage:drug-coverage` | 1..* | one per `plan_drug_coverages` row; `type` fixed to drug policy; the formulary-reference extension holds each `formulary_ids` value |
| `coverage:drug-coverage.benefit:drug-plan` | 1..* | one per `drug_coverage_benefits` row; `type` fixed to `drug` |
| `plan:drug-plan` | 1..* | one per `drug_plans` row; `type` fixed to `drug`; `identifier` from `drug_plan_id` |
| `plan:drug-plan.specificCost` | 1..*, must support | one per `drug_plan_specific_costs` row; `category` is the pharmacy benefit type |
| `plan:drug-plan.specificCost.benefit` | 1..*, must support | one per `drug_plan_tier_benefits` row; `type` is the drug tier |
| `plan:drug-plan.specificCost.benefit.cost` | 1..* | one per `drug_plan_tier_costs` row, into the `copay` or `coinsurance` slice by `cost_type` |

Elements the profile leaves optional and this feed does not collect: `endpoint` and `plan.generalCost` (premiums).

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
