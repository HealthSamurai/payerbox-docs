---
description: >-
  Columns for the drug formulary feed, mapped to Da Vinci PDex US Drug
  Formulary STU 2.1.0: payer plans, formularies, formulary drugs and items.
---

# Drug Formulary

## Datasets

Built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). A formulary is the list of drugs a plan pays for, with the tier, cost sharing and coverage rules for each. The IG splits it into four resources, and the feed has one dataset per resource.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`payer_plans`](payer-plans.md) | [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) (InsurancePlan), with its coverage area as [Insurance Plan Location](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-InsurancePlanLocation.html) |
| [`formularies`](formularies.md) | [Formulary](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-Formulary.html) (InsurancePlan) |
| [`formulary_drugs`](formulary-drugs.md) | [Formulary Drug](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-FormularyDrug.html) (MedicationKnowledge) |
| [`formulary_items`](formulary-items.md) | [Formulary Item](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-FormularyItem.html) (Basic) |

The four fit together this way. A payer plan states its drug benefit as a cost-sharing table, one cell per pharmacy benefit type and drug tier, and points at the formulary it uses. A formulary is a named list for a plan year. A formulary drug is one prescribable product, identified by RxNorm. A formulary item is the row of the list: this drug, on this formulary, in this tier, with these requirements.

## Data conventions

| Rule | Detail |
|---|---|
| Scope | Medicare Advantage lines with Part D drug coverage. Covered drugs only: a drug that is not on the formulary is absent, not listed as excluded. |
| Delivery | Full snapshot each extract, not deltas. A drug removed during the plan year stays in the snapshot as `retired` with an `availability_end` until the plan year ends, so a member can still see it was covered; a plan or formulary that ended is likewise `retired`. Rows absent from a snapshot are removed. |
| Keys | `plan_id`, `formulary_id` and `drug_id` are your identifiers and stay stable across snapshots. A plan that also appears in the [Provider Directory](../provider-directory/README.md#plans) uses the same `plan_id` there, and `*_org_npi` and `network_ids` are keys into that feed's `organizations` and `networks`. |
| Codes | Send the code, not the description. Drugs are RxNorm; Payerbox derives every display from its terminology service. |
| Multiple values | `;`-separated, positionally aligned across companion columns. |
| Amounts | Copays are decimal US dollars; coinsurance is a percentage, `0` to `100`, no `%` sign. |
| Dates | `YYYY-MM-DD`. |
| Not PHI | A formulary is public information and is also served unauthenticated. It carries no member data. |

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
