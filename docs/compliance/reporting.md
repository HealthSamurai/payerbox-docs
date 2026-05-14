# Reporting

CMS-0057-F introduces two distinct reporting obligations: one annual report to CMS for Patient Access API usage, and one annual public posting on the payer's website for prior authorization metrics.

## Patient Access API usage metrics

Annual report to CMS. Established by 42 CFR 422.119(f) and parallels in 431.60(f), 438.62(b)(1)(ii), 457.730(f), 457.1233(d)(2), 45 CFR 156.221(f).

| Property | Value |
|---|---|
| First report | 2026, covering CY 2025 |
| Cadence | Annual |
| Submitted to | CMS, through the entity's existing reporting channel (HPMS for MA, state Medicaid / CHIP reporting paths, FFE QHP application) |
| Audience | CMS (not public) |
| Scope | All impacted payers |

Metrics include the number of unique enrollees whose data was transferred to a third-party app via the Patient Access API, and the number of unique enrollees with multiple transfers. Exact field set is in the CMS Patient Access API FAQ.

## Prior Authorization public metrics

Annual public posting on the payer's website. Established by 42 CFR 422.122(c) and parallels in 431.80(c), 438.210, 457.1230, 45 CFR 156.223.

| Property | Value |
|---|---|
| First posting | March 31, 2026, covering CY 2025 |
| Cadence | Annual, by March 31 each year |
| Posted on | Payer's public website |
| Audience | Public |
| Scope | All impacted payers; reported at contract level (MA), state level (Medicaid / CHIP FFS), plan level (Medicaid / CHIP managed care), or issuer level (QHP on FFE) |

### Required metrics

| Metric | Definition |
|---|---|
| List of items and services requiring prior authorization | Full enumeration, grouped by category |
| Percentage of standard PAs approved | Standard requests in CY, approved / total |
| Percentage of standard PAs denied | Standard requests in CY, denied / total |
| Percentage of expedited PAs approved | Expedited requests in CY, approved / total |
| Percentage of expedited PAs denied | Expedited requests in CY, denied / total |
| Percentage of PAs approved after appeal | Initially denied, approved on appeal / total denied |
| Average time from submission to decision (standard) | Hours or days |
| Median time from submission to decision (standard) | Hours or days |
| Average time from submission to decision (expedited) | Hours or days |
| Median time from submission to decision (expedited) | Hours or days |

Drugs are excluded from these metrics — drug PAs are out of scope of CMS-0057-F.

## Extracting reporting data from Payerbox

The data feeding both reports lives in the running Payerbox deployment. Extraction relies on:

- **Patient Access usage:** audit logs (BALP AuditEvent resources) for SMART App Launch token grants and FHIR endpoint reads. See [Run Payerbox / Maintain / Observability](../run-payerbox/maintain/observability.md).
- **PA metrics:** Claim and ClaimResponse resources in the PAS API surface. Decision timestamps come from Claim.created and ClaimResponse.created; outcome from ClaimResponse.outcome; appeal status from Task resources linked to the Claim.

> TODO(engineering): confirm extraction queries and finalize the report-generation pipeline.

## References

- [Federal Register 89 FR 8758 — CMS-0057-F final rule](https://www.federalregister.gov/documents/2024/02/08/2024-02890)
- [CMS Patient Access API FAQ](https://www.cms.gov/priorities/burden-reduction/overview/interoperability/frequently-asked-questions/patient-access-api)
- [CMS Prior Authorization API FAQ](https://www.cms.gov/priorities/burden-reduction/overview/interoperability/frequently-asked-questions/prior-authorization-api)
- [CMS-0057-F fact sheet](https://www.cms.gov/newsroom/fact-sheets/cms-interoperability-prior-authorization-final-rule-cms-0057-f)
