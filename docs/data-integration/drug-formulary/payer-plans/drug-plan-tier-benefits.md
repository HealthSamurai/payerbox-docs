---
description: >-
  Columns for the drug tiers under each pharmacy benefit type, mapped to the specificCost.benefit element of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per tier.
---

# Drug Plan Tier Benefits

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`drug_plan_tier_benefits`](#drug_plan_tier_benefits) | `plan:drug-plan.specificCost.benefit` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 1..*, must support |

A tier benefit is one drug tier within one pharmacy benefit type. It has no fields of its own beyond the tier; it exists to hang the copay and coinsurance on.
## drug_plan_tier_benefits

One row per drug tier under a pharmacy benefit type.

{% file src="../../../assets/data-integration/drug_plan_tier_benefits.71fa84e0.csv" %}
drug_plan_tier_benefits.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `drug_plan_id` | Yes | key from `drug_plans` | `DP-DSNP` |
| `pharmacy_benefit_type` | Yes | key from `drug_plan_specific_costs`, with `drug_plan_id` | `1-month-in-retail` |
| `drug_tier` | Yes | see [Drug tiers](#drug-tiers); becomes `type` | `generic` |
| `is_deleted` | If retracting | `true` retracts this row and its costs | `true` |

- A row is identified by `drug_plan_id`, `pharmacy_benefit_type` and `drug_tier` together.
- Every row needs at least one [cost](drug-plan-tier-costs.md) under it.
- The tiers a drug plan lists here are the ones its formulary items may name in `drug_tier`.

### Drug tiers

`drug_tier` is the plan's own tier for the drug. The IG ships an example set, [DrugTierVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/DrugTierVS&server=https://tx.health-samurai.io/fhir), and expects plans to use their own where these do not fit. Send the code your plan documents use; if it is not one of these, tell us during scoping so the tier is registered.

| Value | Meaning |
|---|---|
| `preferred-generic` | commonly prescribed generic drugs |
| `generic` | generic drugs that cost more than preferred generics |
| `non-preferred-generic` | generic drugs that cost more than the generic tier |
| `preferred-brand` | brand-name drugs preferred by the plan |
| `brand` | brand-name drugs that cost more than preferred brands |
| `non-preferred-brand` | brand-name drugs that cost more than the brand tier |
| `preferred` | drugs preferred by the plan, where tiers are not split by generic and brand |
| `non-preferred` | drugs that cost more than the preferred tier |
| `specialty` | drugs for complex conditions, generic or brand, often with special handling |
| `zero-cost-share-preventative` | preventive drugs available at no cost |
| `medical-service` | drugs administered by a clinician or in a facility, covered under the medical benefit |

Medicare Part D plans report tiers to CMS as numbers, `1` to `7`, and many plans' documents name them that way. Send the number when that is what your plan uses; Payerbox registers the numeric tiers as plan-own codes and a formulary item's `drug_tier` then carries the same number. A plan with one tier for every drug still sends it.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
