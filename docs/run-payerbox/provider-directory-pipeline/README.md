---
description: >-
  Publish a CMS Plan-Net provider directory for the Medicare Plan Finder:
  pipeline setup and publication configuration.
---

# MPF Provider Directory

CMS's [Medicare Plan Finder](https://www.medicare.gov/plan-compare/) (MPF) crawls one provider-directory URL per contract and contract year. Payerbox builds those directories from the FHIR engine and publishes them as static FHIR `Bundle` files through an optional module of the [FHIR App Portal](../../fhir-app-portal/README.md).

| Page | What it covers |
|---|---|
| [MPF Pipeline](provider-directory-pipeline.md) | One-time technical setup: sync client, access policy, environment variables, bucket signing, first run |
| [Configure Publications](admin-ui.md) | Day-to-day configuration in the Admin portal: contracts, contract years, InsurancePlan scope, crawler URLs |

The trigger and public endpoints are documented in the [MPF endpoint reference](../../api-reference/operations/mpf-pipeline-api.md).
