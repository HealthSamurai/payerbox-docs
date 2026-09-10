---
description: >-
  Columns for payer plan identifiers, mapped to the identifier element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per identifier.
---

# Plan Identifiers

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`plan_identifiers`](#plan_identifiers) | `identifier` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 1..* |

The profile requires at least one identifier per plan. `plan_id` on the root row is always the first; this dataset carries every other identifier the plan is known by, each with the namespace it belongs to.
## plan_identifiers

One row per additional identifier of a plan.

{% file src="../../../assets/data-integration/plan_identifiers.c61a2825.csv" %}
plan_identifiers.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `plan_id` | Yes | key from `payer_plans` | `PLAN-DSNP` |
| `identifier_value` | Yes | the identifier as issued | `H6776-001-000` |
| `identifier_system` | Yes | URI of the namespace that issued it | `http://cms.gov/medicare/ma-plan-id` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A row is identified by `plan_id`, `identifier_system` and `identifier_value` together; there is no separate key.
- The CMS contract-plan-segment (`H#####-###-###`) is the identifier every Medicare Advantage plan should carry here. Use one namespace URI for it consistently across plans and across the Provider Directory feed, so the two feeds' InsurancePlans match on it.
- `plan_id` itself is not repeated here. It is published as the first identifier automatically.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
