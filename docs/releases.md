---
description: "Notable changes across Payerbox: the Interop APIs, the Prior Auth (ePA) APIs, and the FHIR App Portal."
---

# Releases

This page tracks notable changes across Payerbox: the Interop APIs, the Prior Auth (ePA) APIs, and the FHIR App Portal. Releases are listed newest first. The apps run on an Aidbox FHIR server; each component heading links to its image on Docker Hub.

## June 2026 (`2606`)

This release adds the `payerbox` umbrella Helm chart, which deploys the full Payerbox stack (the portals, Interop APIs, Prior Auth, and Aidbox) to Kubernetes in one release. See [Deploy](run-payerbox/deploy.md).

### Interop APIs [`2606`](https://hub.docker.com/r/healthsamurai/interop)

**Payer-to-Payer**

- [`$bulk-member-match`](api-reference/operations/bulk-member-match.md) authenticates the calling payer via UDAP (B2B). See [Authentication](api-reference/authentication.md).
- [`$davinci-data-export`](api-reference/operations/davinci-data-export.md) adds the `payertopayer` export type for Payer-to-Payer exchange.

**Provider Directory**

- The CMS Medicare Plan Finder (MPF) provider-directory pipeline is optimized: directory scope filtering now runs server-side in the `$export` query, and export output is gzip-compressed. See the [MPF Pipeline](run-payerbox/provider-directory-pipeline.md); a runnable reference implementation is now public in the [Aidbox examples](https://github.com/Aidbox/examples/tree/main/aidbox-features/medicare-plan-finder).

### Prior Auth (ePA) APIs [`2606`](https://hub.docker.com/r/healthsamurai/prior-auth)

**Implementation Guide versions**

- PAS is upgraded to Da Vinci STU `2.1.0`, now the default. STU `2.0.1` remains selectable via the `PAS_IG_VERSION` environment variable. See [PAS](prior-auth/pas.md).
- CRD and DTR are upgraded to `2.1.0`. See [CRD](prior-auth/crd.md) and [DTR](prior-auth/dtr/README.md).

**PAS**

- [`Claim/$submit`](api-reference/operations/claim-submit.md) adds a ClaimResponse reference extension on the submitted Claim, linking it to the resulting ClaimResponse.
- `Claim/$submit` is idempotent on `Claim.identifier`: resubmitting a Claim whose identifier already exists returns the existing ClaimResponse and does not create a duplicate prior authorization.
- Under PAS 2.1.0, an updated prior authorization keeps a single ClaimResponse on the original Claim; `Claim/$submit` and [`Claim/$inquire`](api-reference/operations/claim-inquire.md) return it for any Claim in the update chain.

**CRD**

- When the CRD decision service returns an error, Payerbox relays its HTTP status and surfaces the original error in the returned `OperationOutcome`. See [CRD](prior-auth/crd.md).

### FHIR App Portal [`2606`](https://hub.docker.com/r/healthsamurai/fhir-app-portal)

**Developer Portal**

- The Developer Portal can now register a backend (bulk data) service that uses a client secret (client-credentials), in addition to a JWKS URI. See [Developer Portal](fhir-app-portal/developer-portal.md).

**Admin Portal**

- Redesigned the app review card in the admin interface.

## May 2026 (`2605`)

### Interop APIs [`2605`](https://hub.docker.com/r/healthsamurai/interop)

**Provider Access**

- Added the [`$provider-member-match`](api-reference/operations/provider-member-match.md) operation: asynchronous demographic matching with treatment attestation and opt-out consent checks. See [Provider Access](interop-apis/provider-access.md).
- Added the [`$davinci-data-export`](api-reference/operations/davinci-data-export.md) operation: an asynchronous FHIR Bulk Data export over a member `Group`, used by Provider Access.

**Payer-to-Payer**

- Added the [`$bulk-member-match`](api-reference/operations/bulk-member-match.md) operation: asynchronous demographic matching with mandatory per-member HRex consent opt-in, returning matched, non-matched, and consent-constrained result buckets. See [Payer-to-Payer](interop-apis/payer-to-payer.md).

**Provider Directory**

- Added a CMS Medicare Plan Finder (MPF) provider-directory export (opt-in per deployment): builds the MPF provider feed and publishes a public index URL per Medicare Advantage contract and reporting year, designed to run on a daily schedule.

### Prior Auth (ePA) APIs [`2605`](https://hub.docker.com/r/healthsamurai/prior-auth)

**CDS Hooks**

- Added the [CDS Services discovery](api-reference/operations/cds-services-discovery.md) endpoint and the [`order-sign`](api-reference/operations/cds-hook-order-sign.md), [`order-select`](api-reference/operations/cds-hook-order-select.md), [`order-dispatch`](api-reference/operations/cds-hook-order-dispatch.md), and [`appointment-book`](api-reference/operations/cds-hook-appointment-book.md) hooks.
- Hooks can be enabled individually via the `CDS_ENABLED_HOOKS` setting.

**CRD**

- Custom-response mode (`CDS_DECISION_SERVICE_CUSTOM_RESPONSE`): the decision service returns simplified per-order decisions and Payerbox assembles the CDS Hooks–conformant response — a CRD STU2 `systemActions` array the EHR applies automatically, with cards kept informational.
- Required request headers can be enforced via `CDS_REQUIRED_HEADERS`. See [CRD](prior-auth/crd.md).

**DTR**

- DTR delivers coverage questionnaires and rules to the EHR or the SMART App via the [`$questionnaire-package`](prior-auth/dtr/aidbox-questionnaire-package.md) operation, with client-side FHIRPath prefill. See [DTR](prior-auth/dtr/README.md).

**PAS**

- Added the [`Claim/$submit`](api-reference/operations/claim-submit.md) (initial prior-authorization submission) and [`Claim/$inquire`](api-reference/operations/claim-inquire.md) (status check) operations. See [PAS](prior-auth/pas.md).
- Added the [`$submit-attachment`](api-reference/operations/submit-attachment.md) operation (Da Vinci CDeX) for attaching supporting clinical documents.
- Added asynchronous result delivery: completed decisions are delivered to the EHR as a PAS Response Bundle via a topic-based FHIR Subscription.
- When additional documentation is submitted via `$submit-attachment`, the prior authorization is re-queued for review (ClaimResponse disposition "Pending Review").

### FHIR App Portal [`2605`](https://hub.docker.com/r/healthsamurai/fhir-app-portal)

**Developer Portal**

- Register SMART apps with configurable scopes and supported search parameters, including DSI (decision-support intervention) transparency fields. See [Developer Portal](fhir-app-portal/developer-portal.md).
- Register backend (system) services for the bulk data APIs; these clients authenticate with a customer-supplied `jwks_uri` (JWKS URL) rather than a client secret. See [Authentication](api-reference/authentication.md).

**Admin Portal**

- Enroll and manage members (patients) from the portal via a verification-email signup flow. See [Admin Portal](fhir-app-portal/admin-portal.md).
- Manage admin users: create, delete, reset passwords, and disable 2FA.
- Audit-event log viewer with search and detail, plus a PHI Access viewer scoped to SMART-app activity.
- Configurable portal branding and theming, configurable Terms of Service and Privacy Policy, configurable email provider, and single- and multi-organization support.

**FHIR App Gallery**

- Discover, launch, and test registered SMART apps. See [FHIR App Gallery](fhir-app-portal/fhir-app-gallery.md).
- Patients can review their connected apps and revoke access.

**Security & Authentication**

- Multi-tenant deployments: host multiple organizations on one instance with per-organization data isolation, built on Aidbox OrgBAC. Org-scoped admins manage only their own organization.
- Role-based access control: admin, developer, and patient roles gate the Admin Portal, Developer Portal, and app gallery.
