---
description: >-
  Columns for professional and non-clinician claims, mapped to the CARIN Blue
  Button STU 2.1.0 C4BB ExplanationOfBenefit Professional NonClinician profile.
---

# Professional NonClinician

## Datasets

A professional claim is a CMS-1500 bill from a practitioner, group, supplier or transportation provider: office visits, surgery, therapy, durable medical equipment, ambulance. Vision claims use the same profile. [CARIN Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/) profiles it twice: the financial profile with amounts for Patient Access, and its parent Basis profile without amounts for Provider Access and Payer-to-Payer. You deliver one pair of files.

| Dataset | CARIN BB STU 2.1.0 target profile |
|---|---|
| [`claims_professional`](#claims_professional) | [C4BB ExplanationOfBenefit Professional NonClinician](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Professional-NonClinician.html), served without amounts as [Professional NonClinician Basis](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Professional-NonClinician-Basis.html) |
| [`claims_professional_lines`](#claims_professional_lines) | `ExplanationOfBenefit.item` of the same profile |

Both files carry every column from [Explanation of Benefit](explanation-of-benefit.md). This page lists what the professional profile adds and where it tightens a shared rule. The biggest difference from the institutional claims: adjudication happens on the lines. Every line carries its own amounts and its own benefit payment status, and the claim row carries only totals.

## claims_professional

One row per professional claim.

{% file src="../../assets/data-integration/claims_professional.0111df8b.csv" %}
claims_professional.csv Data template with example rows
{% endfile %}

### Claim

| Column | Required | Format / values | Example |
|---|---|---|---|
| `claim_type` | If vision | `vision` for a vision claim (`professional` assumed when empty) [C4BBProfessionalAndNonClinicianClaimType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBProfessionalAndNonClinicianClaimType%7C2.1.0) | `vision` |
| `claim_received_date` | Recommended | date the payer received the claim | `2026-03-10` |
| `service_facility_npi` | If not the billing provider's place | 10 digits; key from `organizations`; the facility where the service was rendered when it is neither the billing provider nor the patient's home | `9999999994` |
| `medical_record_number` | If available | the provider's medical record number on the claim | `MR-88213` |
| `patient_account_number` | If available | the provider's patient account number on the claim | `ACC-501377` |

- `claim_type` exists because CARIN serves vision claims through this profile with `type` = `vision`. A vision claim may leave `service_code` blank on its lines; a professional claim may not.
- `billing_provider_npi` may resolve to either a Practitioner or an Organization here, unlike the institutional claims. A solo practitioner bills under their own NPI; a group or a supplier bills under the organization's.
- `service_facility_npi` is a place, not a person: a hospital, nursing home, laboratory or shelter where the practitioner saw the patient. It must be defined in `organizations`.

### Care team

One column per role, bound to [C4BBClaimProfessionalAndNonClinicianCareTeamRole](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimProfessionalAndNonClinicianCareTeamRole%7C2.1.0).

| Column | Required | Format / values | Example |
|---|---|---|---|
| `rendering_provider_npi` | Recommended | 10 digits; key from `practitioners`; who performed the service | `9999999991` |
| `rendering_provider_taxonomy` | If available | NUCC taxonomy code the rendering provider billed under [Healthcare Provider Taxonomy](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.114222.4.11.1066&server=https://tx.fhir.org/r4) | `207R00000X` |
| `referring_provider_npi` | If available | 10 digits; key from `practitioners` | `9999999991` |
| `supervising_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `primary_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `purchased_service_provider_npi` | If available | 10 digits; key from `practitioners` or `organizations`; the provider a service was purchased from, such as an outside laboratory | |

- CARIN fixes that rendering, referring, supervising and primary must resolve to a Practitioner. Purchased service may be either.
- `rendering_provider_taxonomy` becomes the care-team qualification, the specialty the claim was billed under. It can differ from the specialty in `practitioners`, so it is sent with the claim.

### Diagnoses

Aligned `;`-separated lists, the position being the diagnosis sequence. Lines point at these positions through `diagnosis_sequences`.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `diagnosis_codes` | Yes | ICD-10-CM codes, `;`-separated, up to twelve [CDCICD910CMDiagnosisCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/CDCICD910CMDiagnosisCodes%7C2.1.0) | `E11.9;I10` |
| `diagnosis_types` | Yes | `principal`, `secondary`, aligned with `diagnosis_codes` [C4BBClaimProfessionalAndNonClinicianDiagnosisType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimProfessionalAndNonClinicianDiagnosisType%7C2.1.0) | `principal;secondary` |
| `diagnosis_code_system` | If not ICD-10-CM | `http://hl7.org/fhir/sid/icd-9-cm` for services before October 2015 (ICD-10-CM assumed when empty) | |

- Exactly one position is `principal`, sent first. Every other position is `secondary`; the professional profile has no admitting, external cause or reason-for-visit types.

### Network status

| Column | Required | Format / values | Example |
|---|---|---|---|
| `billing_network_status` | Recommended | `innetwork`, `outofnetwork`; whether the billing provider had a contract with the plan on the date of service [C4BBPayerProviderNetworkStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerProviderNetworkStatus%7C2.1.0) | `innetwork` |
| `rendering_network_status` | Recommended | `innetwork`, `outofnetwork`; the same for the rendering provider | `innetwork` |

- The benefit payment status, mandatory on every line of a professional claim, is a line column. The claim row has no benefit payment status and no claim-level adjustment reasons; the profile puts both on the lines.

### Transportation

For ambulance and other transportation claims. These four describe the whole trip and sit on the claim row; the pickup, drop-off and distance of each leg sit on the [line](#claims_professional_lines). Payerbox links the claim-level entries to every line of the claim, which is what CARIN requires of transportation information.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `patient_weight_lb` | If ambulance | decimal, pounds | `160` |
| `ambulance_transport_reason` | If ambulance | one-letter X12 ambulance transport reason code [C4BBAmbulanceTransportReasonCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-C4BBAmbulanceTransportReasonCodes.html) | `B` |
| `round_trip_purpose` | If a round trip | free text | `Dialysis and return home` |
| `stretcher_purpose` | If a stretcher | free text | `Patient unable to sit` |

### Amounts

The shared [amount columns](explanation-of-benefit.md#amount-columns) on the claim row become the claim totals, which are mandatory: at least one must be filled. The professional profile has no claim-level adjudication amounts, so the claim row's amounts are never anything but totals. Line amounts are mandatory too, see below.

### Set by Payerbox

| Element | Value |
|---|---|
| `type` | `professional`, or `vision` when `claim_type` says so |
| `use` | `claim` |
| `meta.profile` | the Professional NonClinician canonical with version `2.1.0` |
| `identifier.type` | `uc` |
| `insurance.focal` | `true` on the coverage from `coverage_id` |
| `careTeam.sequence`, `supportingInfo.sequence`, `diagnosis.sequence`, `item.informationSequence` | numbered from the columns and list positions |

## claims_professional_lines

One row per service line. Each line is adjudicated on its own, so each carries a place of service, a benefit payment status and its amounts.

{% file src="../../assets/data-integration/claims_professional_lines.a63c50b8.csv" %}
claims_professional_lines.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `service_code` | Yes, blank only on vision | CPT or HCPCS code, with `service_code_system` [AMACPTCMSHCPCSProcedureCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AMACPTCMSHCPCSProcedureCodes.html) | `99214` |
| `service_code_system` | If HCPCS | `https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets` (CPT, `http://www.ama-assn.org/go/cpt`, assumed when empty) | |
| `modifier_codes` | If billed | CPT or HCPCS modifiers, `;`-separated, same system as `service_code` [AMACPTCMSHCPCSModifiers](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/AMACPTCMSHCPCSModifiers%7C2.1.0) | `25` |
| `service_date_start` | Yes | date the service began; CMS-1500 item 24A | `2026-03-05` |
| `service_date_end` | If a period | date the service ended; blank for a single-day service | |
| `place_of_service` | Yes | two-digit CMS place-of-service code [CMSPlaceofServiceCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-CMSPlaceofServiceCodes.html) | `11` |
| `quantity` | Recommended | decimal; units, visits or miles billed on the line | `1` |
| `diagnosis_sequences` | If available | positions in the claim's `diagnosis_codes` this line was billed against, `;`-separated | `1;2` |
| `benefit_payment_status` | Yes | `innetwork`, `outofnetwork`, `other`; how this line was paid against the member's benefits [C4BBPayerBenefitPaymentStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerBenefitPaymentStatus%7C2.1.0) | `innetwork` |
| `allowed_units` | If adjudicated | decimal; units the payer allowed | `1` |
| `adjustment_reason_code` | If reduced or denied | one CARC or RARC code explaining the noncovered amount [X12 CARC and RARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `97` |
| `adjustment_reason_system` | If RARC | `https://x12.org/codes/remittance-advice-remark-codes` (CARC, `https://x12.org/codes/claim-adjustment-reason-codes`, assumed when empty) | |
| `pickup_location` | If ambulance | free text; where the patient was picked up on this leg | `Patient home; Anytown; NY 12345` |
| `dropoff_location` | If ambulance | free text; where the patient was dropped off on this leg | `Anytown Medical Group; Anytown; NY 12345` |
| `transport_distance_miles` | If ambulance | decimal, miles travelled on this leg | `21` |
| amount columns | Yes, at least one | line-level adjudication, one column per category | |

- `service_code` is required on every professional line. Only a vision claim, marked by `claim_type`, may leave it blank, and Payerbox then publishes the `not-applicable` marker CARIN provides.
- `place_of_service` is mandatory and drives whether the line was an office visit, a home visit, an ambulance run or a hospital service. Send the two-digit CMS code, not a description.
- `benefit_payment_status` and at least one amount are mandatory on every line. A line with neither describes nothing and is rejected. A denied line carries `submitted_amount`, `0.00` in `benefit_amount`, the denied amount in `noncovered_amount` and the reason in `adjustment_reason_code`.
- `adjustment_reason_code` is a single code here, not a list: the professional profile allows one adjustment reason per line. Where your system holds several, send the CARC that determined the adjustment.
- The three transportation columns repeat per leg: an ambulance round trip is two lines, each with its own pickup, drop-off and distance. Send them only on transportation lines; a value on an office-visit line is rejected.

These resources are served by [Patient Access](../../interop-apis/patient-access.md) with amounts, and by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
