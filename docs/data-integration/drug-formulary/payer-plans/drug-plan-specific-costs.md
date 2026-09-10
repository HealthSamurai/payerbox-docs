---
description: >-
  Columns for the pharmacy benefit types of a drug plan, mapped to the specificCost element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per pharmacy benefit type.
---

# Drug Plan Specific Costs

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`drug_plan_specific_costs`](#drug_plan_specific_costs) | `plan:drug-plan.specificCost` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 1..*, must support |

A specific cost is one pharmacy benefit type of the drug plan: a channel and supply length, such as a one-month supply at an in-network retail pharmacy. The tiers and their amounts hang below it.
## drug_plan_specific_costs

One row per pharmacy benefit type of a drug plan.

{% file src="../../../assets/data-integration/drug_plan_specific_costs.336af84a.csv" %}
drug_plan_specific_costs.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `drug_plan_id` | Yes | key from `drug_plans` | `DP-DSNP` |
| `pharmacy_benefit_type` | Yes | see [Pharmacy benefit types](#pharmacy-benefit-types); becomes `category` | `1-month-in-retail` |
| `is_deleted` | If retracting | `true` retracts this row and the tiers under it | `true` |

- A row is identified by `drug_plan_id` and `pharmacy_benefit_type` together.
- Every row needs at least one [tier benefit](drug-plan-tier-benefits.md) under it.
- The pharmacy benefit types a drug plan lists here are the ones its formulary items may name in `pharmacy_benefit_types`.

### Pharmacy benefit types

`pharmacy_benefit_type` says through which channel and supply length a cost applies. The set is the IG's own [PharmacyBenefitTypeVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/PharmacyBenefitTypeVS&server=https://tx.health-samurai.io/fhir), extensible: a plan may add its own codes, and then defines them in a code system Payerbox registers per engagement.

| Value | Meaning |
|---|---|
| `1-month-in-retail` | 1-month supply, in-network retail pharmacy |
| `1-month-out-retail` | 1-month supply, out-of-network retail pharmacy |
| `1-month-in-mail` | 1-month supply, in-network mail order |
| `1-month-out-mail` | 1-month supply, out-of-network mail order |
| `3-month-in-retail` | 3-month supply, in-network retail pharmacy |
| `3-month-out-retail` | 3-month supply, out-of-network retail pharmacy |
| `3-month-in-mail` | 3-month supply, in-network mail order |
| `3-month-out-mail` | 3-month supply, out-of-network mail order |

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
