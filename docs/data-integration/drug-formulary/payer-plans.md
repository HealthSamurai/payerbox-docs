---
description: >-
  Columns for payer plans, mapped to the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per plan, pharmacy benefit type and drug tier.
---

# Payer Plans

## Datasets

Part of the [Drug Formulary](README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`payer_plans`](#payer_plans) | [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) (InsurancePlan), with its coverage area as [Insurance Plan Location](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-InsurancePlanLocation.html) |

## payer_plans

One row per plan, pharmacy benefit type and drug tier. A plan with eight benefit types and five tiers produces up to forty rows; the plan-level columns repeat on each and must agree. Payerbox builds one InsurancePlan per `plan_id` and one cost-sharing entry per row.

{% file src="../../assets/data-integration/payer_plans.a2023674.csv" %}
payer_plans.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `plan_id` | Yes | your stable key for the plan; the same value as in Provider Directory `plans` | `PLAN-DSNP` |
| `plan_identifier` | If MA | `H#####-###-###`, contract-plan-segment, as in Provider Directory `plans` | `H6776-001-000` |
| `drug_plan_id` | If different | identifier of the drug plan inside the product, used to link a member's Coverage; blank when it equals `plan_id` | |
| `plan_name` | Recommended | text | `Example Health D-SNP` |
| `status` | Yes | `active`, `draft`, `retired`, `unknown` [publication-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/publication-status%7C4.0.1) | `active` |
| `plan_type` | Yes | `mediadv` Medicare Advantage, `mediadvhmo` MA HMO [InsuranceProductTypeVS](https://hl7.org/fhir/us/davinci-pdex-plan-net/STU1.2/ValueSet-InsuranceProductTypeVS.html) | `mediadv` |
| `period_start` | Recommended | date the plan year begins | `2027-01-01` |
| `period_end` | Recommended | date the plan year ends | `2027-12-31` |
| `coverage_area_states` | Recommended | 2-letter USPS states where the plan is offered, `;`-separated; `US` for nationwide | `NY` |
| `owned_by_org_npi` | Recommended | 10 digits; the plan sponsor; key from `organizations` | `9999999993` |
| `administered_by_org_npi` | If different | 10 digits; the administrator or PBM; key from `organizations` | |
| `network_ids` | If available | pharmacy networks of the drug benefit, keys from Provider Directory `networks`, `;`-separated | `NET-001` |
| `member_phone` | Recommended | 10 digits; member services line | `8885551002` |
| `marketing_url` | Recommended | plan marketing page | `https://example.org/plans/dsnp` |
| `summary_url` | Recommended | summary of drug benefits page | `https://example.org/plans/dsnp/benefits` |
| `formulary_url` | Recommended | printable formulary page | `https://example.org/plans/dsnp/formulary` |
| `formulary_ids` | Yes | keys from `formularies`, `;`-separated; one in the usual case | `FORM-2027-A` |
| `pharmacy_benefit_type` | Yes | see [Pharmacy benefit types](#pharmacy-benefit-types) | `1-month-in-retail` |
| `drug_tier` | Yes | see [Drug tiers](#drug-tiers) | `generic` |
| `copay_amount` | Yes, unless `coinsurance_rate` is sent | decimal; flat amount per fill | `5.00` |
| `copay_option` | If `copay_amount` | `after-deductible`, `before-deductible`, `no-charge`, `no-charge-after-deductible`, `charge`, `copay-not-applicable`, `deductible-waived` [CopayOptionVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/CopayOptionVS%7C2.1.0&server=https://tx.health-samurai.io/fhir) | `charge` |
| `coinsurance_rate` | Yes, unless `copay_amount` is sent | percent, `0` to `100` | `25` |
| `coinsurance_option` | If `coinsurance_rate` | `after-deductible`, `no-charge`, `no-charge-after-deductible`, `charge`, `coinsurance-not-applicable`, `deductible-waived` [CoinsuranceOptionVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/CoinsuranceOptionVS%7C2.1.0&server=https://tx.health-samurai.io/fhir) | `after-deductible` |
| `last_updated` | Yes | datetime the plan last changed in your system | `2026-10-01T09:00:00-05:00` |
| `is_deleted` | If retracting | `true` retracts every row of this `plan_id` | `true` |

- Each row must carry a copay, a coinsurance, or both. The option column says how the amount interacts with the deductible; `copay-not-applicable` and `coinsurance-not-applicable` are how a tier says it has no copay or no coinsurance while still stating the other. Send `0.00` with `no-charge` for a tier that is free.
- The pharmacy benefit types and tiers a plan uses in `payer_plans` are the vocabulary its formulary items may use. A `formulary_items` row whose `drug_tier` or `pharmacy_benefit_types` the plan's cost table does not define is reported.
- `coverage_area_states` is the one place Payerbox creates a resource without a key from you: one Location per state code, named after the state, with the state as its address. `US` yields a single nationwide Location.
- `member_phone` and the three URLs become the plan's contacts, typed member information, marketing, summary and formulary. The IG expects payers to point members at the printed formulary for rules the structured data cannot express.
- The profile requires at least one identifier. `plan_id` becomes it, under the identifier namespace fixed for your engagement. `plan_identifier` becomes a second identifier under the CMS Medicare Advantage plan-id namespace, the same way the Provider Directory publishes it.
- `owned_by_org_npi`, `administered_by_org_npi` and `network_ids` reuse the Provider Directory keys, so the same plan described in both feeds names one sponsor and one set of networks.
- `drug_plan_id` exists for the 2.1.0 link from a member's Coverage to the drug plan inside a product. Send it when your enrollment system identifies the Part D plan separately from the product; otherwise Payerbox uses `plan_id`.

### Pharmacy benefit types

`pharmacy_benefit_type` says through which channel and supply length a cost applies. The set is the IG's own [PharmacyBenefitTypeVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/PharmacyBenefitTypeVS%7C2.1.0&server=https://tx.health-samurai.io/fhir), extensible: a plan may add its own codes, and then defines them in a code system Payerbox registers per engagement.

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

### Drug tiers

`drug_tier` is the plan's own tier for the drug. The IG ships an example set, [DrugTierVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/DrugTierVS%7C2.1.0&server=https://tx.health-samurai.io/fhir), and expects plans to use their own where these do not fit. Send the code your plan documents use; if it is not one of these, tell us during scoping so the tier is registered.

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

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
