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
| `substance_code` | Yes | RxNorm, SNOMED CT, or UNII code, with `substance_system`; RxNorm if omitted [Common substances for allergy and intolerance documentation including refutations](https://vsac.nlm.nih.gov/valueset/2.16.840.1.113762.1.4.1186.8/expansion) | `7980` penicillin G |
| `clinical_status` | Recommended | `active`, `inactive`, `resolved` [allergyintolerance-clinical](https://hl7.org/fhir/R4/valueset-allergyintolerance-clinical.html) | `active` |
| `verification_status` | Recommended | `unconfirmed`, `confirmed`, `refuted`, `entered-in-error` [allergyintolerance-verification](https://hl7.org/fhir/R4/valueset-allergyintolerance-verification.html) | `confirmed` |
| `category` | If available | `food`, `medication`, `environment`, `biologic` [allergy-intolerance-category](https://hl7.org/fhir/R4/valueset-allergy-intolerance-category.html) | `medication` |
| `criticality` | If available | `low`, `high`, `unable-to-assess` [allergy-intolerance-criticality](https://hl7.org/fhir/R4/valueset-allergy-intolerance-criticality.html) | `high` |
| `reaction_manifestation_code` | If a reaction is recorded | SNOMED CT code(s), `;`-separated [SNOMED CT Clinical Findings](https://hl7.org/fhir/R4/valueset-clinical-findings.html) | `247472004` wheal |
| `onset_date` | If available | datetime | `2019-05-02` |

- `substance_code` is the one coded field with no fallback: a row without it cannot become an AllergyIntolerance.
- A row that carries a reaction needs at least one `reaction_manifestation_code`. Manifestation is mandatory inside a reaction.
- Leave `clinical_status` empty when `verification_status` is `entered-in-error`, and populate it in every other case. US Core forbids the other two combinations.

### No known allergies

An empty file is ambiguous: it does not separate "we asked, the member has no allergies" from "we never asked". US Core states both as a row with a negation code.

| Meaning | `substance_code` | `verification_status` |
|---|---|---|
| Member has no known allergies | `716186003` No known allergy | `confirmed` |
| Member was not asked | `1631000175102` Patient not asked | `unconfirmed`, or empty |

Both codes are SNOMED CT, so send `substance_system` as `http://snomed.info/sct`.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), [Payer-to-Payer](../../interop-apis/payer-to-payer.md), and [Prior Auth](../../prior-auth/README.md).
