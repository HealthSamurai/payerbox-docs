---
description: >-
  Columns for the drug formulary feed, mapped to Da Vinci PDex US Drug
  Formulary STU 2.1.0: payer plans, formularies, formulary drugs and items.
---

# Drug Formulary

## Datasets

Built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). A formulary is the list of drugs a plan pays for, with the tier, cost sharing and coverage rules for each. The IG splits it into four resources plus the locations a plan is offered in; the feed has one dataset per resource, and the payer plan, whose profile nests several repeating structures, is a group of eleven datasets, one per repeating element.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`payer_plans`](payer-plans/README.md) and its ten child datasets | [Payer Insurance Plan](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-PayerInsurancePlan.html) (InsurancePlan), with its coverage areas as [Insurance Plan Location](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-InsurancePlanLocation.html) (Location) |
| [`formularies`](formularies.md), [`formulary_identifiers`](formulary-identifiers.md), [`formulary_contacts`](formulary-contacts.md) | [Formulary](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-Formulary.html) (InsurancePlan) |
| [`formulary_drugs`](formulary-drugs.md) | [Formulary Drug](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-FormularyDrug.html) (MedicationKnowledge) |
| [`formulary_items`](formulary-items.md) | [Formulary Item](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-FormularyItem.html) (Basic) |

They fit together this way. A payer plan states its drug benefit as a cost-sharing table, one cell per pharmacy benefit type and drug tier, points at the formulary it uses, and names its coverage areas and contacts. A formulary is a named list for a plan year. A formulary drug is one prescribable product, identified by RxNorm. A formulary item is the row of the list: this drug, on this formulary, in this tier, with these requirements.

## Data conventions

| Rule | Detail |
|---|---|
| Scope | Medicare Advantage lines with Part D drug coverage. Covered drugs only: a drug that is not on the formulary is absent, not listed as excluded. The datasets follow the shape of the formulary, beneficiary-cost and plan files a Part D sponsor already submits to CMS, so that submission is a ready source. |
| Delivery | Full snapshot each extract, not deltas. A drug removed during the plan year stays in the snapshot as `retired` with an `availability_end` until the plan year ends, so a member can still see it was covered; a plan or formulary that ended is likewise `retired`. A row absent from a snapshot is **not** removed: the resource stays as last published, so retire it with its status column or retract it with `is_deleted` (see Retracting). |
| Files | One CSV per dataset, named after it: `payer_plans.csv`, `formulary_items.csv`, and so on. `coverage_areas`, `formulary_drugs` and `formulary_items` may be split into several files with a suffix, such as `formulary_items_2027.csv`. The payer plan's files travel in one delivery: `payer_plans`, `plan_drug_coverages`, `drug_coverage_benefits`, `drug_plans`, `drug_plan_specific_costs`, `drug_plan_tier_benefits` and `drug_plan_tier_costs` are required together, and a delivery missing one of them is refused; `plan_identifiers`, `plan_contacts` and `drug_plan_general_costs` are optional. A formulary travels with its `formulary_identifiers` and `formulary_contacts` the same way. Any other combination of datasets may be delivered on its own. Every column of a dataset's table must be in its header, blank where you have nothing to send; a file missing a documented column is refused, and columns the table does not list are ignored. |
| Keys | `plan_id`, `formulary_id` and `drug_id` are your identifiers and stay stable across snapshots. A plan that also appears in the [Provider Directory](../provider-directory/README.md#plans) uses the same `plan_id` there. `*_org_npi` columns are keys into the USCDI feed's [`organizations`](../uscdi/care-team.md#organizations) dataset and `network_ids` into the Provider Directory's [`networks`](../provider-directory/README.md#networks); an organization or network a row names must already be published through those feeds, or the plan, formulary or area that names it waits until it is. |
| Retracting | `is_deleted` `true` on a `payer_plans` or `formularies` row sets the published resource's `status` to `retired`; on a `formulary_drugs` or `coverage_areas` row, to `inactive`. The resource itself stays. A child row flagged, or left out of the snapshot, is dropped from its parent when the parent is next built. A `formulary_items` row cannot be retracted this way: the IG's item has no status of its own, so a flagged row is left out of the build and reported; withdraw an item with `availability_status` `retired` and an `availability_end`. |
| Codes | Send the code, not the description. Drugs are RxNorm; Payerbox derives every display from its terminology service. |
| Multiple values | `;`-separated, positionally aligned across companion columns. A repeating structure with fields of its own is a dataset instead, one row per occurrence, keyed to its parent. Free-text lists such as aliases must not contain `;` inside a value; a value that needs one goes in a single-value column or its own row. Each list is published up to a fixed length, stated on its column; values past it are reported and not published. |
| Amounts | Copays are decimal US dollars; coinsurance is a percentage, `0` to `100`, no `%` sign. Cost sharing is the initial coverage phase's; the deductible and catastrophic phases are fixed by law and not sent. |
| Profiles | Every column maps to an element of the US Drug Formulary profiles or their value sets. The feed defines no extensions of its own; where the IG has no element for a fact, the fact is not collected. |
| Dates | `YYYY-MM-DD`. The `last_updated` columns are datetimes with a timezone offset, `YYYY-MM-DDThh:mm:ss±hh:mm` or `Z`: they become `meta.lastUpdated`, which FHIR types as an instant. A date alone there is reported as `date_only` and, where the column is required, the row is held back. |
| Not PHI | A formulary is public information and is also served unauthenticated. It carries no member data. |

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
