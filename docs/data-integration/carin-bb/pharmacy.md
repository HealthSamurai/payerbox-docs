---
description: >-
  Columns for retail pharmacy claims, mapped to the CARIN Blue Button STU 2.1.0
  C4BB ExplanationOfBenefit Pharmacy profile.
---

# Pharmacy

## Datasets

A pharmacy claim is one dispensing event from a retail, mail-order or specialty pharmacy, adjudicated in the NCPDP telecommunication format rather than on a paper form. [CARIN Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/) profiles it twice: the financial profile with amounts for Patient Access, and its parent Basis profile without amounts for Provider Access and Payer-to-Payer. You deliver one pair of files.

| Dataset | CARIN BB STU 2.1.0 target profile |
|---|---|
| [`claims_pharmacy`](#claims_pharmacy) | [C4BB ExplanationOfBenefit Pharmacy](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Pharmacy.html), served without amounts as [Pharmacy Basis](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Pharmacy-Basis.html) |
| [`claims_pharmacy_lines`](#claims_pharmacy_lines) | `ExplanationOfBenefit.item` of the same profile |

Both files carry every column from [Explanation of Benefit](explanation-of-benefit.md). This page lists what the pharmacy profile adds and where it tightens a shared rule. A pharmacy claim almost always has one line, the drug dispensed; the split into two files is kept so every claim type has the same shape.

## claims_pharmacy

One row per pharmacy claim.

{% file src="../../assets/data-integration/claims_pharmacy.d8d6f730.csv" %}
claims_pharmacy.csv Data template with example rows
{% endfile %}

### Prescription

The NCPDP fields the profile requires of every pharmacy claim. Each is a `supportingInfo` entry tagged with its [C4BBSupportingInfoType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBSupportingInfoType%7C2.1.0) category. Four of them are mandatory, which no other claim type asks of its supporting information.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `claim_received_date` | Recommended | date the payer received the claim | `2026-03-02` |
| `days_supply` | Yes | integer; days of medication dispensed (NCPDP 405-D5) | `30` |
| `daw_code` | Yes | one character; dispense-as-written or product-selection code (NCPDP 408-D8) [NCPDPDispensedAsWrittenOrProductSelectionCode](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-NCPDPDispensedAsWrittenOrProductSelectionCode.html) | `0` |
| `refill_number` | Yes | integer; which fill this is, `0` for the original (NCPDP 403-D3) | `0` |
| `refills_authorized` | Yes | integer; refills the prescriber authorized (NCPDP 415-DF) | `5` |
| `brand_generic_indicator` | Recommended | one character; how the plan adjudicated the drug (NCPDP 686) [NCPDPBrandGenericIndicator](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-NCPDPBrandGenericIndicator.html) | `2` |
| `rx_origin_code` | Recommended | one digit; how the prescription reached the pharmacy (NCPDP 419-DJ) [NCPDPPrescriptionOriginCode](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-NCPDPPrescriptionOriginCode.html) | `3` |
| `compound_code` | Recommended | `0` not specified, `1` not a compound, `2` compound (NCPDP 406-D6) [NCPDPCompoundCode](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-NCPDPCompoundCode.html) | `1` |

- `days_supply`, `daw_code`, `refill_number` and `refills_authorized` are mandatory: CARIN requires all four on every pharmacy claim, so a row missing any of them is rejected. `refill_number` `0` is the original fill, not a missing value.
- `compound_code` decides what the line carries. `0` or `1`: the line's `service_code` is the NDC dispensed. `2`: the line's `service_code` is blank, and the ingredients travel in the line's compound columns.
- The NCPDP code sets are licensed, so their value sets are linked to the IG rather than expanded here. Send the codes as your adjudication system holds them.

### Care team

Bound to [C4BBClaimPharmacyTeamRole](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimPharmacyTeamRole%7C2.1.0), which has two roles.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `prescribing_provider_npi` | Recommended | 10 digits; key from `practitioners`; who wrote the prescription | `9999999991` |
| `primary_provider_npi` | If available | 10 digits; key from `practitioners` | |

- `billing_provider_npi` from the shared columns is the pharmacy, an organization. The profile also allows a practitioner there for the rare individually enrolled dispenser.
- The prescriber is not the dispenser. Send the prescriber's NPI here even when the pharmacy is the billing provider; it is how a member sees who prescribed what.

### Adjudication

| Column | Required | Format / values | Example |
|---|---|---|---|
| `benefit_payment_status` | Yes | `innetwork`, `outofnetwork`, `other`; how the claim was paid against the member's pharmacy benefit [C4BBPayerBenefitPaymentStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerBenefitPaymentStatus%7C2.1.0) | `innetwork` |
| `billing_network_status` | Recommended | `innetwork`, `outofnetwork`; whether the pharmacy had a contract with the plan on the fill date [C4BBPayerProviderNetworkStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerProviderNetworkStatus%7C2.1.0) | `innetwork` |

- `benefit_payment_status` sits on the claim row, as on the institutional claims. Pharmacy has no claim-level adjustment reasons: a rejected claim carries its NCPDP reject code on the line.
- `payment_date` from the shared columns is must-support here. Send it whenever the claim was paid.
- No diagnosis columns. The pharmacy profile does not ask for diagnoses, and NCPDP claims rarely carry them.

### Amounts

The shared [amount columns](explanation-of-benefit.md#amount-columns) on the claim row become the claim totals, which are mandatory: at least one must be filled. The pharmacy profile has no claim-level adjudication amounts; line amounts are mandatory, see below. `drug_cost_amount` is the ingredient cost and is the one category that exists for pharmacy claims first; send it separately from `eligible_amount`, which includes the dispensing fee.

### Set by Payerbox

| Element | Value |
|---|---|
| `type` | `pharmacy` |
| `use` | `claim` |
| `meta.profile` | the Pharmacy canonical with version `2.1.0` |
| `identifier.type` | `uc` |
| `insurance.focal` | `true` on the coverage from `coverage_id` |
| `item.productOrService` | the literal `compound` when `compound_code` is `2` |
| `careTeam.sequence`, `supportingInfo.sequence`, `item.detail.sequence` | numbered from the columns and list positions |

## claims_pharmacy_lines

One row per dispensed product. In practice one per claim; a compound is still one line, with its ingredients listed on it.

{% file src="../../assets/data-integration/claims_pharmacy_lines.3e4624ce.csv" %}
claims_pharmacy_lines.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `service_code` | Yes, blank only for a compound | the NDC dispensed, 11 digits with or without hyphens [FDANDCOrCompound](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/FDANDCOrCompound%7C2.1.0) | `00093-1058-01` |
| `service_code_system` | No | `http://hl7.org/fhir/sid/ndc` is the only system here (assumed when empty) | |
| `service_date_start` | Yes | date the prescription was filled | `2026-03-01` |
| `quantity` | Recommended | decimal; quantity dispensed (NCPDP 442-E7) | `30` |
| `quantity_unit` | If available | unit of the quantity: `EA`, `GM`, `ML` (NCPDP 600-28) | `EA` |
| `compound_ingredient_ndcs` | If `compound_code` is `2` | NDCs of the ingredients, `;`-separated [FDANationalDrugCode](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/FDANationalDrugCode%7C2.1.0) | `00093-1058-01;00054-0222-20` |
| `compound_ingredient_quantities` | If `compound_code` is `2` | decimal quantities, `;`-separated, aligned with `compound_ingredient_ndcs` | `30;15` |
| `reject_reason_code` | If rejected | NCPDP reject code (NCPDP 511-FB) [NCPDPRejectCode](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-NCPDPRejectCode.html) | `75` |
| amount columns | Yes, at least one | line-level adjudication, one column per category | |

- `service_code` is the NDC as your system holds it. Both the 11-digit form with hyphens (`00093-1058-01`) and without (`00093105801`) are in the value set; send one form consistently.
- A compound has no single NDC. Leave `service_code` blank, set `compound_code` `2` on the claim row, and list every ingredient with its quantity in the two compound columns; each becomes an `item.detail` under the line. A line with a blank `service_code` on a claim whose `compound_code` is not `2` is rejected.
- `service_date_start` overrides the shared "Recommended": the fill date is mandatory, and a single date. Leave `service_date_end` blank.
- `reject_reason_code` replaces the CARC and RARC adjustment reasons of the other claim types; the pharmacy profile allows one NCPDP reject code per line and no other reason. A rejected claim carries `submitted_amount`, `0.00` in `benefit_amount`, the rejected amount in `noncovered_amount` and the code here.
- At least one amount is mandatory on every line. `drug_cost_amount` belongs on the line as well as in the totals.

These resources are served by [Patient Access](../../interop-apis/patient-access.md) with amounts, and by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
