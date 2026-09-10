---
description: >-
  Columns for the general costs of a drug plan, mapped to the generalCost element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per cost, such as a premium.
---

# Drug Plan General Costs

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`drug_plan_general_costs`](#drug_plan_general_costs) | `plan:drug-plan.generalCost` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 0..* |

A general cost is a cost of the drug plan that is not tied to a drug tier: the premium, a deductible, an out-of-pocket maximum. The profile leaves it optional and unconstrained; it is here because the IG's plan-shopping use case is about comparing exactly these.

## drug_plan_general_costs

One row per general cost of a drug plan.

{% file src="../../../assets/data-integration/drug_plan_general_costs.9c2ffe06.csv" %}
drug_plan_general_costs.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `drug_plan_id` | Yes | key from `drug_plans` | `DP-DSNP` |
| `cost_type` | Yes | your code for the kind of cost, with `cost_type_system`; the profile binds nothing here | `premium` |
| `cost_type_system` | If coded | code system URI of `cost_type`; blank publishes it as text | |
| `group_size` | If available | integer; number of enrollees the cost applies to, for family or group premiums | `1` |
| `amount` | Yes | decimal, US dollars | `0.00` |
| `comment` | If available | free text shown with the amount | `No monthly premium for members with full Medicaid` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A row is identified by `drug_plan_id`, `cost_type` and `group_size` together.
- `cost_type` has no value set in the profile. Use one vocabulary consistently, such as `premium`, `deductible`, `out-of-pocket-maximum`, and tell us at scoping so it is registered as a code system; otherwise it is published as text.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
