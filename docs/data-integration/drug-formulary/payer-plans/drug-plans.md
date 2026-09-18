---
description: >-
  Columns for the drug plans of a payer plan, mapped to the drug-plan slice of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per drug plan.
---

# Drug Plans

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`drug_plans`](#drug_plans) | `plan:drug-plan` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 1..* |

A drug plan is the cost-sharing structure offered under a payer plan. A product usually has one; a product sold with several cost-sharing designs has one per design. Its cost table lives in the three datasets below it.
## drug_plans

One row per drug plan.

{% file src="../../../assets/data-integration/drug_plans.84771d8d.csv" %}
drug_plans.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `drug_plan_id` | Yes | your stable key for the drug plan; it becomes the drug plan's identifier and links a member's Coverage to it | `DP-DSNP` |
| `plan_id` | Yes | key from `payer_plans` | `PLAN-DSNP` |
| `identifier_values` | If available | further identifiers of the drug plan, `;`-separated, aligned with `identifier_systems` | `H6776-001-000` |
| `identifier_systems` | If `identifier_values` | namespace URI of each, aligned | `http://cms.gov/medicare/ma-plan-id` |
| `coverage_area_ids` | If different from the plan's | keys from [`coverage_areas`](coverage-areas.md), `;`-separated | |
| `network_ids` | If available | pharmacy networks of this drug plan, keys from Provider Directory `networks`, `;`-separated | `NET-001` |
| `is_deleted` | If retracting | `true` retracts the drug plan and its cost table | `true` |

- `drug_plan_id` is published as the drug plan's identifier, which 2.1.0 made must-support so a member's Coverage can point at the drug plan inside a product. Keep it stable; enrollment data will reference it.
- `type` is fixed to `drug` and set by Payerbox.
- `identifier_values` and `identifier_systems` are one aligned list. They become further `identifier` entries after `drug_plan_id`; the profile marks the drug plan identifier must-support and repeatable.
- Not collected: `plan.generalCost` is its own dataset, [`drug_plan_general_costs`](drug-plan-general-costs.md); nothing else of the drug plan is left out.
- A drug plan needs at least one [specific cost](drug-plan-specific-costs.md); a `drug_plans` row with none is reported and not published.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
