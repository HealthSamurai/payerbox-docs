---
description: >-
  Columns for formulary items, mapped to the US Drug Formulary STU 2.1.0 Formulary Item profile: one row per drug per formulary with tier and coverage rules.
---

# Formulary Items

## Datasets

Part of the [Drug Formulary](README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`formulary_items`](#formulary_items) | [Formulary Item](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-FormularyItem.html) (Basic) |

## formulary_items

One row per drug per formulary: the entry that says whether and how the drug is covered. A drug on two formularies has two rows.

{% file src="../../assets/data-integration/formulary_items.b750de50.csv" %}
formulary_items.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `formulary_id` | Yes | key from `formularies` | `FORM-2027-A` |
| `drug_id` | Yes | key from `formulary_drugs` | `RX-1049640` |
| `availability_status` | Yes | `active` covered now, `retired` removed during the year, `draft` not yet effective [publication-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/publication-status%7C4.0.1) | `active` |
| `availability_start` | Recommended | date coverage on this formulary began | `2027-01-01` |
| `availability_end` | If retired | date coverage ended | `2027-06-30` |
| `pharmacy_benefit_types` | Yes | one or more [pharmacy benefit types](payer-plans.md#pharmacy-benefit-types) the drug is available through, `;`-separated | `1-month-in-retail;3-month-in-mail` |
| `drug_tier` | Yes | one [drug tier](payer-plans.md#drug-tiers) | `preferred-brand` |
| `prior_authorization` | Recommended | `true` or `false` | `true` |
| `prior_authorization_new_starts_only` | If `prior_authorization` is `true` | `true` when only members starting the drug need authorization | `true` |
| `step_therapy` | Recommended | `true` or `false`; another drug must be tried first | `false` |
| `step_therapy_new_starts_only` | If `step_therapy` is `true` | `true` when only members starting the drug are subject to it | |
| `quantity_limit` | Recommended | `true` or `false` | `true` |
| `quantity_limit_description` | If `quantity_limit` is `true` | free text, the limit as printed in the formulary | `60 tablets per 30 days` |
| `quantity_limit_rolling_count` | If a rolling limit | integer units dispensable per `quantity_limit_rolling_days` | `60` |
| `quantity_limit_rolling_days` | If a rolling limit | integer days of the rolling window | `30` |
| `quantity_limit_max_daily` | If a daily maximum | decimal units per day | `2` |
| `quantity_limit_days_supply_days` | If a days-supply limit | integer; maximum days' supply per fill | `180` |
| `quantity_limit_days_supply_window_days` | If a days-supply limit | integer; the period in which one such fill is allowed | `365` |
| `additional_coverage_information` | If available | free text; conditions the structured columns cannot say, such as a diagnosis prerequisite or age limit | `Covered for members 18 and older` |
| `last_updated` | Yes | datetime the item last changed in your system | `2026-10-01T09:00:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `pharmacy_benefit_types` and `drug_tier` are mandatory on every item and must be values the drug's plan defines in `payer_plans`. Together with the plan's cost table they are how a member's app computes what a fill costs.
- The three requirement flags are must-support; send `false` rather than leaving them blank, so the resource states that no requirement applies. The two new-starts flags matter only when the parent flag is `true` and are dropped otherwise.
- The quantity-limit detail columns are optional refinements of `quantity_limit`. Send the text always, and the numbers where your system holds them as data: a rolling limit is units per window, a daily maximum is units per day, a days-supply limit is one fill of at most that many days within the window. Payerbox writes them into the IG's quantity-limit detail extension.
- `additional_coverage_information` is published as text a member reads. Do not put structured data there that the columns already carry.

### Codes

Every coded value on a formulary item is published under a fixed code system; you send the code alone. The drug itself is not coded on the item.

| Column | Element | Code system |
|---|---|---|
| none, set by Payerbox | `code` | `formulary-item` from `http://hl7.org/fhir/us/davinci-drug-formulary/CodeSystem/usdf-InsuranceItemTypeCS` |
| `drug_tier` | drug tier extension | `http://hl7.org/fhir/us/davinci-drug-formulary/CodeSystem/usdf-DrugTierCS-TEMPORARY-TRIAL-USE`, or the plan's own system registered at scoping |
| `pharmacy_benefit_types` | pharmacy benefit type extension, one per value | `http://hl7.org/fhir/us/davinci-drug-formulary/CodeSystem/usdf-PharmacyBenefitTypeCS-TEMPORARY-TRIAL-USE`, or the plan's own system registered at scoping |
| `availability_status` | availability status extension | `http://hl7.org/fhir/publication-status` |
| `drug_id` | `subject`, a reference to the Formulary Drug | the RxNorm, NDC and GPI codes live on that resource, see [Formulary Drugs](formulary-drugs.md#codes) |

- A formulary item identifies its drug only through `drug_id`. RxNorm, NDC and GPI codes are properties of the product, not of its place on one formulary, so they are columns of `formulary_drugs`. A source that keeps one table per formulary with the codes on every row splits it into the two files: each product once in `formulary_drugs`, and one `formulary_items` row per formulary it appears on.
- The IG names the tier and benefit-type code systems temporary trial use, and both are extensible. A plan whose tiers do not match the IG list keeps its own codes; Payerbox publishes them under a code system registered for that plan.

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
