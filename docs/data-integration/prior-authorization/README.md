---
description: >-
  Columns for the prior authorization feed, mapped to the Da Vinci PDex STU 2.1.0
  PriorAuthorization profile: one dataset for the authorizations, one for their service lines,
  one for the documents submitted with them.
---

# Prior Authorizations

## Datasets

Built to the [Da Vinci PDex STU 2.1.0](https://hl7.org/fhir/us/davinci-pdex/STU2.1/) [PriorAuthorization](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-pdex-priorauthorization.html) profile, an ExplanationOfBenefit with `use` = `preauthorization`. Every authorization a payer has decided becomes one resource; the services requested on it are its items, and the documentation submitted with it becomes DocumentReference resources with the files behind them. [CMS-0057-F](../../compliance/cms-0057.md) adds this data to Patient Access from January 1, 2027.

| Dataset | Target profile |
|---|---|
| [`prior_auths`](#prior_auths) | [PDex PriorAuthorization](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-pdex-priorauthorization.html) |
| [`prior_auth_items`](#prior_auth_items) | `ExplanationOfBenefit.item` of the same profile |
| [`prior_auth_documents`](#prior_auth_documents) | [US Core DocumentReference](https://hl7.org/fhir/us/core/STU6.1/StructureDefinition-us-core-documentreference.html), with the file as a `Binary` |

## Data conventions

| Rule | Detail |
|---|---|
| Scope | Every authorization you adjudicate, whatever channel it arrived through, API, portal, fax or telephone, denied ones included. Drug authorizations are delivered and flagged with `drug_indicator`; Payerbox leaves them out of the prior authorization data it serves. |
| History | An authorization is served while it is active and for one year after its last status change. Send the history back to that window; the first delivery is the backfill. |
| Delivery | One historical backfill, then deltas carrying only authorizations new or changed since your last successful load. An authorization is the unit of delivery: when it appears in a delta, send its row, all of its lines and all of its documents, and the previous set is replaced. |
| Keys | `record_id` on an authorization is your authorization number and stays stable across re-sends. A service denied and later approved on appeal is the same `record_id` with a new decision, not a second authorization. |
| References | Members, coverage, practitioners and organizations are keys into the other feeds, defined once there: `patient_identifier` from `patients`, `coverage_id` from `coverage`, `*_npi` from `practitioners` and `organizations`. An authorization whose key does not resolve is reported back rather than published, and is re-sent once the record it refers to has arrived. |
| Decisions | The decision is `review_action`, an X12 306 code, on every service line and, for a denial of the whole request, on the authorization. A denial carries its reason as a CARC code and in the words given to the provider. |
| Codes | Send the code, not the description. Every coded column has a companion `_system` column holding the code system URI; leave it blank to accept the default named in that column's row. |
| Dates | `date` columns are `YYYY-MM-DD`. `datetime` columns are ISO 8601 with a timezone offset. |
| Documents | The document itself travels as a file in the delivery and the `prior_auth_documents` row points at it by a path relative to the delivery root. Put no patient details in file or folder names. |
| PHI | Authorizations carry protected health information. Delivery is encrypted in transit and at rest under the executed BAA. |

```
delivery-2026-09-10/
  csv/
    prior_auths.csv
    prior_auth_items.csv
    prior_auth_documents.csv
  attachments/
    DOC-77120.pdf
    DOC-77121.json
```

## prior_auths

One row per authorization: who asked, for whom, when it arrived, and what was decided on it as a whole. The decision on each requested service is on its line in `prior_auth_items`.

{% file src="../../assets/data-integration/prior_auths.68be1f8b.csv" %}
prior_auths.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your authorization number, stable across re-sends | `PA-2026-900001` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `coverage_id` | Yes | key from `coverage` | `COV-0001` |
| `payer_org_npi` | Yes | 10 digits, or your payer id; the same payer named on that coverage | `9999999979` |
| `requesting_provider_npi` | Yes | 10 digits; key from `practitioners` or `organizations` | `9999999995` |
| `enterer_npi` | If available | 10 digits; key from `practitioners`; who entered the request, when not the requesting provider | `9999999995` |
| `claim_type` | Yes | `professional`, `institutional`, `pharmacy`, `vision`, `oral` [claim-type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/claim-type%7C4.0.1) | `professional` |
| `drug_indicator` | Yes | `true`, `false` | `false` |
| `level_of_service` | Recommended | `E` elective, `U` urgent, `03` emergency, `ME` expedited [X12 1338](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-extension-levelOfServiceCode.html) | `E` |
| `received_at` | Yes | datetime, with offset; when the request reached you, which starts the decision clock | `2026-09-01T09:31:00-04:00` |
| `status` | Yes | `active`, `cancelled` [explanationofbenefit-status](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/explanationofbenefit-status%7C4.0.1) | `active` |
| `outcome` | Recommended | `complete`, `partial`, `queued`, `error` [remittance-outcome](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/ValueSet/remittance-outcome%7C4.0.1) | `complete` |
| `decision_date` | If decided | date; the date of the decision, as on the approval or denial letter | `2026-09-03` |
| `review_action` | If decided | `A1` approved in full, `A3` denied, `A4` pending, `A6` approved with changes, `C` cancelled, `CT` contact payer, `NA` no action needed [X12 306](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-extension-reviewActionCode.html) | `A6` |
| `denial_reason_code` | If denied | CARC [X12 CARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `50` |
| `denial_reason_text` | If denied | free text; the reason in the words given to the provider | `Not medically necessary: conservative therapy not documented` |
| `auth_reference` | Recommended | the authorization number the provider was given | `AUTH900001` |
| `auth_period_start` | If approved | date; first day the authorization is valid | `2026-09-03` |
| `auth_period_end` | If approved | date; last day the authorization is valid | `2026-12-02` |
| `last_updated` | Recommended | datetime the authorization last changed in your system, or its creation time if never changed | `2026-09-03T16:20:00-04:00` |
| `is_deleted` | If retracting | `true` retracts this authorization and all of its lines and documents | `true` |

- `record_id` is your authorization number and every line and document carries it. Keep it stable: re-sending a `record_id` replaces the authorization, its lines and its documents, and a service denied and later approved on appeal is the same `record_id` with a new decision, not a second authorization.
- `requesting_provider_npi` is the party that asked for the authorization. Whether it becomes a Practitioner or an Organization reference is decided by which dataset defines that NPI, so a provider named here must exist in `practitioners` or `organizations`, in network or not.
- `claim_type` is the form the request would be billed on. It is not the drug classification; that is `drug_indicator`.
- `drug_indicator` marks a request for a drug. Drug authorizations are delivered and stored; the rule excludes them from the prior authorization data served, and Payerbox applies that exclusion at export, not at delivery.
- `level_of_service` `ME` is a request handled under the 72-hour expedited timeframe.
- `received_at` is the moment the one-business-day, 72-hour and 7-day timeframes are measured from. A value without an offset is reported back rather than published.
- `status` is `active` for a record in force, a denied one included, and `cancelled` for a request the provider withdrew. A record sent in error is retracted with `is_deleted`, not by a status.
- `outcome` says whether processing finished; `partial` is an authorization with a line still pending. Blank is published as `complete`.
- `decision_date` is distinct from `received_at`. A decision date earlier than `received_at` is reported back rather than published.
- `review_action` on the authorization is `A6` when the lines were decided differently. It is published on the resource when the request was denied as a whole; any other decision on the request is stated by its lines.
- `denial_reason_text` must say more than the outcome: `denied` or `not covered` alone is reported back rather than published.
- `last_updated` does not become `meta.lastUpdated`, which Payerbox stamps with the ingestion time; it is your own record of when the authorization changed and goes into the Provenance record built alongside it.

- The template rows show the cases that matter: a request approved with changes whose lines were decided three ways (`PA-2026-900001`), a request denied as a whole with its reason (`PA-2026-900002`), a request still pending (`PA-2026-900003`), and a retraction (`PA-2026-900004`). Their keys resolve against the `patients`, `coverage`, `practitioners` and `organizations` templates.

### Set by Payerbox

These profile elements have no column. Payerbox fixes them from the dataset or derives them from other columns.

| Element | Value |
|---|---|
| `use` | `preauthorization` |
| `type` | from `claim_type` |
| `patient`, `insurance.coverage`, `insurer`, `provider`, `enterer` | the resources the keys resolve to; `insurance.focal` is `true` |
| `created` | from `received_at`, offset kept |
| `outcome` | from `outcome`; `complete` when blank |
| `adjudication` | one `denialreason` entry when the request was denied as a whole: the CARC, the text, the review action and the decision date |
| `extension` | the drug indicator from `drug_indicator`, the level of service from `level_of_service` |
| `meta.lastUpdated` | the time the authorization was ingested; `last_updated` is kept for the Provenance record |
| `Provenance` | one per authorization, naming the payer as the author and listing the authorization and its documents as targets |

## prior_auth_items

One row per requested service. An authorization with three requested services has three rows carrying the same `prior_auth_record_id`. Lines have no `is_deleted`: an authorization is delivered as a whole, so re-sending it replaces its previous lines, and retracting the authorization retracts them.

{% file src="../../assets/data-integration/prior_auth_items.a0c113e8.csv" %}
prior_auth_items.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `prior_auth_record_id` | Yes | the authorization's `record_id` | `PA-2026-900001` |
| `line_number` | Yes | positive integer, unique within the authorization; your line number | `1` |
| `service_code` | Yes | with `service_code_system` [PDexPAInstitutionalProcedureCodesVS](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-pdex/ValueSet/PDexPAInstitutionalProcedureCodesVS%7C2.1.0) | `27447` |
| `service_code_system` | Yes | code system URI: CPT `http://www.ama-assn.org/go/cpt`, HCPCS `https://www.cms.gov/Medicare/Coding/HCPCSReleaseCodeSets`, ICD-10-PCS `http://www.cms.gov/Medicare/Coding/ICD10`, NDC `http://hl7.org/fhir/sid/ndc`, revenue codes `https://www.nubc.org/CodeSystem/RevenueCodes` | `http://www.ama-assn.org/go/cpt` |
| `service_category` | Recommended | X12 1365 service type code [PriorAuthServiceTypeCodes](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/davinci-pdex/ValueSet/PriorAuthServiceTypeCodes%7C2.1.0) | `2` |
| `diagnosis_code` | Recommended | the diagnosis the service was requested for, with `diagnosis_code_system` | `M17.11` |
| `diagnosis_code_system` | If not ICD-10-CM | code system URI; `http://hl7.org/fhir/sid/icd-10-cm` assumed when empty |  |
| `service_date_start` | Recommended | date; first day this service is authorized for | `2026-09-03` |
| `service_date_end` | Recommended | date; last day this service is authorized for | `2026-12-02` |
| `review_action` | Yes | `A1` approved in full, `A3` denied, `A4` pending, `A6` approved with changes, `C` cancelled, `CT` contact payer, `NA` no action needed [X12 306](https://hl7.org/fhir/us/davinci-pdex/STU2.1/StructureDefinition-extension-reviewActionCode.html) | `A1` |
| `approved_units` | If approved | integer; how many units, visits or days were approved | `12` |
| `consumed_units` | If available | integer; how many of the approved units have been used | `0` |
| `denial_reason_code` | If denied | CARC [X12 CARC](https://hl7.org/fhir/us/carin-bb/STU2.1/ValueSet-X12ClaimAdjustmentReasonCodesCMSRemittanceAdviceRemarkCodes.html) | `50` |
| `denial_reason_text` | If denied | free text; the reason in the words given to the provider | `Not medically necessary: conservative therapy not documented` |
| `issue_date` | If available | date the decision on this service was issued | `2026-09-03` |
| `trace_number` | If available | the trace number of the request as exchanged with the provider | `TRN-2026-004182-1` |
| `admin_reference_number` | If available | a reference number you assigned for administration, when separate from the authorization number | `ADM-77120` |
| `prior_auth_number` | If available | an earlier authorization this service continues | `AUTH880011` |
| `servicing_provider_npi` | If available | 10 digits; key from `practitioners`; the provider approved to render the service, when different from the requester | `9999999987` |

- `diagnosis_code` named on several lines of one authorization is published once, as one `diagnosis` entry.
- `review_action` has no partial-approval code: a service approved for fewer units than requested is `A6`, with `approved_units` stating how many. A value outside the seven codes is reported back rather than published.
- `denial_reason_text` is the specific reason as stated to the provider; one that only restates the outcome is reported back rather than published.

### Set by Payerbox

| Element | Value |
|---|---|
| `item.sequence` | from `line_number` |
| `item.adjudication` | the entry the decision needs: `allowedunits` with `approved_units` for `A1` and `A6`, `denialreason` with the CARC and text for `A3`, `consumedunits` for a line pending, cancelled or needing no action; the review action and the decision date ride on that entry |
| `item.extension` | the authorized period from `service_date_start` and `service_date_end`, the issue date, the trace number, the administration reference number, the previous authorization number, the authorized provider |
| `diagnosis` | one entry per distinct diagnosis across the lines |

## prior_auth_documents

One row per document submitted with the request. The document itself is the file; this row is its index card.

{% file src="../../assets/data-integration/prior_auth_documents.451b1ba9.csv" %}
prior_auth_documents.csv Data template with example rows
{% endfile %}

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your stable key for this document | `DOC-77120` |
| `prior_auth_record_id` | Yes | the authorization's `record_id` | `PA-2026-900001` |
| `document_kind` | Yes | `structured`, `unstructured` | `unstructured` |
| `type_code` | Yes | LOINC document type, e.g. `34133-9` summary of episode note, `74465-6` questionnaire response, `18842-5` discharge summary; `UNK` when the type is not held [US Core DocumentReference Type](https://healthsamurai.github.io/fhir-valueset-viewer/#url=http://hl7.org/fhir/us/core/ValueSet/us-core-documentreference-type%7C6.1.0) | `34133-9` |
| `attachment_file` | Yes | path relative to the delivery root | `attachments/DOC-77120.pdf` |
| `document_date` | Recommended | datetime; when the document was written | `2026-09-01T10:00:00-04:00` |
| `author_npi` | Recommended | 10 digits; key from `practitioners` | `9999999995` |
| `is_deleted` | If retracting | `true` retracts this row | `true` |

- `document_kind` routes the row: `structured` is field data submitted by the provider, such as questionnaire answers, and is served through Patient Access and Provider Access; `unstructured` is a file as submitted, a PDF, a scan or a letter, and is served through Payer-to-Payer.
- `type_code` has a required binding, so the type must come from that value set; `UNK` is in it for a type you do not hold.
- `attachment_file` that does not resolve at delivery is reported back; the row is not published.

### Set by Payerbox

| Element | Value |
|---|---|
| `DocumentReference.status`, `category` | `current`; `clinical-note` |
| `subject`, `author`, `context.related` | the member, the author and the authorization the keys resolve to |
| `content.attachment` | `contentType` and size read from the stored file; `url` points at the `Binary` holding it |
| `Binary.securityContext` | the member |

These resources are served by [Patient Access](../../interop-apis/patient-access.md) and [Provider Access](../../interop-apis/provider-access.md), denied authorizations included, and by [Payer-to-Payer](../../interop-apis/payer-to-payer.md) without them.
