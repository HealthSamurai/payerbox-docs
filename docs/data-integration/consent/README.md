---
description: >-
  Columns for the member consent feed: the Provider Access opt-out and the
  Payer-to-Payer opt-in, mapped to the Da Vinci PDex STU 2.2.0 and HRex STU
  1.1.0 Consent profiles, plus the previous coverage a member names.
---

# Member Consent

## Datasets

Two member choices gate two APIs. A member **opts out** of [Provider Access](../../interop-apis/provider-access.md): sharing with treating providers is on until the member says no. A member **opts in** to [Payer-to-Payer](../../interop-apis/payer-to-payer.md): nothing is requested from a previous or concurrent payer without it. Each choice becomes one FHIR Consent, built to the profile the API reads. Patient Access records nothing: the member's approval to the app is the permission event.

| Dataset | Target profile |
|---|---|
| [`provider_access_opt_outs`](#provider_access_opt_outs) | [PDex Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.2/StructureDefinition-pdex-provider-consent.html), read by [`$provider-member-match`](../../api-reference/operations/provider-member-match.md) and by every Provider Access export |
| [`payer_to_payer_opt_ins`](#payer_to_payer_opt_ins) | [HRex Consent](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-consent.html), the record Payerbox sends with [`$bulk-member-match`](../../api-reference/operations/bulk-member-match.md) when it is the requesting payer |
| [`previous_coverages`](#previous_coverages) | [HRex Coverage](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-coverage.html), the `CoverageToMatch` of that same request |

Consent is captured wherever the plan captures it: a member portal, a call center script, a paper form, a consent management system. Whoever holds the record delivers this feed. Payerbox as the requesting payer in Payer-to-Payer is on the roadmap; the opt-in and the previous coverage are collected now so the request can go out as soon as the capability ships.

## Data conventions

| Rule | Detail |
|---|---|
| Scope | Every decision a member or their personal representative has made on either switch, including reversals and withdrawals. Both switches are captured in the member's own name even when a personal representative signs. |
| History | A decision is never edited. A change of mind is a new row with its own `record_id` and a later `captured_at`; the row with the latest `captured_at` for a member and a switch is the state in force. Every earlier row stays, so the state at the moment of any API response can be shown afterwards. |
| Freshness | A new decision or a change is delivered within one business day of capture. A withdrawn opt-in or a new opt-out that has not reached Payerbox cannot be honoured, so faster delivery, including event-driven, is arranged per engagement. |
| Delivery | One historical backfill of every decision on file, then deltas carrying rows new since your last successful load. |
| Keys | `record_id` is the identifier your consent system assigned to the decision. It must be unique across the whole feed. |
| References | Members, related persons and documents are keys into the other feeds, defined once there: `patient_identifier` from [`patients`](../uscdi/patient-demographics.md#patients), `signer_related_person_id` from [`related_persons`](../uscdi/patient-demographics.md#related-persons), `*_document_id` from `documents`. |
| Documents | The signed form and the document of a representative's authority travel in `documents` as any other document, referenced from here by key. The Payer-to-Payer opt-in cannot be built without its signed form: HRex Consent requires a source document. |
| Dates | `date` columns are `YYYY-MM-DD`. `datetime` columns are ISO 8601 with a timezone offset. |
| PHI | Consent records carry protected health information. Delivery is encrypted in transit and at rest under the executed BAA. |

## provider_access_opt_outs

One row per decision on the Provider Access switch. The first row for a member is normally an opt-out; a later row with `choice` = `share` reverses it.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your identifier for this decision, unique across the feed | `PAC-000117` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `choice` | Yes | `opt-out` (stop sharing with all in-network providers), `share` (opt back in) | `opt-out` |
| `captured_at` | Yes | datetime the member or representative made the decision | `2026-11-03T14:22:00-05:00` |
| `effective_start` | Yes | date the decision takes effect; normally the capture date | `2026-11-03` |
| `signer_type` | Yes | `member`, `personal-representative` | `member` |
| `signer_related_person_id` | If `personal-representative` | key from `related_persons`; who signed for the member | `RP-88012` |
| `authority_document_id` | If `personal-representative` | key from `documents`; power of attorney, guardianship order or equivalent | `DOC-55190` |
| `signed_form_document_id` | If available | key from `documents`; the form as signed | `DOC-55191` |
| `last_updated` | Yes | datetime this row last changed in your system | `2026-11-03T14:22:00-05:00` |
| `is_deleted` | If retracting | `true` retracts a row delivered in error; it is not how a member changes their mind | |

What the row becomes: `choice` = `opt-out` is a Consent with `provision.type` = `deny`, `share` is `permit`; `captured_at` is `Consent.dateTime`; `effective_start` is `provision.period.start`; `signer_type` decides whether `performer` points at the Patient or at the RelatedPerson; the category carries the PDex API purpose `provider-access`. The opt-out check the operation runs is [documented with the operation](../../api-reference/operations/provider-member-match.md#matching-behavior).

## payer_to_payer_opt_ins

One row per decision on the Payer-to-Payer switch. One election covers previous and concurrent payers alike.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your identifier for this decision, unique across the feed | `P2P-000342` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `choice` | Yes | `opt-in`, `withdraw` | `opt-in` |
| `scope` | If `opt-in` | `all` (everything, including data state or federal law treats as sensitive), `non-sensitive` (everything except) | `all` |
| `captured_at` | Yes | datetime the member or representative made the decision | `2026-11-03T14:22:00-05:00` |
| `effective_start` | If `opt-in` | date the consent takes effect | `2026-11-03` |
| `effective_end` | If `opt-in` | date the consent expires, set by your policy and disclosed on the form; the record cannot be built without it | `2027-12-31` |
| `signer_type` | Yes | `member`, `personal-representative` | `member` |
| `signer_related_person_id` | If `personal-representative` | key from `related_persons` | `RP-88012` |
| `authority_document_id` | If `personal-representative` | key from `documents` | `DOC-55190` |
| `signed_form_document_id` | If `opt-in` | key from `documents`; the form as signed | `DOC-55192` |
| `last_updated` | Yes | datetime this row last changed in your system | `2026-11-03T14:22:00-05:00` |
| `is_deleted` | If retracting | `true` retracts a row delivered in error; a withdrawal is a `withdraw` row, not a deletion | |

What the row becomes: an `opt-in` is an HRex Consent with `provision.type` = `permit`, `provision.period` from `effective_start` and `effective_end`, `sourceReference` pointing at the signed form, and `policy.uri` set from `scope`: `all` maps to the HRex `#sensitive` policy and `non-sensitive` to `#regular`. The names are the profile's, not a description of the data: `#sensitive` is the wider grant. A `withdraw` row closes the election from `captured_at`; no request goes out for that member afterwards, and data already received under the earlier consent is not recalled.

A `non-sensitive` election can be honoured only by a responding payer that labels its data by sensitivity. Where the responding payer cannot, the member is returned in the consent-constrained group and nothing is exchanged; Payerbox behaves the same way today when it is the responding payer, as [documented with the operation](../../api-reference/operations/bulk-member-match.md#matching-behavior). Tell the member that at election time.

## previous_coverages

One row per previous or concurrent coverage the member names when opting in. This is what identifies the payer to ask and the member to ask about; the request cannot be built without a row here.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your identifier for this coverage entry | `PCV-000342-1` |
| `consent_record_id` | Yes | `record_id` of the `opt-in` row this coverage was named on | `P2P-000342` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `payer_name` | Yes | the payer's name as the member gives it, ideally as printed on the member ID card | `Anthem Blue Cross` |
| `payer_id` | If known | the payer's identifier in the system your directory of payers uses | `00060` |
| `member_id` | If known | the member's ID with that payer | `XYZ123456789` |
| `relationship` | Yes | `self`, `spouse`, `child`, `other`; whether that coverage was in the member's own name [subscriber-relationship](https://terminology.hl7.org/CodeSystem-subscriber-relationship.html) | `self` |
| `coverage_kind` | Yes | `previous`, `concurrent` | `previous` |
| `last_updated` | Yes | datetime this row last changed in your system | `2026-11-03T14:22:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this row | |

`relationship` is the one element only the member can supply, and HRex Coverage requires it. Coverage start and end dates are deliberately absent: members rarely know them, and the match runs on demographics and identifiers.

These resources are read by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md). They are not served by Patient Access.
