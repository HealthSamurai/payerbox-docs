---
description: >-
  Columns for the drug coverage of a payer plan, mapped to the drug-coverage slice of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per coverage.
---

# Drug Coverages

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`plan_drug_coverages`](#plan_drug_coverages) | `coverage:drug-coverage` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 1..* |

A drug coverage is the statement that the plan covers drugs and which formulary lists them. Most plans have exactly one; a plan whose Part D benefit is split across formularies for different groups has one per formulary set.
## plan_drug_coverages

One row per drug coverage of a plan.

{% file src="../../../assets/data-integration/plan_drug_coverages.1d4b69ed.csv" %}
plan_drug_coverages.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `coverage_id` | Yes | your stable key for the coverage; `drug_coverage_benefits` references it | `COV-DSNP-RX` |
| `plan_id` | Yes | key from `payer_plans` | `PLAN-DSNP` |
| `formulary_ids` | Yes | keys from [`formularies`](../formularies.md), `;`-separated; one in the usual case | `FORM-2027-A` |
| `network_ids` | If available | pharmacy networks providing this coverage, keys from Provider Directory `networks`, `;`-separated | `NET-001` |
| `is_deleted` | If retracting | `true` retracts this row and its benefits | `true` |

- `formulary_ids` fills the formulary-reference extension the profile requires on every drug coverage; the profile allows several, which is why it is a list. Each must exist in `formularies`.
- The coverage's `type` is fixed to drug policy and set by Payerbox.
- Every coverage needs at least one [benefit](drug-coverage-benefits.md). Where you send none, Payerbox adds the one bare `drug` benefit the profile demands.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
