---
description: >-
  Columns for the prior authorization feed, mapped to the Da Vinci PDex STU
  2.1.0 Prior Authorization profile: the decisions, the items they cover, and
  the documentation behind them.
---

# Prior Authorizations

## Datasets

Built to [Da Vinci PDex STU 2.1.0](https://hl7.org/fhir/us/davinci-pdex/STU2.1/). An authorization becomes one ExplanationOfBenefit with `use` = `preauthorization`, not a Claim. Three files: the authorization and its decision, the items it covers, and the links from an authorization to the documents behind it.

| Dataset | PDex STU 2.1.0 target |
|---|---|
| [`prior_auths`](#prior_auths) | [PDex Prior Authorization](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-pdex-priorauthorization.html) |
| [`prior_auth_lines`](#prior_auth_lines) | `ExplanationOfBenefit.item` of the same profile |
| [`prior_auth_documents`](#prior_auth_documents) | `ExplanationOfBenefit.supportingInfo` of the same profile, pointing at the [US Core DocumentReference](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-documentreference.html) built from [`documents`](../uscdi/clinical-notes.md#documents) |

Prior authorization data often sits with a delegated utilization-management vendor rather than with the plan. Whoever holds it delivers this feed.

## Data conventions

| Rule | Detail |
|---|---|
| Scope | Medical prior authorizations in every state: pending, approved, denied, partially approved, cancelled. Drug prior authorizations are out of scope for the APIs this feed serves, so filter them out before delivery. |
| History | Every authorization active now, plus every authorization whose status last changed within the past year. |
| Freshness | A new request is delivered within one business day of receipt, and a status change within one business day of the change. |
| Delivery | One historical backfill, then deltas carrying only authorizations new or changed since your last successful load. An authorization is the unit of delivery: when it appears in a delta, send its row, all of its lines and all of its document links, and the previous sets are replaced. |
| Keys | `record_id` is the authorization number the source system assigned, the one the provider and the member see. It stays stable as the authorization moves from pending to a decision: every later delivery is an update to the same record, not a new one. It must be unique across the whole feed, so numbering that restarts per plan is prefixed before delivery. |
| References | Members, coverage, providers, locations and documents are keys into the other feeds, defined once there: `patient_identifier` from `patients`, `coverage_id` from `coverage`, every `*_npi` and `*_npis` column from `practitioners` and `organizations`, `facility_id` from `locations`, `document_record_id` from `documents`. A provider named on an authorization must exist in those datasets even when out of network. |
| Codes | Send the code, not the description. Coded columns have a companion `_system` column; leave it blank to accept the default named in that column's row. Payerbox derives the label from its terminology service. The review, level-of-service and denial columns bind to licensed X12 code lists, and CPT and HCPCS are licensed too: hold the license for every code system you send. |
| Multiple values | `;`-separated, positionally aligned across companion columns. **Aligned lists must be the same length**: the companion is read at each value's own position, so a short list leaves the values past its end without one. |
| Dates | `date` columns are `YYYY-MM-DD`. `datetime` columns are ISO 8601 with a timezone offset. |
| PHI | Authorizations carry protected health information. Delivery is encrypted in transit and at rest under the executed BAA. |

PDex points the authorization's insurance at the [HRex Coverage](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-coverage.html) profile, whose beneficiary is an HRex Patient. An authorization sends no coverage data of its own beyond `coverage_id`, and almost everything those two profiles demand is already required elsewhere: the member id and subscriber relationship in [`coverage`](../uscdi/health-insurance.md#coverage), the name in [`patients`](../uscdi/patient-demographics.md#name). The one exception is [`birth_date`](../uscdi/patient-demographics.md#demographics), recommended in the clinical feed and **required for any member who has an authorization**: a member missing it cannot have one published.

## prior_auths

One row per authorization.

{% file src="../../assets/data-integration/prior_auths.4a14d643.csv" %}
prior_auths.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your authorization number, stable across status changes | `PA-0001` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `coverage_id` | Yes | key from `coverage`, the plan the authorization was decided against | `COV-0001` |
| `payer_org_npi` | Yes | 10 digits, or your payer id; the same payer named on that coverage | `9999999979` |
| `requesting_provider_npi` | Yes | 10 digits; key from `practitioners` or `organizations`; who asked for the authorization | `9999999995` |
| `enterer_npi` | If available | 10 digits; key from `practitioners`; who entered the request, when that is not the requesting provider | `9999999987` |
| `facility_id` | If applicable | key from `locations`; where the authorized service is to be delivered | `LOC-221` |
| `care_team_npis` | If available | 10 digits, `;`-separated; other providers named on the request | |
| `care_team_roles` | If `care_team_npis` | `primary`, `assist`, `supervisor`, `other`; one per entry in `care_team_npis`, same length [claim-careteamrole](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/claim-careteamrole%7C4.0.1) (code system `http://terminology.hl7.org/CodeSystem/claimcareteamrole`) | |
| `claim_type` | Yes | `professional`, `institutional`, `oral`, `vision` [claim-type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/claim-type%7C4.0.1) | `professional` |
| `status` | Yes | `active`, `cancelled` [explanationofbenefit-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/explanationofbenefit-status%7C4.0.1) | `active` |
| `outcome` | Yes | `queued`, `complete`, `error`, `partial` [remittance-outcome](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/remittance-outcome%7C4.0.1) | `complete` |
| `request_date` | Yes | datetime the authorization was created in your system | `2026-03-02T09:12:00-05:00` |
| `level_of_service_code` | If available | X12 level of service code, the urgency the provider asked for (2000E UM06) [levelOfServiceCode](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-extension-levelOfServiceCode.html) | `U` |
| `priority` | If available | `stat`, `normal`, `deferred`; how fast the payer had to process the request [process-priority](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/process-priority%7C4.0.1) | `normal` |
| `diagnosis_codes` | Recommended | ICD-10-CM codes the request was justified by, `;`-separated; lines point at positions in this list | `E11.9;I10` |
| `diagnosis_types` | If available | `principal`, `admitting` and the rest of the diagnosis types [ex-diagnosistype](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/ex-diagnosistype%7C4.0.1), or `secondary` for any other diagnosis (stored without a type: prior authorization standards give secondary diagnoses none), aligned with `diagnosis_codes`, one value per code | `principal;secondary` |
| `diagnosis_code_system` | If not ICD-10-CM | `http://hl7.org/fhir/sid/icd-9-cm` (ICD-10-CM, `http://hl7.org/fhir/sid/icd-10-cm`, assumed when empty) | |
| `decision_date` | If decided | datetime the authorization-level decision was made | `2026-03-04T16:20:00-05:00` |
| `auth_period_start` | If approved | date the authorization takes effect | `2026-03-05` |
| `auth_period_end` | If it ends on a date | date the authorization expires; blank when the limit is a number of units rather than a date | `2026-06-05` |
| `review_action_code` | If your system assigns one | X12 review decision action code (2000F HCR01), the decision as a code [reviewAction](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-extension-reviewAction.html) | `A1` |
| `review_number` | If available | the review number your system assigned to this decision | `AUTH0001` |
| `review_reason_codes` | If pended, denied or partially approved | X12 review decision reason code(s), `;`-separated [X12278ReviewDecisionReasonCode](https://hl7.org/fhir/us/davinci-pdex/STU2.1/ValueSet-X12278ReviewDecisionReasonCode.html) | |
| `second_surgical_opinion_flag` | If asserted | `true` when a second surgical opinion is required for approval | `true` |
| `denial_reason_codes` | If denied | CARC or RARC codes explaining the denial, `;`-separated [X12 CARC and RARC](https://hl7.org/fhir/us/davinci-pdex/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `50` |
| `denial_reason_system` | If RARC | `https://x12.org/codes/remittance-advice-remark-codes` (CARC, `https://x12.org/codes/claim-adjustment-reason-codes`, assumed when empty) | |
| `denial_reason_text` | If denied | free text; the reason as the member reads it, published alongside the code | `Not medically necessary for this indication` |
| `submitted_amount` | If available | decimal, US dollars; the amount requested | `1200.00` |
| `eligible_amount` | If available | decimal, US dollars; the amount allowed | `840.00` |
| `utilized_quantity` | If tracked, and `eligible_amount` is sent | decimal; how much of the authorization has been used to date | `2` |
| `process_note_1` … `process_note_10` | If your system holds them | free text; the authorization as it reads to the member and the servicing provider, one note per slot, in the order they were written | `Approved 12 established-patient visits, effective 03/05/2026-06/05/2026` |
| `last_updated` | Yes | datetime the authorization last changed in your system | `2026-03-04T16:20:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this authorization, its lines and its document links | `true` |

### Authorization states

`status` carries the lifecycle of the record, `outcome` says how far processing got, and `review_action_code` carries the decision. Each state brings its own required columns.

| State | `status` | `outcome` | Also required |
|---|---|---|---|
| Pending | `active` | `queued` | nothing beyond the request columns |
| Approved | `active` | `complete` | `decision_date`, `auth_period_start`, and `allowed_units` on every line |
| Denied | `active` | `complete` | `decision_date`, `denial_reason_codes`, `denial_reason_text` |
| Partially approved | `active` | `partial` | the approved and the denied columns, per line |
| Cancelled or withdrawn | `cancelled` | the value processing had reached | `queued` when no review had happened, `complete` when a decision was already on record |

- An authorization that has run out of time stays `active`. `cancelled` means withdrawn, not lapsed. Keep sending the row for as long as History asks for it.
- A partial approval is decided per line, so the authorization row carries `outcome` = `partial` and the reasons sit on the lines that were cut or refused. Send authorization-level denial columns only when the whole request was refused.
- `claim_type` has no `pharmacy` value: drug authorizations are out of scope. Dental is `oral`, vision is `vision`. Blank reads as `professional`. It is not derived from the lines, so send `institutional` yourself for a facility authorization.
- The provider columns take an NPI, or the id that provider is registered under in `practitioners` and `organizations`. A provider known only by a name cannot be published.
- `outcome` is about processing, `review_action_code` about the decision. They are not interchangeable, so send both: a request reviewed and sent back for more information is `queued` with a review action of pended. A cancelled authorization keeps the outcome it had reached and says it was cancelled in `status`.
- `review_action_code`, `review_number`, `review_reason_codes`, `second_surgical_opinion_flag` and `decision_date` publish only on a row that also carries `denial_reason_codes` or `submitted_amount`. The lines carry the same rule.
- Leave `auth_period_end` blank when the authorization ends on a unit or visit allowance rather than a date. `allowed_units` on the line then says when it is exhausted. Both may be present.
- `denial_reason_codes` takes CARC and RARC codes only, so a payer-defined code cannot go there. Put the wording in `denial_reason_text`; both are published.
- The amounts are optional; an authorization decided on medical necessity alone carries none. Send them where you have them.
- A home-care authorization is approved as a schedule: how many hours, on which days. A line's unit count cannot express that, so it goes in `process_note_`. Fill the slots in order. A note is published as written and never parsed.

## prior_auth_lines

One row per item or service on the authorization. An authorization covering three services has three rows carrying the same `prior_auth_record_id`. Lines have no `is_deleted`: an authorization is delivered as a whole, so re-sending it replaces its previous lines.

{% file src="../../assets/data-integration/prior_auth_lines.0e581687.csv" %}
prior_auth_lines.csv Data template with example rows
{% endfile %}

### Requested

| Column | Required | Format / values | Example |
|---|---|---|---|
| `prior_auth_record_id` | Yes | the authorization's `record_id` | `PA-0001` |
| `line_number` | Yes | positive integer, unique within the authorization | `1` |
| `service_code` | Yes, unless `revenue_code` identifies the line | CPT, HCPCS or HIPPS code for the requested service, with `service_code_system` [PDexPAInstitutionalProcedureCodesVS](https://hl7.org/fhir/us/davinci-pdex/STU2.1/ValueSet-PDexPAInstitutionalProcedureCodesVS.html) | `99214` |
| `service_code_system` | If not CPT | `https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets`, `https://www.cms.gov/Medicare/Medicare-Fee-for-Service-Payment/ProspMedicareFeeSvcPmtGen/HIPPSCodes` (CPT, `http://www.ama-assn.org/go/cpt`, assumed when empty) | |
| `revenue_code` | If the line is a facility line with no procedure code | UB-04 FL 42, four characters with the leading zero [AHANUBCRevenueCodes](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-AHANUBCRevenueCodes.html) | `0905` |
| `service_description` | Recommended | free text; the service as it reads on the authorization letter, published as written and never matched against the code | `Intensive outpatient program` |
| `service_category_code` | Recommended | X12 service type code, the benefit category the request falls under [PriorAuthServiceTypeCodes](https://hl7.org/fhir/us/davinci-pdex/STU2.1/ValueSet-PriorAuthServiceTypeCodes.html) | `3` |
| `service_date_start` | If available | date the service is expected or was delivered | `2026-03-05` |
| `service_date_end` | If a period | date the service ends; blank for a single-day service | |
| `quantity_value` | If available | decimal; units, visits or days requested | `12` |
| `quantity_unit` | If `quantity_value` | free text, unbound: `visits`, `days`, `units` | `visits` |
| `diagnosis_sequences` | If available | positions in the authorization's `diagnosis_codes` this line was requested against, `;`-separated | `1;2` |
| `trace_numbers` | If available | service trace numbers for this item, `;`-separated | |
| `trace_number_systems` | If `trace_numbers` | the namespace URI or OID each trace number belongs to, aligned with `trace_numbers` | |

### Authorized

Send these columns only where what was authorized differs from what was requested. An approval with no changes needs none of them.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `authorized_service_code` | If different from requested | the code actually authorized, with `authorized_service_code_system` | `99213` |
| `authorized_service_code_system` | If `authorized_service_code` | **not the same list as `service_code_system`**; see the note below | |
| `authorized_service_code_range_end` | If a range was authorized | the last code in the authorized range; `authorized_service_code` is then the first | |
| `authorized_quantity_value` | If different from requested | decimal; units, visits or days authorized | `8` |
| `authorized_quantity_unit` | If `authorized_quantity_value` | free text, unbound, as in `quantity_unit` | `visits` |
| `authorized_provider_npis` | If restricted to a provider | 10 digits, `;`-separated; who may deliver this item | `9999999987` |
| `auth_issue_date` | If approved | date this item's authorization was issued | `2026-03-04` |
| `auth_period_start` | If approved | date this item's authorization takes effect | `2026-03-05` |
| `auth_period_end` | If it ends on a date | date this item's authorization expires | `2026-06-05` |
| `previous_authorization_number` | If a reauthorization | the earlier authorization number this item continues | |
| `administration_reference_number` | If available | the reference number assigned to an earlier disallowed outcome for this item | |

### Decision

| Column | Required | Format / values | Example |
|---|---|---|---|
| `review_action_code` | If your system assigns one | X12 review decision action code for this line (2000F HCR01) | `A1` |
| `review_number` | If available | the review number your system assigned to this line | `AUTH0001` |
| `review_reason_codes` | If pended, denied or partially approved | X12 review decision reason code(s), `;`-separated | |
| `second_surgical_opinion_flag` | If asserted | `true` when a second surgical opinion is required for this line | |
| `decision_date` | If decided | datetime this line was decided | `2026-03-04T16:20:00-05:00` |
| `allowed_units` | If approved | decimal; units, visits or days the payer allowed | `8` |
| `consumed_units` | If tracked | decimal; units, visits or days used so far | `2` |
| `denial_reason_codes` | If denied or reduced | CARC or RARC codes for this line, `;`-separated | `198` |
| `denial_reason_system` | If RARC | as on the authorization row | |
| `denial_reason_text` | If denied or reduced | free text; the reason as the member reads it | `Requested visit count exceeds policy limit` |

- A line is identified by `service_code` or by `revenue_code`. A revenue code cannot go in `service_code`: send it in `revenue_code` and leave `service_code` empty. Facility authorizations in behavioral health, inpatient, skilled nursing and rehabilitation routinely carry only a revenue code.
- `service_description` is what carries meaning when the line has no procedure code. Send it on every line identified by `revenue_code` or `service_category_code`.
- `service_category_code` comes from the X12 service type code list, the same list a 278 carries. Send the code; Payerbox adds the system.
- The authorized columns are how a modified approval is expressed: what the provider asked for stays in `service_code` and `quantity_value`, and what the payer granted goes in `authorized_service_code` and `authorized_quantity_value`. Twelve visits requested and eight approved leaves both numbers on the line, and the member sees both.
- The requested and authorized columns bind to different code lists. Send either spelling of HCPCS; Payerbox translates. CPT works in both, and the authorized list also takes X12 1365, ICD-9-CM, ICD-10-PCS and NDC. HIPPS is accepted only as requested, so express a HIPPS change through `authorized_quantity_value`.
- There is no column for procedure modifiers, unit price, revenue code, nursing-home level of care or the EPSDT indicator on an authorized line.
- A line's review action needs a host, as the authorization's does: send `review_action_code` only where the line also carries `allowed_units`, `consumed_units`, a denial reason or an amount. A pending line with none of them lets `outcome` on the authorization report that the request is still in processing.
- `allowed_units` and `consumed_units` are the utilization pair: what was granted, and how much of it is used. They are the only way a unit-limited authorization says how much is left, so send `consumed_units` whenever your system tracks it.
- Amounts sit on the authorization, not the line: `submitted_amount` and `eligible_amount` on [`prior_auths`](#prior_auths). PDex allows them per line; this feed has no column for them.

## prior_auth_documents

One row per link between an authorization and a document behind it: the clinical notes, forms and letters a provider submitted with the request. The document itself travels in [`documents`](../uscdi/clinical-notes.md#documents), which carries the file; this row says which authorization it belongs to.

{% file src="../../assets/data-integration/prior_auth_documents.2b56aa04.csv" %}
prior_auth_documents.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `prior_auth_record_id` | Yes | the authorization's `record_id` | `PA-0001` |
| `document_record_id` | Yes | the document's `record_id` in `documents` | `DOC-0001` |
| `line_number` | If the document supports one line | that line's `line_number`; blank when the document supports the whole authorization. carried but not yet published; every link currently reaches the authorization as a whole | `1` |
| `category_code` | If not an attachment | `info`, `material`, `related`, `other` and the rest of the claim information categories [claim-informationcategory](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/claim-informationcategory%7C4.0.1) (`attachment` assumed when empty) | `material` |

- A `document_record_id` is not checked against `documents` at ingest, so a link to a document that never arrives dangles. Deliver both in the same window.
- One document can support several authorizations, and one authorization can have many documents. Send a row per pair.
- Documents are what the provider submitted. A denial letter the plan issued does not belong here.
- The link is per authorization, so a document store keyed only to the member cannot produce these rows. Those documents still travel in `documents` and are served as clinical documents, with nothing tying them to an authorization.
- `documents` takes LOINC `type_code` only, so a library typed by its own codes needs a crosswalk. It is short in practice: `11488-4` consult note, `18842-5` discharge summary, `96349-6` referral letter, `52036-1` home health prior authorization, `94118-7` medical records in response to authorization denial, and `34109-9` note for anything with no better match.

These resources are served by [Patient Access](../../interop-apis/patient-access.md), [Provider Access](../../interop-apis/provider-access.md), and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
