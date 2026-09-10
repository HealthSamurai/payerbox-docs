---
description: >-
  Columns for the benefits of a drug coverage, mapped to the drug-plan benefit slice of the US Drug Formulary STU 2.1.0 Payer Insurance Plan profile: one row per benefit.
---

# Drug Coverage Benefits

## Datasets

Part of the [Payer Plans](README.md) group of the [Drug Formulary](../README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`drug_coverage_benefits`](#drug_coverage_benefits) | `coverage:drug-coverage.benefit:drug-plan` of the [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) | 1..* |

The benefit is the profile's statement that the coverage is a drug benefit. Its type is fixed; what you may add is a requirement and limits, the only data the element carries.
## drug_coverage_benefits

One row per benefit of a drug coverage. Send a row only when you have a requirement or a limit to state; otherwise Payerbox adds the mandatory benefit itself.

{% file src="../../../assets/data-integration/drug_coverage_benefits.a5ea5fb1.csv" %}
drug_coverage_benefits.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `benefit_id` | Yes | your stable key for the benefit | `BEN-DSNP-RX` |
| `coverage_id` | Yes | key from `plan_drug_coverages` | `COV-DSNP-RX` |
| `requirement` | If available | free text; referral or other requirement for the benefit | `Part D covered drugs only` |
| `limit_values` | If a limit | decimals, `;`-separated, aligned with `limit_units` and `limit_codes` | `90` |
| `limit_units` | If a limit | unit of each limit value, aligned | `days` |
| `limit_codes` | If a limit | what each limit is, aligned; your own code or label | `days-supply` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `type` is fixed to `drug` and set by Payerbox.
- The three limit columns are one aligned list: position one of each describes the first limit. A limit needs at least a value.

These resources are served by [Patient Access](../../../interop-apis/patient-access.md).
