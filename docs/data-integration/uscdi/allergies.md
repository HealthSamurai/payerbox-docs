---
description: >-
  Columns for allergies, mapped from the USCDI v3.1 Allergies and Intolerances
  data class to US Core 6.1.0 FHIR.
---

# Allergies and Intolerances

## Datasets

[US Core 6.1.0](https://hl7.org/fhir/us/core/STU6.1/) maps each [USCDI](https://isp.healthit.gov/united-states-core-data-interoperability-uscdi#uscdi-v3-1) element to FHIR.

| Dataset | US Core 6.1.0 target profile(s) |
|---|---|
| [`allergies`](#allergies) | [US Core AllergyIntolerance](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-allergyintolerance.html) |

## allergies

One row per substance per patient. A substance with several reaction manifestations stays one row: list the manifestation codes `;`-separated.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_identifier` | Yes | patient key | `MRN-4471903` |
| `substance_code` | Yes | RxNorm ingredient or SNOMED CT code, with `substance_system`; RxNorm if omitted [Common substances for allergy and intolerance documentation including refutations](https://tx.fhir.org/r4/ValueSet/2.16.840.1.113762.1.4.1186.8-20240625?_format=html) | `7980` penicillin G |
| `clinical_status` | Yes, unless `verification_status` is `entered-in-error` | `active`, `inactive`, `resolved` [allergyintolerance-clinical](https://hl7.org/fhir/R4/valueset-allergyintolerance-clinical.html) | `active` |
| `verification_status` | Recommended | `unconfirmed`, `confirmed`, `refuted`, `entered-in-error` [allergyintolerance-verification](https://hl7.org/fhir/R4/valueset-allergyintolerance-verification.html) | `confirmed` |
| `category` | If available | `food`, `medication`, `environment`, `biologic` [allergy-intolerance-category](https://hl7.org/fhir/R4/valueset-allergy-intolerance-category.html) | `medication` |
| `criticality` | If available | `low`, `high`, `unable-to-assess` [allergy-intolerance-criticality](https://hl7.org/fhir/R4/valueset-allergy-intolerance-criticality.html) | `high` |
| `reaction_manifestation_code` | If a reaction is recorded | SNOMED CT code(s), `;`-separated [SNOMED CT Clinical Findings](https://hl7.org/fhir/R4/valueset-clinical-findings.html) | `247472004` Wheal |
| `onset_date` | If available | datetime | `2019-05-02` |

- `substance_code` is the one coded field with no fallback: a row without it cannot become an AllergyIntolerance. Send `substance_system` as `http://www.nlm.nih.gov/research/umls/rxnorm` or `http://snomed.info/sct`.
- **For a medication, send the ingredient.** Every RxNorm code the value set accepts is an ingredient, single or combination. A code for a specific product or pack, whether an NDC or an RxNorm drug-level code from a pharmacy claim, is not accepted, so roll it up to the ingredient first. For an allergy recorded against a whole drug class, send the SNOMED CT class code.
- A row that carries a reaction needs at least one `reaction_manifestation_code`. Manifestation is mandatory inside a reaction.
- `clinical_status` and `verification_status` are coupled: FHIR requires `clinical_status` on every row whose `verification_status` is not `entered-in-error`, and forbids it on rows that are. A row that leaves both empty is rejected. Sending `active` on live rows and `resolved` or `inactive` on closed ones satisfies this.

### No known allergies

An empty file is ambiguous: it does not separate "we asked, the member has no allergies" from "we never asked". US Core states either case as a row carrying a negation code, and the value set holds one per substance class.

| Meaning | `substance_code` | `clinical_status` | `verification_status` |
|---|---|---|---|
| No known allergies at all | `716186003` No known allergy | `active` | `confirmed` |
| No known drug allergies | `409137002` No known drug allergy | `active` | `confirmed` |
| No known food allergies | `429625007` No known food allergy | `active` | `confirmed` |
| No known environmental allergies | `428607008` No known environmental allergy | `active` | `confirmed` |
| No known latex allergy | `1003774007` No known latex allergy | `active` | `confirmed` |
| Member was not asked | `1631000175102` Patient not asked | `active` | `unconfirmed`, or empty |

All six are SNOMED CT. Use the narrowest one your source supports: a plan that only knows "no drug allergies" should send `409137002`, not `716186003`.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
