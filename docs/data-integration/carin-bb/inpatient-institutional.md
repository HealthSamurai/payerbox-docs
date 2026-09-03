---
description: >-
  Columns for inpatient institutional claims, mapped to the CARIN Blue Button
  STU 2.1.0 C4BB ExplanationOfBenefit Inpatient Institutional profile.
---

# Inpatient Institutional

## Datasets

An inpatient institutional claim is a facility bill (UB-04) for a stay with an admission and a discharge: hospital, skilled nursing, rehabilitation, psychiatric. [CARIN Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/) profiles it twice. The financial profile carries the amounts and is what Patient Access serves. Its parent, the Basis profile, is the same claim without amounts and is what Provider Access and Payer-to-Payer serve. You deliver one pair of files; Payerbox produces both forms.

| Dataset | CARIN BB STU 2.1.0 target profile |
|---|---|
| [`claims_inpatient`](#claims_inpatient) | [C4BB ExplanationOfBenefit Inpatient Institutional](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Inpatient-Institutional.html), served without amounts as [Inpatient Institutional Basis](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Inpatient-Institutional-Basis.html) |
| [`claims_inpatient_lines`](#claims_inpatient_lines) | `ExplanationOfBenefit.item` of the same profile |

Both files carry every column from [Explanation of Benefit](explanation-of-benefit.md). This page lists what the inpatient profile adds and where it tightens a shared rule.

## claims_inpatient

One row per inpatient claim.

{% file src="../../assets/data-integration/claims_inpatient.15477f6d.csv" %}
claims_inpatient.csv Data template with example rows
{% endfile %}

### Stay

The admission, the bill and the discharge. In FHIR these are `supportingInfo` entries, one per column, each tagged with its [C4BBSupportingInfoType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBSupportingInfoType%7C2.1.0) category.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `claim_received_date` | Recommended | date the payer received the claim | `2026-02-12` |
| `admission_date` | Yes | date; the day the member was admitted, which may precede `billable_period_start` for a continuing stay | `2026-02-03` |
| `discharge_date` | If discharged | date; the day the member was discharged or died. Blank for a stay still open at statement end | `2026-02-09` |
| `type_of_bill` | Recommended | UB-04 FL 04, as printed on the bill [AHANUBCTypeOfBill](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCTypeOfBill.html) | `0111` |
| `point_of_origin` | Recommended | UB-04 FL 15 [AHANUBCPointOfOriginForAdmissionOrVisit](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCPointOfOriginForAdmissionOrVisit.html) | `1` |
| `admission_type` | Recommended | UB-04 FL 14 priority of admission [AHANUBCPriorityTypeOfAdmissionOrVisit](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCPriorityTypeOfAdmissionOrVisit.html) | `1` |
| `discharge_status` | Recommended | UB-04 FL 17 [AHANUBCPatientDischargeStatus](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCPatientDischargeStatus.html) | `01` |
| `drg_code` | Recommended | the DRG the stay was grouped to, with `drg_system` and `drg_version` [CMSMS3MAPAPRDRG](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-CMSMS3MAPAPRDRG.html) | `291` |
| `drg_system` | If not MS-DRG | `http://uri.hddaccess.com/cs/apdrg` AP-DRG, `http://uri.hddaccess.com/cs/aprdrg` APR-DRG (MS-DRG assumed when empty) | |
| `drg_version` | Recommended | grouper version the code belongs to | `43` |
| `medical_record_number` | If available | the provider's medical record number on the claim | `MR-88213` |
| `patient_account_number` | If available | the provider's patient account number on the claim | `ACC-448210` |

- `admission_date` and `discharge_date` are one FHIR element, the admission period. CARIN requires the period on every inpatient claim, so `admission_date` is mandatory even when the bill covers only part of the stay. When a `discharge_date` is present, `discharge_status` should say how the stay ended.
- `type_of_bill` is the four-character code as it appears in FL 04, with the leading zero. The three digits after it are the facility type, the bill classification and the frequency.
- `point_of_origin` values differ for newborn admissions. When `admission_type` is `4` (newborn), send a code from the newborn point-of-origin set, and otherwise from the standard set; CARIN rejects the combination the other way around.
- A DRG is only meaningful with its grouper: `drg_code` `291` is a different diagnosis group under MS-DRG than under APR-DRG. Send `drg_version` whenever your system holds it.
- The NUBC code sets and the DRG groupers are licensed, so their value sets are linked to the IG rather than expanded here. Send the codes as your adjudication system holds them.

### Care team

One column per role. The role is the column name, the value is the provider. Roles are bound to [C4BBClaimInstitutionalCareTeamRole](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimInstitutionalCareTeamRole%7C2.1.0).

| Column | Required | Format / values | Example |
|---|---|---|---|
| `attending_provider_npi` | Recommended | 10 digits; key from `practitioners` | `9999999991` |
| `referring_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `operating_provider_npi` | If a procedure | 10 digits; key from `practitioners` | `9999999991` |
| `other_operating_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `rendering_provider_npi` | If available | 10 digits; key from `organizations` | |
| `primary_provider_npi` | If available | 10 digits; key from `practitioners` | |

- On an institutional claim the `billing_provider_npi` from the shared columns must be an organization, the facility that billed. CARIN restricts the inpatient profile's provider to an Organization, so a row whose billing NPI resolves to a practitioner is rejected.
- CARIN fixes who each role can be: attending, referring and primary must resolve to a Practitioner, rendering to an Organization. Operating and other operating may be either. A role whose NPI is defined in the wrong dataset is reported.

### Diagnoses

An inpatient claim carries a principal diagnosis, optionally an admitting diagnosis, up to twenty-four other diagnoses and external cause of injury codes. They travel as four positionally aligned `;`-separated lists; the position is the diagnosis sequence.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `diagnosis_codes` | Yes | ICD-10-CM codes, `;`-separated [CDCICD910CMDiagnosisCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/CDCICD910CMDiagnosisCodes%7C2.1.0) | `I50.23;N18.4;E11.22` |
| `diagnosis_types` | Yes | `principal`, `admitting`, `other`, `externalcauseofinjury`, aligned with `diagnosis_codes` [C4BBClaimInpatientInstitutionalDiagnosisType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimInpatientInstitutionalDiagnosisType%7C2.1.0) | `principal;other;other` |
| `diagnosis_poa` | Recommended | present-on-admission indicator per diagnosis: `Y`, `N`, `U`, `W`, `1`, aligned; leave a position empty where not reported [CMSPresentOnAdmissionIndicator](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/CMSPresentOnAdmissionIndicator%7C2.1.0) | `Y;Y;N` |
| `diagnosis_code_system` | If not ICD-10-CM | `http://hl7.org/fhir/sid/icd-9-cm` for stays coded before October 2015 (ICD-10-CM assumed when empty) | |

- Exactly one position must be `principal`. Send the principal first: it makes the file readable, and the sequence numbers a member sees on the EOB start from it.
- The same code may appear twice when it is both the admitting and the principal diagnosis. Send both positions; they are distinct entries in FHIR.

### Procedures

Inpatient procedures are ICD-10-PCS, one per position, aligned like the diagnoses.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `procedure_codes` | If any | ICD-10-PCS codes, `;`-separated [CMSICD910PCSProcedureCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-CMSICD910PCSProcedureCodes.html) | `4A023N7;B211YZZ` |
| `procedure_types` | If any | `principal`, `other`, aligned with `procedure_codes` [C4BBClaimProcedureType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimProcedureType%7C2.1.0) | `principal;other` |
| `procedure_dates` | Recommended | dates, aligned; the day each procedure was performed | `2026-05-12;2026-05-12` |
| `procedure_code_system` | If not ICD-10-PCS | `http://www.cms.gov/Medicare/Coding/ICD9` for ICD-9-CM volume 3 (ICD-10-PCS, `http://www.cms.gov/Medicare/Coding/ICD10`, assumed when empty) | |

### Adjudication

The claim-level adjudication decisions that are not amounts.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `benefit_payment_status` | Yes | `innetwork`, `outofnetwork`, `other`; how the claim was paid against the member's benefits [C4BBPayerBenefitPaymentStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerBenefitPaymentStatus%7C2.1.0) | `innetwork` |
| `billing_network_status` | Recommended | `innetwork`, `outofnetwork`; whether the billing facility had a contract with the plan on the admission date [C4BBPayerProviderNetworkStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerProviderNetworkStatus%7C2.1.0) | `innetwork` |
| `adjustment_reason_codes` | If reduced or denied | CARC or RARC codes explaining the noncovered amount, `;`-separated [X12 CARC and RARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `242` |
| `adjustment_reason_system` | If RARC | `https://x12.org/codes/remittance-advice-remark-codes` (CARC, `https://x12.org/codes/claim-adjustment-reason-codes`, assumed when empty) | |

- `benefit_payment_status` is mandatory on every inpatient claim. It answers how the member's benefits were applied, and can differ from `billing_network_status`: an out-of-network facility paid at in-network benefits for an emergency is `outofnetwork` for the provider and `innetwork` for the benefit.
- `payment_date` from the shared columns is must-support here. Send it whenever the claim was paid.

### Amounts

The shared [amount columns](explanation-of-benefit.md#amount-columns) apply, with two inpatient rules.

- Totals are mandatory: at least one amount column on the claim row must be filled. Send every total your system holds; `submitted_amount`, `eligible_amount`, `benefit_amount`, `paid_to_provider_amount` and `paid_by_patient_amount` are the ones members look for.
- CARIN allows an institutional claim to carry its adjudication amounts either on the lines or on the claim, never both. Fill the amount columns on the lines when your system adjudicates line by line. Leave every line amount blank when the claim was priced as a whole, as with a DRG payment, and Payerbox publishes the claim row's totals as the claim-level adjudication too. A delivery with amounts on both the claim row and its lines is rejected.

### Set by Payerbox

These profile elements have no column. Payerbox fixes them from the dataset or derives them from other columns.

| Element | Value |
|---|---|
| `type` | `institutional` |
| `subType` | `inpatient` |
| `use` | `claim` |
| `meta.profile` | the Inpatient Institutional canonical with version `2.1.0` |
| `identifier.type` | `uc` |
| `insurance.focal` | `true` on the coverage from `coverage_id` |
| `careTeam.sequence`, `supportingInfo.sequence`, `diagnosis.sequence`, `procedure.sequence` | numbered from the columns and list positions |

## claims_inpatient_lines

One row per revenue line. Every line carries a revenue code; a procedure code is present only where the facility billed one.

{% file src="../../assets/data-integration/claims_inpatient_lines.fa2dbe73.csv" %}
claims_inpatient_lines.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `revenue_code` | Yes | UB-04 FL 42, four characters with the leading zero [AHANUBCRevenueCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCRevenueCodes.html) | `0120` |
| `service_code` | If billed | CPT, HCPCS or HIPPS code on the line, with `service_code_system` [C4BBEOBInstitutionalProcedureCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-C4BBEOBInstitutionalProcedureCodes.html) | `80053` |
| `service_code_system` | If `service_code` | `http://www.ama-assn.org/go/cpt`, `https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets`, `https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/ProspMedicareFeeSvcPmtGen/HIPPSCodes` (CPT assumed when empty) | |
| `modifier_codes` | If billed | CPT or HCPCS modifiers, `;`-separated, same system as `service_code` [AMACPTCMSHCPCSModifiers](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/AMACPTCMSHCPCSModifiers%7C2.1.0) | `26` |
| `quantity` | Recommended | decimal; units, days or visits billed on the line | `6` |
| `allowed_units` | If adjudicated | decimal; units the payer allowed | `6` |
| `adjustment_reason_codes` | If reduced or denied | CARC or RARC codes on the line, `;`-separated [X12 CARC and RARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `97` |
| `adjustment_reason_system` | If RARC | as on the claim row (CARC assumed when empty) | |

- `service_code` overrides the shared rule that every line needs one. Room and board, operating room time and most ancillary revenue lines carry no CPT or HCPCS. On such a line Payerbox fills the profile's mandatory procedure element with the `not-applicable` marker CARIN provides for exactly this case.
- `service_date_start` and `service_date_end` from the shared columns are optional here; the stay's dates live on the claim row. Send them where a line has its own dates, such as a single-day procedure inside a longer stay.
- `quantity` is what the facility billed, `allowed_units` what the payer allowed. Both are plain numbers; a room and board line for a six-day stay has `quantity` `6`.
- The amount columns follow the claim-or-lines rule above: either every line in the claim carries its amounts, or none does.

These resources are served by [Patient Access](../../interop-apis/patient-access.md) with amounts, and by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
