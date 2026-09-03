---
description: >-
  Columns for the claims and encounter feed, mapped to the CARIN Blue Button
  STU 2.1.0 ExplanationOfBenefit profiles, one dataset pair per claim type.
---

# Claims and Encounters

## Datasets

Built to the [CARIN IG for Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/). Every adjudicated claim becomes one ExplanationOfBenefit, and CARIN profiles the five claim types separately because their required fields differ. Each type is a pair of files: a claim file with one row per claim, and a lines file with one row per service line.

| Claim type | Datasets | CARIN BB STU 2.1.0 target profile |
|---|---|---|
| Inpatient institutional | `claims_inpatient`, `claims_inpatient_lines` | [C4BB ExplanationOfBenefit Inpatient Institutional](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Inpatient-Institutional.html) |
| Outpatient institutional | `claims_outpatient`, `claims_outpatient_lines` | [C4BB ExplanationOfBenefit Outpatient Institutional](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Outpatient-Institutional.html) |
| Professional and non-clinician | `claims_professional`, `claims_professional_lines` | [C4BB ExplanationOfBenefit Professional NonClinician](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Professional-NonClinician.html) |
| Pharmacy | `claims_pharmacy`, `claims_pharmacy_lines` | [C4BB ExplanationOfBenefit Pharmacy](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Pharmacy.html) |
| Oral | `claims_oral`, `claims_oral_lines` | [C4BB ExplanationOfBenefit Oral](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Oral.html) |

All five profiles derive from one abstract parent, [C4BB ExplanationOfBenefit](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit.html). The columns it fixes appear in every claim and every lines file and are documented once, on [Explanation of Benefit](explanation-of-benefit.md). Each claim-type page then lists only what that type adds.

## Data conventions

| Rule | Detail |
|---|---|
| Scope | Adjudicated claims only, including denied claims and claims under appeal, and encounter records from capitated providers. Prior authorizations and predeterminations are not claims and travel in their own feed. |
| History | Date of service on or after January 1, 2016. Send active and cancelled claims; `status` marks which is which. |
| Delivery | One historical backfill, then deltas carrying only claims new or changed since your last successful load. A claim is the unit of delivery: when a claim appears in a delta, send its header row and all of its lines, and the previous set of lines is replaced. |
| Keys | `record_id` on a claim is your claim control number and stays stable across adjustments to the same claim. An adjusted claim that receives a new number is a new record that names the old one in `related_claim_ids`. |
| References | Members, coverage, practitioners, organizations and locations are keys into the other feeds, defined once there: `patient_identifier` from `patients`, `coverage_id` from `coverage`, `*_npi` from `practitioners` and `organizations`. A provider named on a claim must exist in those datasets even when out of network. |
| Amounts | Decimal, US dollars, no currency symbol or thousands separator. A blank cell means the amount does not apply to the claim; `0.00` means it applies and is zero. |
| Codes | Send the code, not the description. Every coded column has a companion `_system` column; leave it blank to accept the default named in that column's row. Payerbox derives the label from its terminology service. Several claim code systems are licensed (CPT, NUBC, X12 CARC and RARC, NCPDP, CDT), and CARIN requires each implementer to hold the license for every code system it uses. |
| Multiple values | `;`-separated, positionally aligned across companion columns. |
| Dates | `date` columns are `YYYY-MM-DD`. `datetime` columns are ISO 8601 with a timezone offset. |
| PHI | Claims carry protected health and financial information. Delivery is encrypted in transit and at rest under the executed BAA. |

The financial columns are served to the member. Provider Access and Payer-to-Payer serve the same claims through the non-financial profiles, so amounts are dropped at export and you do not prepare a second feed.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
