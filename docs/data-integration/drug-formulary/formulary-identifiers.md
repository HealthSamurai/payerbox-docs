---
description: >-
  Columns for formulary identifiers, mapped to the identifier element of the US Drug Formulary STU 2.1.0 Formulary profile: one row per identifier.
---

# Formulary Identifiers

## Datasets

Part of the [Drug Formulary](README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target element | Cardinality |
|---|---|---|
| [`formulary_identifiers`](#formulary_identifiers) | `identifier` of the [Formulary](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-Formulary.html) | 1..* |

The profile requires at least one identifier per formulary. `formulary_id` on the [`formularies`](formularies.md) row is always the first; this dataset carries every other identifier the formulary is known by, each with the namespace it belongs to.

## formulary_identifiers

One row per additional identifier of a formulary.

{% file src="../../assets/data-integration/formulary_identifiers.3815ad2e.csv" %}
formulary_identifiers.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `formulary_id` | Yes | key from `formularies` | `FORM-2027-A` |
| `identifier_value` | Yes | the identifier as issued | `00027113` |
| `identifier_system` | Yes | URI of the namespace that issued it | `http://cms.gov/medicare/formulary-id` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- A row is identified by `formulary_id`, `identifier_system` and `identifier_value` together; there is no separate key.
- The 8-digit CMS formulary id from your HPMS submission is the identifier every Part D formulary should carry here. CMS publishes no URI for it; use one namespace consistently across formularies.
- `formulary_id` itself is not repeated here. It is published as the first identifier automatically.

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
