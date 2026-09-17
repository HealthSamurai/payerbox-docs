---
description: >-
  Columns for the member consent feed: the Provider Access opt-out and the
  Payer-to-Payer opt-in, mapped to the Da Vinci PDex STU 2.2.0 and HRex STU
  1.1.0 Consent profiles, plus the previous coverage a member names.
---

# Member Consent

## Datasets

A member **opts out** of [Provider Access](../../interop-apis/provider-access.md) and **opts in** to [Payer-to-Payer](../../interop-apis/payer-to-payer.md). Each decision becomes one FHIR Consent. Whoever holds the record delivers this feed.

| Dataset | Target profile |
|---|---|
| [`provider_access_opt_outs`](#provider_access_opt_outs) | [PDex Provider Consent](https://hl7.org/fhir/us/davinci-pdex/STU2.2/StructureDefinition-pdex-provider-consent.html), read by [`$provider-member-match`](../../api-reference/operations/provider-member-match.md) and by every Provider Access export |
| [`payer_to_payer_opt_ins`](#payer_to_payer_opt_ins) | [HRex Consent](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-consent.html), the opt-in Payer-to-Payer runs on |
| [`previous_coverages`](#previous_coverages) | [HRex Coverage](https://hl7.org/fhir/us/davinci-hrex/STU1.1/StructureDefinition-hrex-coverage.html): which payer to ask, and about whom |

## Data conventions

| Rule | Detail |
|---|---|
| History | A decision is never edited. A change of mind is a new row with its own `record_id` and a later `captured_at`; the latest `captured_at` per member and switch is the state in force. |
| Freshness | Within one business day of capture. Faster delivery, including event-driven, per engagement. |
| Delivery | One backfill of every decision on file, then deltas with rows new since your last successful load. |
| Keys | `record_id` is your consent system's identifier for the decision, unique across the feed. |
| References | `patient_identifier` from [`patients`](../uscdi/patient-demographics.md#patients), `signer_related_person_id` from [`related_persons`](../uscdi/patient-demographics.md#related-persons), `*_document_id` from `documents`. |
| Documents | The signed form and a representative's document of authority travel in `documents`, referenced from here by key. The opt-in cannot be built without its signed form: HRex Consent requires a source document. |
| Dates | `date` columns are `YYYY-MM-DD`. `datetime` columns are ISO 8601 with a timezone offset. |

## provider_access_opt_outs

One row per decision on the Provider Access switch.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your identifier for this decision | `PAC-000117` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `choice` | Yes | `opt-out`, `share` (opt back in) | `opt-out` |
| `captured_at` | Yes | datetime the decision was made | `2026-11-03T14:22:00-05:00` |
| `effective_start` | Yes | date the decision takes effect | `2026-11-03` |
| `signer_type` | Yes | `member`, `personal-representative` | `member` |
| `signer_related_person_id` | If `personal-representative` | key from `related_persons` | `RP-88012` |
| `authority_document_id` | If `personal-representative` | key from `documents`; power of attorney, guardianship order or equivalent | `DOC-55190` |
| `signed_form_document_id` | If available | key from `documents` | `DOC-55191` |
| `last_updated` | Yes | datetime this row last changed in your system | `2026-11-03T14:22:00-05:00` |
| `is_deleted` | If retracting | `true` retracts a row delivered in error | |

`opt-out` becomes `provision.type` = `deny`, `share` becomes `permit`. `captured_at` is `Consent.dateTime`, `effective_start` is `provision.period.start`, `signer_type` decides whether `performer` is the Patient or the RelatedPerson, and the category carries the PDex API purpose `provider-access`. The check the operation runs is [documented with the operation](../../api-reference/operations/provider-member-match.md#matching-behavior).

## payer_to_payer_opt_ins

One row per decision on the Payer-to-Payer switch. One election covers previous and concurrent payers.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your identifier for this decision | `P2P-000342` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `choice` | Yes | `opt-in`, `withdraw` | `opt-in` |
| `scope` | If `opt-in` | `all`, `non-sensitive` (everything except what state or federal law treats as sensitive) | `all` |
| `captured_at` | Yes | datetime the decision was made | `2026-11-03T14:22:00-05:00` |
| `effective_start` | If `opt-in` | date the consent takes effect | `2026-11-03` |
| `effective_end` | If `opt-in` | date the consent expires, set by your policy; the record cannot be built without it | `2027-12-31` |
| `signer_type` | Yes | `member`, `personal-representative` | `member` |
| `signer_related_person_id` | If `personal-representative` | key from `related_persons` | `RP-88012` |
| `authority_document_id` | If `personal-representative` | key from `documents` | `DOC-55190` |
| `signed_form_document_id` | If `opt-in` | key from `documents` | `DOC-55192` |
| `last_updated` | Yes | datetime this row last changed in your system | `2026-11-03T14:22:00-05:00` |
| `is_deleted` | If retracting | `true` retracts a row delivered in error; a withdrawal is a `withdraw` row | |

An `opt-in` becomes an HRex Consent with `provision.type` = `permit`, `provision.period` from `effective_start` and `effective_end`, `sourceReference` to the signed form, and `policy.uri` from `scope`: `all` maps to `#sensitive`, `non-sensitive` to `#regular`. The names are the profile's: `#sensitive` is the wider grant. A `withdraw` row closes the election from `captured_at`.

## previous_coverages

One row per previous or concurrent coverage the member names when opting in.

| Column | Required | Format / values | Example |
|---|---|---|---|
| `record_id` | Yes | your identifier for this entry | `PCV-000342-1` |
| `consent_record_id` | Yes | `record_id` of the `opt-in` row it was named on | `P2P-000342` |
| `patient_identifier` | Yes | patient key from `patients` | `MRN-4471903` |
| `payer_name` | Yes | as the member gives it, ideally as printed on the member ID card | `Anthem Blue Cross` |
| `payer_id` | If known | the payer's identifier in the payer directory you use | `00060` |
| `member_id` | If known | the member's ID with that payer | `XYZ123456789` |
| `relationship` | Yes | `self`, `spouse`, `child`, `other`; whether the coverage was in the member's own name [subscriber-relationship](https://terminology.hl7.org/CodeSystem-subscriber-relationship.html) | `self` |
| `coverage_kind` | Yes | `previous`, `concurrent` | `previous` |
| `last_updated` | Yes | datetime this row last changed in your system | `2026-11-03T14:22:00-05:00` |
| `is_deleted` | If retracting | `true` retracts this row | |

`relationship` is required by HRex Coverage and only the member can supply it. No coverage dates: the match runs on demographics and identifiers.

These resources are read by [Provider Access](../../interop-apis/provider-access.md) and [Payer-to-Payer](../../interop-apis/payer-to-payer.md).
