---
description: >-
  Columns for dental claims, mapped to the CARIN Blue Button STU 2.1.0 C4BB
  ExplanationOfBenefit Oral profile.
---

# Oral

## Datasets

An oral claim is a dental bill (ADA Dental Claim Form) from a dentist, dental group or dental clinic, coded in CDT and located on teeth, surfaces and areas of the mouth. It is built like a [professional claim](professional-nonclinician.md): adjudication happens on the lines, and the claim row carries totals. [CARIN Blue Button STU 2.1.0](https://hl7.org/fhir/us/carin-bb/STU2.1/) profiles it twice: the financial profile with amounts for Patient Access, and its parent Basis profile without amounts for Provider Access and Payer-to-Payer. You deliver one pair of files.

| Dataset | CARIN BB STU 2.1.0 target profile |
|---|---|
| [`claims_oral`](#claims_oral) | [C4BB ExplanationOfBenefit Oral](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Oral.html), served without amounts as [Oral Basis](https://hl7.org/fhir/us/carin-bb/STU2.1/StructureDefinition-C4BB-ExplanationOfBenefit-Oral-Basis.html) |
| [`claims_oral_lines`](#claims_oral_lines) | `ExplanationOfBenefit.item` of the same profile |

Both files carry every column from [Explanation of Benefit](explanation-of-benefit.md). This page lists what the oral profile adds and where it tightens a shared rule.

## claims_oral

One row per dental claim.

{% file src="../../assets/data-integration/claims_oral.bf8e7efc.csv" %}
claims_oral.csv Data template with example rows
{% endfile %}

### Claim

| Column | Required | Format / values | Example |
|---|---|---|---|
| `claim_received_date` | Recommended | date the payer received the claim | `2026-03-18` |
| `service_facility_npi` | If not the billing provider's place | 10 digits; key from `organizations`; where the service was rendered when it is neither the billing provider nor the patient's home | `9999999993` |
| `medical_record_number` | If available | the provider's medical record number on the claim | `MR-88213` |
| `patient_account_number` | If available | the provider's patient account number on the claim | `ACC-530118` |
| `orthodontics_months` | If orthodontics | decimal; months of orthodontic treatment, from the ADA claim form. Send `1` when your system only holds a yes/no orthodontics flag | `24` |
| `prosthesis_replacement` | If a prosthesis | `true` when the prosthesis replaces an existing one, `false` when it is the first | `true` |
| `missing_tooth_numbers` | If a prosthesis | teeth already missing, `;`-separated tooth numbers [ADAUniversalNumberingSystem](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/ADAUniversalNumberingSystem%7C2.1.0) | `18;19;30` |

- `billing_provider_npi` may resolve to a Practitioner or an Organization: a solo dentist bills under their own NPI, a group under the practice's.
- CARIN carries the orthodontics indicator as a quantity, not a flag, so `orthodontics_months` is a number. `prosthesis_replacement` is the yes/no from the ADA form's "replacement of prosthesis" item.
- The ADA tooth numbering and CDT procedure codes are licensed. Tooth numbers and surfaces are small enough to be expanded here; the CDT value set is linked to the IG.

### Care team

One column per role, bound to [C4BBClaimProfessionalAndNonClinicianCareTeamRole](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimProfessionalAndNonClinicianCareTeamRole%7C2.1.0), the same set as professional claims.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `rendering_provider_npi` | Recommended | 10 digits; key from `practitioners`; the treating dentist | `9999999991` |
| `rendering_provider_taxonomy` | If available | NUCC taxonomy code the dentist billed under [Healthcare Provider Taxonomy](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.114222.4.11.1066&server=https://tx.fhir.org/r4) | `122300000X` |
| `referring_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `supervising_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `primary_provider_npi` | If available | 10 digits; key from `practitioners` | |
| `purchased_service_provider_npi` | If available | 10 digits; key from `practitioners` or `organizations`; a dental laboratory, for example | |

- Rendering, referring, supervising and primary must resolve to a Practitioner. Purchased service may be either.

### Diagnoses

Optional on dental claims, unlike every other type. When sent, they follow the professional shape: aligned `;`-separated lists with `principal` first.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `diagnosis_codes` | If available | ICD-10-CM codes, `;`-separated [CDCICD910CMDiagnosisCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/CDCICD910CMDiagnosisCodes%7C2.1.0) | `K02.52` |
| `diagnosis_types` | If `diagnosis_codes` | `principal`, `secondary`, aligned with `diagnosis_codes` [C4BBClaimProfessionalAndNonClinicianDiagnosisType](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBClaimProfessionalAndNonClinicianDiagnosisType%7C2.1.0) | `principal` |
| `diagnosis_code_system` | If not ICD-10-CM | `http://hl7.org/fhir/sid/icd-9-cm` for services before October 2015 (ICD-10-CM assumed when empty) | |

### Adjudication

Oral is the one claim type that carries the benefit payment status at both levels and requires the rendering network status.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `benefit_payment_status` | Yes | `innetwork`, `outofnetwork`, `other`; how the claim as a whole was paid against the member's dental benefit [C4BBPayerBenefitPaymentStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerBenefitPaymentStatus%7C2.1.0) | `innetwork` |
| `rendering_network_status` | Yes | `innetwork`, `outofnetwork`; whether the treating dentist had a contract with the plan on the date of service [C4BBPayerProviderNetworkStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerProviderNetworkStatus%7C2.1.0) | `innetwork` |
| `billing_network_status` | Recommended | `innetwork`, `outofnetwork`; the same for the billing provider | `innetwork` |

- Each line also carries its own `benefit_payment_status`. The claim-level value summarizes the claim; where the lines differ, send `other` on the claim and the real value on each line.
- `payment_date` from the shared columns is must-support here. Send it whenever the claim was paid.

### Amounts

The shared [amount columns](explanation-of-benefit.md#amount-columns) on the claim row become the claim totals, which are mandatory: at least one must be filled. The oral profile has no claim-level adjudication amounts; line amounts are mandatory, see below.

### Set by Payerbox

| Element | Value |
|---|---|
| `type` | `oral` |
| `use` | `claim` |
| `meta.profile` | the Oral canonical with version `2.1.0` |
| `identifier.type` | `uc` |
| `insurance.focal` | `true` on the coverage from `coverage_id` |
| `careTeam.sequence`, `supportingInfo.sequence`, `diagnosis.sequence`, `item.informationSequence` | numbered from the columns and list positions |

## claims_oral_lines

One row per dental procedure. Each line names the procedure, where it was done, and which tooth, surfaces or area of the mouth it applies to.

{% file src="../../assets/data-integration/claims_oral_lines.f8691296.csv" %}
claims_oral_lines.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `service_code` | Yes | CDT procedure code [ADADentalProcedureCode](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-ADADentalProcedureCode.html) | `D2392` |
| `service_code_system` | No | `http://www.ada.org/cdt` is the only system here (assumed when empty) | |
| `modifier_codes` | If billed | CPT or HCPCS modifiers, `;`-separated [AMACPTCMSHCPCSModifiers](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/AMACPTCMSHCPCSModifiers%7C2.1.0) | |
| `service_date_start` | Yes | date the procedure was performed | `2026-03-12` |
| `service_date_end` | If a period | date a multi-visit procedure ended; blank otherwise | |
| `place_of_service` | Yes | two-digit CMS place-of-service code [CMSPlaceofServiceCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-CMSPlaceofServiceCodes.html) | `11` |
| `tooth_number` | If a tooth | the tooth the procedure was done on: `1` to `32`, or `A` to `T` for primary teeth [ADAUniversalNumberingSystem](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/ADAUniversalNumberingSystem%7C2.1.0) | `19` |
| `oral_cavity_area` | If an area | the area of the mouth when the procedure is not on one tooth: `00` whole mouth, `01` upper arch, `02` lower arch, `10` `20` `30` `40` quadrants [OralBodySite](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-OralBodySite.html) | `02` |
| `tooth_surfaces` | If surfaces | surfaces treated, `;`-separated: `M`, `O`, `I`, `D`, `B`, `F`, `L` [C4BBSurfaceCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBSurfaceCodes%7C2.1.0) | `M;O` |
| `additional_tooth_numbers` | If several teeth | further teeth or areas the same line covers, `;`-separated, same values as `tooth_number` and `oral_cavity_area` | `18;20` |
| `quantity` | If available | decimal; units billed on the line | `1` |
| `diagnosis_sequences` | If available | positions in the claim's `diagnosis_codes` this line was billed against, `;`-separated | `1` |
| `benefit_payment_status` | Yes | `innetwork`, `outofnetwork`, `other`; how this line was paid [C4BBPayerBenefitPaymentStatus](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/carin-bb/ValueSet/C4BBPayerBenefitPaymentStatus%7C2.1.0) | `innetwork` |
| `allowed_units` | If adjudicated | decimal; units the payer allowed | `1` |
| `adjustment_reason_code` | If reduced or denied | one CARC or RARC code explaining the noncovered amount [X12 CARC and RARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `96` |
| `adjustment_reason_system` | If RARC | `https://x12.org/codes/remittance-advice-remark-codes` (CARC, `https://x12.org/codes/claim-adjustment-reason-codes`, assumed when empty) | |
| amount columns | Yes, at least one | line-level adjudication, one column per category | |

- `service_code` is mandatory on every line and is a CDT code, five characters starting with `D`. No other system is accepted; a line coded in CPT belongs on a professional claim.
- `tooth_number` and `oral_cavity_area` are one FHIR element, the body site. Send one or the other: a filling names a tooth, a denture or a cleaning names an arch or the whole mouth. Payerbox chooses the code system from which column is filled.
- `tooth_surfaces` belongs to the tooth in `tooth_number`. Surfaces on a line with no tooth are rejected.
- `additional_tooth_numbers` covers procedures that span several teeth, such as a bitewing radiograph. The first tooth goes in `tooth_number`; the rest here. Each becomes an additional body-site entry linked to this line, which is how CARIN requires them to be carried.
- `benefit_payment_status` and at least one amount are mandatory on every line. `adjustment_reason_code` is a single code, as on professional claims.

These resources are served by [Patient Access](../../interop-apis/patient-access.md) with amounts, and by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
