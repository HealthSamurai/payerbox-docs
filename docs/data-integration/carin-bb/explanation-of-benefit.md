---
description: >-
  The columns every claim and every claim line carries, mapped to the abstract
  CARIN Blue Button STU 2.1.0 C4BB ExplanationOfBenefit profile.
---

# Explanation of Benefit

## Datasets

[CARIN Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/) defines one abstract profile, [C4BB ExplanationOfBenefit](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit.html), and derives the five claim-type profiles from it. No resource is built from the abstract profile directly; it fixes what every claim shares, and that is what this page documents. The columns below appear in every `claims_<type>` file and every `claims_<type>_lines` file. The claim-type pages list only the columns their profile adds.

| Dataset | CARIN BB STU 2.1.0 target profile |
|---|---|
| `claims_<type>` | one of the five [ExplanationOfBenefit profiles](README.md#datasets), by claim type |
| `claims_<type>_lines` | `ExplanationOfBenefit.item` of the same profile |

The two templates below carry exactly these shared columns. Each claim-type page ships its own pair of templates, which add that type's columns to them.

## claims

One row per adjudicated claim. The claim type and the profile are decided by which file the row is in, so there is no claim-type column: a row in `claims_pharmacy` becomes a Pharmacy ExplanationOfBenefit with `type` = `pharmacy` and `use` = `claim`.

{% file src="../../assets/data-integration/claims.c41e8fab.csv" %}
claims.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your claim control number, stable across adjustments to the same claim [C4BBClaimIdentifierType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimIdentifierType%7C2.1.0) | `CLM-0001` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `coverage_id` | Yes | key from `coverage`, the plan the claim was adjudicated against | `COV-0001` |
| `payer_org_npi` | Yes | 10 digits, or your payer id; the same payer named on that coverage | `9999999993` |
| `billing_provider_npi` | Yes | 10 digits; key from `practitioners` or `organizations` | `9999999991` |
| `status` | Yes | `active`, `cancelled` [explanationofbenefit-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/explanationofbenefit-status%7C4.0.1) | `active` |
| `outcome` | Yes | `complete`, `partial`, `error`, `queued` [remittance-outcome](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/remittance-outcome%7C4.0.1) | `complete` |
| `billable_period_start` | Yes | date; statement covers from date | `2026-02-03` |
| `billable_period_end` | Recommended | date; statement covers through date | `2026-02-09` |
| `adjudication_date` | Yes | date the claim was adjudicated | `2026-02-20` |
| `payee_type` | Recommended | `subscriber`, `provider`, `beneficiary`, `other` [C4BBPayeeType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayeeType%7C2.1.0) | `provider` |
| `payee_npi` | If `payee_type` is `other` | 10 digits; key from `practitioners` or `organizations` | `9999999994` |
| `related_claim_ids` | If adjusted | `;`-separated `record_id` values of the claims this one adjusts or is adjusted by | `CLM-0000` |
| `related_relationships` | If adjusted | `prior`, `replacedby`, `;`-separated, aligned with `related_claim_ids` [C4BBRelatedClaimRelationshipCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBRelatedClaimRelationshipCodes%7C2.1.0) | `prior` |
| `payment_status` | Recommended | `paid`, `denied`, `partiallypaid` [C4BBPayerClaimPaymentStatusCode](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerClaimPaymentStatusCode%7C2.1.0) | `paid` |
| `payment_date` | If available | date the payment was issued | `2026-02-22` |
| `payment_amount` | If available | decimal | `18200.00` |
| `process_note_<n>` | If available | free text; `<n>` starts at 1 and lines refer to it in `note_numbers` | `Processed as primary` |
| amount columns | See [Amount columns](#amount-columns) | claim-level totals, one column per category | |
| `last_updated` | Yes | datetime the claim last changed in your system, or its creation time if never changed | `2026-02-20T18:05:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this claim and all of its lines | `true` |

- `record_id` becomes the claim's unique identifier, typed `uc`, the payer-assigned claim id. CARIN expects the number a member sees on a paper EOB. Keep it stable: a corrected version of the same claim keeps its `record_id` and is an update. An adjustment that your system numbers as a new claim is a new record, and the two point at each other through `related_claim_ids`.
- `status` is `active` for a claim in force and `cancelled` for one voided or reversed. The value set also has `draft` and `entered-in-error`; CARIN does not expect either on an adjudicated claim, so a row with them is reported back rather than published.
- `outcome` is the adjudication result. `complete` is the expected value for a processed claim, paid or denied; a denial is `complete` with a `payment_status` of `denied`. `partial` and `queued` describe a claim still in process.
- `payer_org_npi` and `coverage_id` must agree: the payer on the claim is the payer on the coverage it was adjudicated against. Payerbox sets that coverage as the focal insurance on the resource.
- `billing_provider_npi` is the party that submitted the claim. Whether it becomes a Practitioner or an Organization reference is decided by which dataset defines that NPI, so a provider named here must exist in `practitioners` or `organizations`, in network or not.
- `payee_type` says who was paid. `subscriber` and `provider` need no `payee_npi`; `beneficiary` resolves to the patient; `other` must name the party in `payee_npi`, or the row is rejected.
- `related_relationships` are read from the current claim's point of view: `prior` means the claim in `related_claim_ids` is the one this claim adjusts; `replacedby` means this claim has itself been adjusted by that one. Name the immediately preceding or following claim, not the first or the last in a chain.
- `payment_status` is the claim-level paid, denied or partially paid decision. It is separate from `outcome`, which says whether adjudication finished.
- `last_updated` is mandatory on every claim: CARIN requires `meta.lastUpdated` on each resource, and it also builds the Provenance record.
- The template rows show the cases that matter: a paid two-line claim (`CLM-0001`), a denial with two process notes (`CLM-0002`), an adjustment pair where the cancelled original and its replacement name each other (`CLM-0003`, `CLM-0004`), a payment to a third party through `payee_type` = `other` (`CLM-0005`), and a retraction (`CLM-0006`). Their keys resolve against the `patients`, `coverage`, `practitioners` and `organizations` templates.

## claims lines

One row per service line. A claim with three service lines has three rows carrying the same `claim_record_id`. Lines have no `is_deleted`: a claim is delivered as a whole, so re-sending it replaces its previous lines, and retracting the claim retracts them.

{% file src="../../assets/data-integration/claims_lines.5fcacce3.csv" %}
claims_lines.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `claim_record_id` | Yes | the claim's `record_id` | `CLM-0001` |
| `line_number` | Yes | positive integer, unique within the claim; your line identification number | `1` |
| `service_code` | Yes | the billed product or service, with `service_code_system`; the claim-type page names the systems it accepts | `99213` |
| `service_code_system` | Yes | code system URI of `service_code` | `http://www.ama-assn.org/go/cpt` |
| `service_date_start` | Recommended | date; the claim-type page says when it is required | `2026-02-03` |
| `service_date_end` | If a period | date; blank for a single-day service | `2026-02-03` |
| `note_numbers` | If available | `;`-separated `<n>` values of `process_note_<n>` columns on the claim | `1` |
| amount columns | See [Amount columns](#amount-columns) | line-level adjudication, one column per category | |

- `line_number` becomes `item.sequence`. Send the number your adjudication system assigned; it is how the line is identified on the paper EOB and across deliveries.
- `service_code` is the one field every line must have. The abstract profile does not fix its code system; each claim-type page does (CPT and HCPCS for professional, revenue codes for institutional, NDC for pharmacy, CDT for oral).
- `note_numbers` link a line to the claim's process notes. A number with no matching `process_note_<n>` column on the claim is reported.

## Amount columns

The same amount columns appear in both files. On a claim they become the claim totals; on a line they become that line's adjudication. Each column is one category from [C4BBAdjudication](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBAdjudication%7C2.1.0); the claim-type pages say which of them are required for that type. All are decimal, US dollars.

| Column | Category | Code system |
|---|---|---|
| `submitted_amount` | `submitted` Submitted Amount, what the provider billed | `http://terminology.hl7.org/CodeSystem/adjudication` |
| `eligible_amount` | `eligible` Eligible Amount, the allowed amount | `http://terminology.hl7.org/CodeSystem/adjudication` |
| `deductible_amount` | `deductible` Deductible | `http://terminology.hl7.org/CodeSystem/adjudication` |
| `copay_amount` | `copay` CoPay | `http://terminology.hl7.org/CodeSystem/adjudication` |
| `benefit_amount` | `benefit` Benefit Amount | `http://terminology.hl7.org/CodeSystem/adjudication` |
| `coinsurance_amount` | `coinsurance` Coinsurance | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `noncovered_amount` | `noncovered` Noncovered | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `paid_to_provider_amount` | `paidtoprovider` Paid to provider | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `paid_to_patient_amount` | `paidtopatient` Paid to patient | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `paid_by_patient_amount` | `paidbypatient` Paid by patient | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `paid_by_patient_cash_amount` | `paidbypatientcash` Paid by patient, cash | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `paid_by_patient_other_amount` | `paidbypatientother` Paid by patient, other | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `member_liability_amount` | `memberliability` Member liability | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `discount_amount` | `discount` Discount | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `prior_payer_paid_amount` | `priorpayerpaid` Prior payer paid | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |
| `drug_cost_amount` | `drugcost` Drug cost | `http://hl7.org/fhir/us/carin-bb/CodeSystem/C4BBAdjudication` |

- A blank cell means the category does not apply to the claim or line and no adjudication entry is built. `0.00` means it applies and the amount is zero, and an entry is built. A deductible that was not charged is `0.00`, not blank.
- Claim totals are the payer's figures, not sums Payerbox computes from the lines. Send them as adjudicated.
- The abstract profile allows every category at both levels: the line and total bindings use the same value set. Which columns a claim type requires, and on which file, is stated on that type's page; a column that page does not list is accepted and published if you send it.

These resources are served by [Patient Access](../../interop-apis/patient-access.md) with amounts, and by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
