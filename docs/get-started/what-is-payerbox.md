---
description: Payerbox is a turnkey CMS-0057 compliance platform for payers -  four mandated FHIR APIs pre-built on Da Vinci IGs.
---

# What is Payerbox

Payerbox is a turnkey [CMS-0057](../compliance/cms-0057.md) compliance platform for health plans. All four mandated FHIR APIs — [Patient Access](../interop-apis/patient-access.md), [Provider Access](../interop-apis/provider-access.md), [Prior Authorization](../prior-auth/README.md), and [Payer-to-Payer](../interop-apis/payer-to-payer.md) — ship pre-built on Da Vinci Implementation Guides. Your data stays under your control: deploy managed or self-hosted, connect existing claims, clinical, and eligibility systems without rip-and-replace, and expose compliant APIs alongside the systems you already run.

{% hint style="info" %}
CMS-0057-F full enforcement begins **January 1, 2027** for Medicare Advantage, Medicaid, CHIP, and QHP issuers.
{% endhint %}

## Four mandated FHIR APIs

CMS-0057 requires four standardized FHIR APIs covering prior authorization, member data access, provider data sharing, and payer-to-payer exchange.

| API | What it covers | Payerbox docs |
|---|---|---|
| **Prior Authorization** | FHIR Prior Auth for eligibility checks, required documentation, and electronic decisions (7-day standard, 72-hour expedited) | [Prior Auth (ePA) APIs](../prior-auth/README.md) — Da Vinci CRD, DTR, and PAS |
| **Patient Access** | Member-facing FHIR APIs for claims, encounters, USCDI clinical data, and prior auth status, updated within one business day | [Patient Access](../interop-apis/patient-access.md) |
| **Provider Access** | Bulk FHIR so in-network providers can pull claims, clinical, and prior auth data for attributed patients, with opt-out | [Provider Access](../interop-apis/provider-access.md) |
| **Payer-to-Payer** | FHIR data exchange when members switch plans — opt-in, member match against the prior payer, and transfer of up to five years of claims, clinical, and prior auth history | [Payer-to-Payer](../interop-apis/payer-to-payer.md) |

Payerbox implements these APIs on Da Vinci IGs including CARIN Blue Button, PDex, PAS, and US Core.

## How Payerbox fits your stack

Payerbox connects alongside your existing systems — claims, formulary/PBM, clinical data, eligibility, and UM/prior auth — and exposes CMS-0057-F compliant FHIR APIs to members, providers, and other payers. No dedicated FHIR team is required to stand up the compliance surface; integration focuses on mapping your source data into FHIR R4 and configuring connectors, consent, and member matching.

FHIR R4 resources are stored in PostgreSQL and are queryable with SQL for analytics and downstream applications. See [Architecture](../run-payerbox/architecture.md) for deployment topology and component boundaries.

## Platform capabilities

### Production-ready APIs

Patient Access, Prior Authorization, Provider Access, and Payer-to-Payer FHIR APIs are pre-built and aligned with CMS-0057 guidance, including SMART on FHIR app launch where the IGs require it (for example, the [FHIR App Portal](../fhir-app-portal/README.md) for developer and member-facing experiences).

### Data connectors

Bidirectional adapters convert between FHIR R4 and common payer formats: X12 278/275, C-CDA, HL7v2, CSV, and custom interfaces.

### Security

SMART on FHIR, OAuth 2.0, OIDC, and mTLS secure FHIR APIs and integrations end-to-end. See [Authentication](../api-reference/authentication.md).

### Member portal and consent

Configurable member portal and consent flows for Patient, Provider, and Payer-to-Payer APIs, with opt-in, opt-out, and revocation management.

### Compliance evidence

Immutable audit logs capture decision timestamps, operational metrics, and consent events to support CMS reporting and internal audits. See [Reporting](../compliance/reporting.md).

### Member matching and terminology

Master data management improves member matching across plans, data sources, and payer-to-payer exchanges. A FHIR terminology layer loads and validates CMS-aligned code systems (ICD-10, CPT/HCPCS, RxNorm, LOINC, and related value sets from Da Vinci IGs).

### Deployment

Run on AWS, Azure, GCP, on-premises, or hybrid — Kubernetes-native, with managed and marketplace options. See [Deploy](../run-payerbox/deploy.md).

## Beyond compliance

Most compliance solutions treat FHIR data as an audit-only artifact. Payerbox stores the same data in PostgreSQL and exposes it through standard FHIR and SQL interfaces, so you can reuse it without a separate warehouse or ETL pipeline:

- **Applications** — member portals, internal tools, care management apps, and third-party integrations on the same APIs and data store
- **Risk adjustment and Stars** — US Core–structured clinical and claims data queryable for HCC models and HEDIS measures
- **Care management** — longitudinal records, including payer-to-payer history from prior plans, for coordination and population health
- **AI and automation** — structured FHIR ready for ML pipelines, prior auth decision support, and analytics
- **Provider collaboration** — attribution lists and bulk exports from Provider Access for value-based care and network analytics
- **Future regulations** — new Da Vinci IGs and exchange requirements land as configuration updates on the platform you already operate

## Next steps

{% content-ref url="quickstart-run-locally.md" %}
[Quickstart: Run locally](quickstart-run-locally.md)
{% endcontent-ref %}

{% content-ref url="../run-payerbox/README.md" %}
[Run Payerbox](../run-payerbox/README.md)
{% endcontent-ref %}

{% content-ref url="../compliance/cms-0057.md" %}
[CMS-0057](../compliance/cms-0057.md)
{% endcontent-ref %}

{% content-ref url="../interop-apis/README.md" %}
[Interop APIs](../interop-apis/README.md)
{% endcontent-ref %}

{% content-ref url="../fhir-app-portal/README.md" %}
[FHIR App Portal](../fhir-app-portal/README.md)
{% endcontent-ref %}
