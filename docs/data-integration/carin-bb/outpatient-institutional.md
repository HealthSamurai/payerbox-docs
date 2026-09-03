---
description: >-
  Columns for outpatient institutional claims, mapped to the CARIN Blue Button
  STU 2.1.0 C4BB ExplanationOfBenefit Outpatient Institutional profile.
---

# Outpatient Institutional

## Datasets

An outpatient institutional claim is a facility bill (UB-04) for services without an overnight stay: emergency room, hospital clinic, ambulatory surgery, therapy, dialysis, observation. It is the institutional sibling of the [inpatient claim](inpatient-institutional.md) and shares its UB-04 columns, minus the stay. [CARIN Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/) profiles it twice: the financial profile with amounts for Patient Access, and its parent Basis profile without amounts for Provider Access and Payer-to-Payer. You deliver one pair of files.

| Dataset | CARIN BB STU 2.1.0 target profile |
|---|---|
| [`claims_outpatient`](#claims_outpatient) | [C4BB ExplanationOfBenefit Outpatient Institutional](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Outpatient-Institutional.html), served without amounts as [Outpatient Institutional Basis](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Outpatient-Institutional-Basis.html) |
| [`claims_outpatient_lines`](#claims_outpatient_lines) | `ExplanationOfBenefit.item` of the same profile |

Both files carry every column from [Explanation of Benefit](explanation-of-benefit.md). This page lists what the outpatient profile adds and where it tightens a shared rule.

## claims_outpatient

One row per outpatient claim.

{% file src="../../assets/data-integration/claims_outpatient.28c2cb29.csv" %}
claims_outpatient.csv Data template with example rows
{% endfile %}

### Bill

The UB-04 fields the profile keeps for an outpatient visit. Each is a `supportingInfo` entry tagged with its [C4BBSupportingInfoType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBSupportingInfoType%7C2.1.0) category. There is no admission period and no DRG.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `claim_received_date` | Recommended | date the payer received the claim | `2026-04-14` |
| `type_of_bill` | Recommended | UB-04 FL 04, as printed on the bill [AHANUBCTypeOfBill](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCTypeOfBill.html) | `0131` |
| `point_of_origin` | Recommended | UB-04 FL 15 [AHANUBCPointOfOriginForAdmissionOrVisit](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCPointOfOriginForAdmissionOrVisit.html) | `7` |
| `admission_type` | Recommended | UB-04 FL 14 priority of the visit [AHANUBCPriorityTypeOfAdmissionOrVisit](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCPriorityTypeOfAdmissionOrVisit.html) | `1` |
| `discharge_status` | Recommended | UB-04 FL 17 [AHANUBCPatientDischargeStatus](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCPatientDischargeStatus.html) | `01` |
| `medical_record_number` | If available | the provider's medical record number on the claim | `MR-88213` |
| `patient_account_number` | If available | the provider's patient account number on the claim | `ACC-472015` |

- `point_of_origin` and `admission_type` keep their inpatient names because they are the same UB-04 form locators. On an outpatient bill they describe how the visit started, and the newborn rule still applies: an `admission_type` of `4` requires a code from the newborn point-of-origin set.
- The NUBC code sets are licensed, so their value sets are linked to the IG rather than expanded here.

### Care team

Same roles and same columns as the inpatient claim, bound to [C4BBClaimInstitutionalCareTeamRole](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimInstitutionalCareTeamRole%7C2.1.0).

| Column | Required | Format / values | Example |
|---|---|---|---|
| `attending_provider_npi` | Recommended | 10 digits; key from `practitioners` | `9999999991` |
| `referring_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `operating_provider_npi` | If a procedure | 10 digits; key from `practitioners` | |
| `other_operating_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `rendering_provider_npi` | If available | 10 digits; key from `organizations` | |
| `primary_provider_npi` | If available | 10 digits; key from `practitioners` | |

- `billing_provider_npi` must be an organization, the facility that billed. Attending, referring and primary must resolve to a Practitioner and rendering to an Organization; operating and other operating may be either.

### Diagnoses

Aligned `;`-separated lists, the position being the diagnosis sequence. Outpatient claims have no present-on-admission indicator, and they add one type the inpatient claim lacks: the patient's reason for the visit.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `diagnosis_codes` | Yes | ICD-10-CM codes, `;`-separated [CDCICD910CMDiagnosisCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/CDCICD910CMDiagnosisCodes%7C2.1.0) | `R07.9;I10;R07.9` |
| `diagnosis_types` | Yes | `principal`, `other`, `externalcauseofinjury`, `patientreasonforvisit`, aligned with `diagnosis_codes` [C4BBClaimOutpatientInstitutionalDiagnosisType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimOutpatientInstitutionalDiagnosisType%7C2.1.0) | `principal;other;patientreasonforvisit` |
| `diagnosis_code_system` | If not ICD-10-CM | `http://hl7.org/fhir/sid/icd-9-cm` for visits coded before October 2015 (ICD-10-CM assumed when empty) | |

- Exactly one position must be `principal`, sent first. `patientreasonforvisit` is UB-04 FL 70 and may repeat a code already listed as principal; send both positions.
- ICD-10-PCS procedures are not collected on outpatient claims. What was done is carried by the CPT and HCPCS codes on the lines, where the profile expects it.

### Adjudication

| Column | Required | Format / values | Example |
|---|---|---|---|
| `benefit_payment_status` | Yes | `innetwork`, `outofnetwork`, `other` [C4BBPayerBenefitPaymentStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerBenefitPaymentStatus%7C2.1.0) | `innetwork` |
| `billing_network_status` | Recommended | `innetwork`, `outofnetwork`; whether the billing facility had a contract with the plan on the date of service [C4BBPayerProviderNetworkStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerProviderNetworkStatus%7C2.1.0) | `innetwork` |
| `adjustment_reason_codes` | If reduced or denied | CARC or RARC codes explaining the noncovered amount, `;`-separated [X12 CARC and RARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `18` |
| `adjustment_reason_system` | If RARC | `https://x12.org/codes/remittance-advice-remark-codes` (CARC, `https://x12.org/codes/claim-adjustment-reason-codes`, assumed when empty) | |

- `payment_date` from the shared columns is must-support here. Send it whenever the claim was paid.

### Amounts

The shared [amount columns](explanation-of-benefit.md#amount-columns) apply, with the same two institutional rules as inpatient: totals are mandatory, and adjudication amounts sit either on every line or on the claim row, never both. When the lines carry no amounts, Payerbox publishes the claim row's totals as the claim-level adjudication.

### Set by Payerbox

| Element | Value |
|---|---|
| `type` | `institutional` |
| `subType` | `outpatient` |
| `use` | `claim` |
| `meta.profile` | the Outpatient Institutional canonical with version `2.1.0` |
| `identifier.type` | `uc` |
| `insurance.focal` | `true` on the coverage from `coverage_id` |
| `careTeam.sequence`, `supportingInfo.sequence`, `diagnosis.sequence` | numbered from the columns and list positions |

## claims_outpatient_lines

One row per revenue line. Unlike inpatient, every outpatient line carries its own date of service, and the revenue code is optional.

{% file src="../../assets/data-integration/claims_outpatient_lines.6ea41aca.csv" %}
claims_outpatient_lines.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `revenue_code` | Recommended | UB-04 FL 42, four characters with the leading zero [AHANUBCRevenueCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCRevenueCodes.html) | `0450` |
| `service_code` | If billed | CPT, HCPCS or HIPPS code on the line, with `service_code_system` [C4BBEOBInstitutionalProcedureCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-C4BBEOBInstitutionalProcedureCodes.html) | `99285` |
| `service_code_system` | If `service_code` | `http://www.ama-assn.org/go/cpt`, `https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets`, `https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/ProspMedicareFeeSvcPmtGen/HIPPSCodes` (CPT assumed when empty) | |
| `modifier_codes` | If billed | CPT or HCPCS modifiers, `;`-separated, same system as `service_code` [AMACPTCMSHCPCSModifiers](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/AMACPTCMSHCPCSModifiers%7C2.1.0) | `GP` |
| `service_date_start` | Yes | date the service on this line was rendered | `2026-04-02` |
| `quantity` | Recommended | decimal; units or visits billed on the line | `1` |
| `allowed_units` | If adjudicated | decimal; units the payer allowed | `1` |
| `adjustment_reason_codes` | If reduced or denied | CARC or RARC codes on the line, `;`-separated [X12 CARC and RARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | |
| `adjustment_reason_system` | If RARC | as on the claim row (CARC assumed when empty) | |

- `service_date_start` overrides the shared "Recommended": the outpatient profile requires a date on every line, and a single date rather than a period. Leave `service_date_end` blank; a multi-day service is one line per day.
- `service_code` keeps the institutional override: a revenue line with no CPT or HCPCS is published with the `not-applicable` marker CARIN provides. Since the revenue code is also optional here, a line must carry at least one of the two, or it describes nothing and is rejected.
- The amount columns follow the claim-or-lines rule: either every line in the claim carries its amounts, or none does.

These resources are served by [Patient Access](../../interop-apis/patient-access.md) with amounts, and by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
