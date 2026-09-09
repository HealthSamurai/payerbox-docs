---
description: >-
  Columns for formulary drugs, mapped to the US Drug Formulary STU 2.1.0 Formulary Drug profile: one row per RxNorm product.
---

# Formulary Drugs

## Datasets

Part of the [Drug Formulary](README.md) feed, built to [Da Vinci PDex US Drug Formulary STU 2.1.0](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/). The feed's data conventions apply.

| Dataset | US Drug Formulary STU 2.1.0 target profile |
|---|---|
| [`formulary_drugs`](#formulary_drugs) | [Formulary Drug](https://hl7.org/fhir/us/davinci-drug-formulary/STU2.1/StructureDefinition-usdf-FormularyDrug.html) (MedicationKnowledge) |

## formulary_drugs

One row per prescribable product on any of your formularies, identified by RxNorm at the strength-and-form level.

{% file src="../../assets/data-integration/formulary_drugs.47d248a8.csv" %}
formulary_drugs.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `drug_id` | Yes | your stable key for the drug; `formulary_items` reference it. The RxCUI itself is a good key when you list each product once | `RX-1049640` |
| `rxnorm_code` | Yes | RxCUI with term type SCD, SBD, GPCK or BPCK: the ingredient, strength and dose form, branded or not [SemanticDrugVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/SemanticDrugVS%7C2.1.0&server=https://tx.health-samurai.io/fhir) | `1049640` |
| `rxnorm_form_group_code` | Yes for SCD and SBD, blank for packs | RxCUI of the drug's form group, term type SCDG or SBDG: the ingredient and dose form without strength [SemanticDrugFormGroupVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-drug-formulary/ValueSet/SemanticDrugFormGroupVS%7C2.1.0&server=https://tx.health-samurai.io/fhir) | `1185784` |
| `rxnorm_display` | No | the RxNorm name; Payerbox derives it, send only to pin a spelling | |
| `ndc_codes` | If a specific product | NDCs this row is limited to, `;`-separated, when one RxNorm code has products with different coverage | `00069-0197-30` |
| `gpi_code` | If available | 14-digit Medi-Span Generic Product Identifier your formulary system uses for the drug | `21360019000320` |
| `status` | Yes | `active`, `inactive`, `entered-in-error` [medicationknowledge-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/medicationknowledge-status%7C4.0.1) | `active` |
| `dose_form_code` | If available | SNOMED CT dose form | `385055001` |
| `dose_form_text` | If no `dose_form_code` | the dose form as your system spells it | `TABLET` |
| `last_updated` | Yes | datetime the drug record last changed in your system | `2026-10-01T09:00:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `rxnorm_code` is the searchable identity of the drug: the IG requires the strength-and-form code (SCD or SBD) or the pack code (GPCK or BPCK), so a member's app can find the exact product prescribed. An ingredient-level RxCUI is rejected.
- `rxnorm_form_group_code` is mandatory whenever the IG's invariant applies: every SCD and SBD drug must also carry its SCDG or SBDG group, which lets a member search without knowing the strength. Packs have no group. Payerbox does not derive the group from the strength code, so send it.
- The IG lets one RxNorm code appear as several drug rows when products under it are covered differently. Give each its own `drug_id` and list the NDCs it applies to in `ndc_codes`; each becomes an additional coding on the resource.
- A drug taken off every formulary is `inactive`, not deleted, for the rest of the plan year.
- `dose_form_code` and `dose_form_text` are one FHIR element. Send the SNOMED CT code where your drug file has one; send the text where it has only a label such as `TABLET`, and Payerbox publishes the text. Both may be sent together.

### Codes

A formulary drug is one MedicationKnowledge whose `code` carries every identifier you send for the product, each as its own coding. Members' apps search by RxNorm; the others are there so a drug can be matched to claims, pharmacy files and your own systems.

| Column | Code system published | Note |
|---|---|---|
| `rxnorm_code` | `http://www.nlm.nih.gov/research/umls/rxnorm` | mandatory; the strength-and-form or pack concept |
| `rxnorm_form_group_code` | `http://www.nlm.nih.gov/research/umls/rxnorm` | mandatory for SCD and SBD; the form-group concept |
| `ndc_codes` | `http://hl7.org/fhir/sid/ndc` | one coding per NDC. Send the NDC in any of its usual forms; Payerbox publishes it under the FHIR NDC system whatever URI your source uses for it |
| `gpi_code` | the GPI code system URI agreed at scoping | GPI has no HL7-registered system URI, so the one Payerbox publishes is fixed per engagement and stays stable across snapshots |
| `dose_form_code` | `http://snomed.info/sct` | `doseForm.coding`; `dose_form_text` becomes `doseForm.text` |

These resources are served by [Patient Access](../../interop-apis/patient-access.md).
