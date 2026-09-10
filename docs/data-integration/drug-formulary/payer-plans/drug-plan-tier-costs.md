---
description: >-
  Columns for the copay and coinsurance of each drug tier, mapped to the cost element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per cost.
---

# Drug Plan Tier Costs

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`drug_plan_tier_costs`](#drug_plan_tier_costs) | `plan:drug-plan.specificCost.benefit.cost` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html), slices `copay` and `coinsurance` | 1..*; each slice 0..1, must support |

A cost is one amount a member pays for a tier: a flat copay or a coinsurance percentage. The profile slices `cost` into those two, each at most once per tier, so a tier has one or two rows here.
## drug_plan_tier_costs

One row per cost of a tier.

{% file src="../../../assets/data-integration/drug_plan_tier_costs.8119bc4b.csv" %}
drug_plan_tier_costs.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `drug_plan_id` | Yes | key from `drug_plans` | `DP-DSNP` |
| `pharmacy_benefit_type` | Yes | with `drug_plan_id` and `drug_tier`, the key of the tier in `drug_plan_tier_benefits` | `1-month-in-retail` |
| `drug_tier` | Yes | see above | `generic` |
| `cost_type` | Yes | `copay` or `coinsurance`; which slice the row fills | `copay` |
| `value` | Yes | decimal; US dollars for a copay, percent `0` to `100` for a coinsurance | `5.00` |
| `option` | Yes | for `copay`: `after-deductible`, `before-deductible`, `no-charge`, `no-charge-after-deductible`, `charge`, `copay-not-applicable`, `deductible-waived` [CopayOptionVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/CopayOptionVS&server=https://tx.health-samurai.io/fhir); for `coinsurance`: `after-deductible`, `no-charge`, `no-charge-after-deductible`, `charge`, `coinsurance-not-applicable`, `deductible-waived` [CoinsuranceOptionVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/CoinsuranceOptionVS&server=https://tx.health-samurai.io/fhir) | `charge` |
| `applicability` | If not implied | `in-network`, `out-of-network`, `other` [insuranceplan-applicability](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/insuranceplan-applicability%7C4.0.1); derived from the `-in-` or `-out-` in the pharmacy benefit type when blank | |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A row is identified by the tier's three keys plus `cost_type`. At most one `copay` and one `coinsurance` row per tier; a second of either is rejected.
- `value` is mandatory on both slices, so a tier with no copay says so with `0.00` and the option `copay-not-applicable`, not by leaving the copay row out; likewise `0` with `coinsurance-not-applicable`. A free tier is `0.00` with `no-charge`.
- `option` is the qualifier the profile requires on every cost: how the amount interacts with the deductible. The allowed values differ by `cost_type`, as listed.
- Payerbox writes the copay as a money quantity in USD and the coinsurance as a percentage, and sets the cost `type` from `cost_type`.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
