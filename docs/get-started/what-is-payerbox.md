# What is Payerbox

Payerbox is the **CMS-0057-F and CMS-9115-F compliance layer** for a US health plan. It sits between the payer's internal systems (claims, clinical data, eligibility, UM, auth) and the external consumers regulated under both rules — plan members through third-party apps, in-network providers, peer payers receiving a member's history.

![Payerbox sits between payer internal systems (claims, clinical, eligibility, auth, UM) and Patient Access (members) plus Provider Access (providers) as the central CMS-0057-F layer. Built on PostgreSQL, with downstream use cases: risk adjustment, BI, AI/automation, TEFCA, applications, care management.](../../assets/get-started/payerbox-ecosystem.png)

Payerbox publishes the four FHIR APIs the rules require, hosts the portals members and developers use, runs the Da Vinci ePA stack, and stores the FHIR data its operations produce or expose.

## What it provides

| Capability | API surface | Anchored in |
|---|---|---|
| Members access their data through a third-party app | Patient Access API | CMS-9115-F (extended by CMS-0057-F) |
| In-network providers pull attributed-member data | Provider Access API | CMS-0057-F |
| New payer pulls history from a member's prior payer | Payer-to-Payer API | CMS-0057-F (replaces 9115's suspended P2P) |
| Public read of the network directory | Provider Directory API | CMS-9115-F |
| Discover coverage requirements at point of order | CRD (CDS Hooks) | CMS-0057-F (Da Vinci CRD recommended) |
| Collect required documentation for a PA | DTR | CMS-0057-F (Da Vinci DTR recommended) |
| Submit a prior authorization and receive the response | PAS | CMS-0057-F (Da Vinci PAS recommended) |
| Annual Patient Access usage report to CMS, public PA metrics on payer's site | Reporting | CMS-0057-F |

## How payer internal systems connect

| Source system | Transport into Payerbox |
|---|---|
| Claims and clinical data warehouse | ETL pipeline (FHIR Bundle ingest or scheduled batch) |
| Eligibility | X12 270/271 or direct FHIR Coverage push |
| Auth server | OIDC / SAML federation for member sign-in into the FHIR App Portal |
| UM system | X12 278 over the Prior Authorization integration (bidirectional) |

See [Run Payerbox / Connect Systems](../run-payerbox/README.md) for adapter details.

## What's built on top

The same FHIR data Payerbox publishes externally is available to the payer's own downstream uses through PostgreSQL or the same FHIR APIs:

- Risk Adjustment and Stars analytics
- AI / automation pipelines
- TEFCA queries
- BI and reporting (claims analytics, member dashboards)
- Care management apps
- Custom internal applications

Payerbox does not build these capabilities itself; it provides the FHIR foundation they consume.

## Compliance dates

Two key deadlines:

- **January 1, 2026** — PA decision timeframes (72h expedited / 7d standard); first public PA metrics report due March 31, 2026.
- **January 1, 2027** — Provider Access, Payer-to-Payer, and Prior Authorization APIs go live; Patient Access adds prior-auth data.

Full timeline: [Compliance / CMS-0057](../compliance/cms-0057.md#compliance-dates-summary).

## Implementation guides

Payerbox preconfigures the CMS-recommended IGs (FHIR R4, US Core, CARIN Blue Button, SMART App Launch, Bulk Data, Da Vinci PDex / Plan Net / CRD / DTR / PAS, CDS Hooks). Full version matrix: [API Reference / Implementation Guides](../api-reference/implementation-guides.md).

## What's not included

- **Drug prior authorizations.** Excluded from the CMS-0057-F Prior Auth API by regulation. CMS-0062-P (proposed) may bring drug PAs into scope.
- **The UM decision itself.** Payerbox accepts PAS submissions and routes them to the payer's existing UM system. The authoritative authorization decision lives in UM.
- **The CRD coverage rules.** Payerbox forwards CDS Hook payloads to an external decision service the payer configures.
- **Identity provider.** Payerbox integrates with the payer's existing IdP via OIDC / SAML.
- **Hospital ADT notifications.** A provider-side obligation under CMS-9115-F (42 CFR 482.24(d) and parallels), not a payer obligation.

## Where to go next

| Role | Where to start |
|---|---|
| IT operator | [Quickstart: Run locally](quickstart-run-locally.md) → [Run Payerbox](../run-payerbox/README.md) |
| Third-party app developer | [Demo: FHIR App Portal](demo/fhir-app-portal.md) → [FHIR App Portal / Developer Portal](../fhir-app-portal/developer-portal.md) → [Interop APIs / Patient Access](../interop-apis/patient-access.md) |
| Provider / EHR integrator | [Interop APIs / Provider Access](../interop-apis/provider-access.md) and [Prior Auth (ePA) APIs](../prior-auth/README.md) |
| Compliance officer | [Compliance](../compliance/README.md) |
