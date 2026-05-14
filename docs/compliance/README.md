---
description: Two CMS final rules govern the FHIR APIs Payerbox implements. CMS-9115-F (2020) established Patient Access and Provider Directory; CMS-0057-F (2024) adds Provider Access, Payer-to-Payer, Prior Authorization, and extends Patient Access.
---

# Compliance

Payerbox's interop surface implements two CMS final rules. Each pillar API in this documentation cross-links to one of them.

| Rule | Year | What it requires | Detail |
|---|---|---|---|
| CMS-9115-F | 2020 | Patient Access API, Provider Directory API | [CMS-9115](cms-9115.md) |
| CMS-0057-F | 2024 | Provider Access API, Payer-to-Payer API, Prior Authorization API, Patient Access extension (prior-auth data) | [CMS-0057](cms-0057.md) |

CMS-0057-F also tightens prior-authorization decision timelines and introduces public metric reporting. See [Reporting](reporting.md).

## Affected payers

Both rules apply to the same payer set, with one carve-out for Provider Directory.

| Payer type | CMS-9115-F | CMS-0057-F |
|---|---|---|
| Medicare Advantage (MA) | ✓ | ✓ |
| Medicaid Fee-for-Service | ✓ | ✓ |
| Medicaid managed care plans | ✓ | ✓ |
| CHIP Fee-for-Service | ✓ | ✓ |
| CHIP managed care entities | ✓ | ✓ |
| QHP issuers on the FFE | ✓ (Patient Access only; Provider Directory exempt per 45 CFR 156.221(i)) | ✓ |

## Compliance dates at a glance

| API | Rule | Compliance date |
|---|---|---|
| Patient Access | CMS-9115-F | January 1, 2021 (in production) |
| Provider Directory | CMS-9115-F | January 1, 2021 (in production) |
| Patient Access — prior-auth data extension | CMS-0057-F | January 1, 2027 |
| Provider Access | CMS-0057-F | January 1, 2027 |
| Payer-to-Payer | CMS-0057-F | January 1, 2027 |
| Prior Authorization API | CMS-0057-F | January 1, 2027 |
| Prior-authorization decision timeframes (7-day standard / 72-hour expedited) | CMS-0057-F | January 1, 2026 |
| First annual prior-authorization metrics report | CMS-0057-F | March 31, 2026 (covering CY 2025) |

For Medicaid MCOs and CHIP MCEs, CMS-0057-F API deadlines apply to contracts with rating periods beginning on or after January 1, 2027. For QHP issuers on the FFE, they apply to the first plan year beginning on or after January 1, 2027.

## Which Payerbox doc maps to which API

| Regulated API | Payerbox doc |
|---|---|
| Patient Access | [Patient Access](../interop-apis/patient-access.md) |
| Provider Directory | [Provider Directory](../interop-apis/provider-directory.md) |
| Provider Access | [Provider Access](../interop-apis/provider-access.md) |
| Payer-to-Payer | [Payer-to-Payer](../interop-apis/payer-to-payer.md) |
| Prior Authorization API (PAS) | [PAS](../prior-auth/pas.md) |
