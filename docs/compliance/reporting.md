---
description: CMS-0057-F imposes two annual reporting obligations on impacted payers — public prior-authorization metrics on the payer's website, and confidential Patient Access API metrics to CMS. Both first due March 31, 2026 (covering CY 2025).
---

# Reporting

[CMS-0057-F](cms-0057.md) imposes two distinct annual reporting obligations on impacted payers. Both have the same first-report deadline: **March 31, 2026** (covering CY 2025).

## Public prior-authorization metrics

Posted on a publicly accessible page of the payer's website, no login. Excludes drugs.

| Property | Value |
|---|---|
| First report due | March 31, 2026 |
| First report covers | Calendar year 2025 |
| Cadence | Annually, by March 31, covering the prior calendar year |
| Where | Publicly accessible page on the payer's own website |
| Drugs | Excluded |

### Required metrics

Aggregated across all items and services the payer requires prior authorization for:

| Metric | Description |
|---|---|
| List of items and services requiring prior authorization | Publicly enumerated, excluding drugs |
| Percent approved | Of all prior-authorization requests submitted |
| Percent denied | Of all prior-authorization requests submitted |
| Percent approved after appeal | Of denials that the member or provider appealed |
| Average decision time — standard requests | From submission to determination |
| Median decision time — standard requests | From submission to determination |
| Average decision time — expedited requests | From submission to determination |
| Median decision time — expedited requests | From submission to determination |

## Confidential Patient Access API metrics

Reported privately to CMS as aggregated, de-identified data — not posted publicly.

| Property | Value |
|---|---|
| First report due | March 31, 2026 |
| First report covers | Calendar year 2025 |
| Cadence | Annually |
| Where | To CMS, in aggregated de-identified form |

### Required metrics

| Metric | Description |
|---|---|
| Unique patients whose data was transferred via the Patient Access API | To a health app designated by the patient |
| Unique patients whose data was transferred more than once | To a health app designated by the patient |

## Who reports

| Payer type | Reports? |
|---|---|
| Medicare Advantage | ✓ |
| Medicaid Fee-for-Service | ✓ |
| Medicaid managed care plans | ✓ |
| CHIP Fee-for-Service | ✓ |
| CHIP managed care entities | ✓ |
| QHP issuers on the FFE | ✓ |

## What Payerbox provides

Payerbox stores prior-authorization request and decision history through the [PAS](../prior-auth/pas.md) flow as `Claim` (request), `ClaimResponse` (decision), and `Task` (status) resources. Aggregating those into the metric set above is a payer-side reporting query — Payerbox does not publish the metrics for the payer, but holds the data needed to compute them.

## References

- [CMS — Fact Sheet: CMS-0057-F](https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f)
- [CMS — Prior Authorization API FAQ](https://www.cms.gov/priorities/burden-reduction/overview/interoperability/frequently-asked-questions/prior-authorization-api)
