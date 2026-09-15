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

{% file src="../../../assets/data-integration/drug_plan_tier_costs.f85c7ec1.csv" %}
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
| `min_value` | If a coinsurance has a floor | decimal, US dollars; the least a member pays for a fill | |
| `max_value` | If a coinsurance has a cap | decimal, US dollars; the most a member pays for a fill | `5.10` |
| `applicability` | If not implied | `in-network`, `out-of-network`, `other` [insuranceplan-applicability](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/insuranceplan-applicability%7C4.0.1); derived from the pharmacy benefit type when blank: `-out-` is out-of-network, `-in-` and a plan's own preferred or standard code are in-network | |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A row is identified by the tier's three keys plus `cost_type`. At most one `copay` and one `coinsurance` row per tier: a second row of the same type is merged into the first, one value is kept and the disagreement is reported as `merge_conflict`.
- `value` is mandatory on both slices, so a tier with no copay says so with `0.00` and the option `copay-not-applicable`, not by leaving the copay row out; likewise `0` with `coinsurance-not-applicable`. A free tier is `0.00` with `no-charge`.
- Send the cost sharing of the initial coverage phase, one set per tier. Part D has three phases, and two are fixed by law: in the deductible phase the member pays the full price until the deductible in `drug_plan_general_costs` is met, and in the catastrophic phase the member pays nothing. Only the initial phase is plan-specific, and it is what the IG's one amount per tier represents. Do not send rows for the other phases.
- `option` is the qualifier the profile requires on every cost: how the amount interacts with the deductible. The allowed values differ by `cost_type`, as listed. A tier the deductible applies to is `after-deductible`; a tier exempt from it is `charge`, or `no-charge` when the amount is zero.
- `min_value` and `max_value` are for a coinsurance with a dollar floor or ceiling, such as 25 percent up to $5.10 a fill. The IG's copay value carries a comparator, so Payerbox publishes a cap as a copay of `<= 5.10` beside the coinsurance, and a floor as `>=`. They are allowed only on a `coinsurance` row; a copay is already a fixed amount. Because the IG allows one copay per tier, the cap takes the copay's place: the tier's `copay-not-applicable` row, if sent, is dropped in its favor, and a tier that states a real copay amount and a cap is reported as a conflict and the cap is not published.
- A drug-specific cost share that overrides the tier, such as the statutory insulin copay cap, has no place in the plan's cost table. State it on the drug's formulary item in `additional_coverage_information`.
- Payerbox writes the copay as a money quantity in USD and the coinsurance as a percentage, and sets the cost `type` from `cost_type`.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
