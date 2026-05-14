# Provider Directory

The Provider Directory API publishes the payer's in-network practitioners, organizations, locations, and services. Public read access — no authentication required. Established by CMS-9115-F.

## Regulatory anchor

| Property | Value |
|---|---|
| Rule | CMS-9115-F |
| Citations | 42 CFR 422.120 (MA), 431.70 (Medicaid FFS), 438.242(b)(6) (Medicaid MCO), 457.760 (CHIP FFS), 457.1233(d)(3) (CHIP MCO) |
| Compliance date | January 1, 2021 |
| Update cadence | Within 30 calendar days of receipt of an update |
| Authentication | None (public read) |
| Out of scope | QHP issuers on Federally Facilitated Exchanges (excluded under 9115; CMS-0057-F did not add them) |

See [Compliance / CMS-9115](../compliance/cms-9115.md).

## Implementation guide

Da Vinci PDex Plan Net STU 1.1.0. See [API Reference / Implementation Guides](../api-reference/implementation-guides.md).

## Resources

| Resource | Plan Net profile | Use |
|---|---|---|
| Practitioner | `plannet-Practitioner` | Individual provider (NPI, name, credentials, languages) |
| PractitionerRole | `plannet-PractitionerRole` | Practitioner's role at an organization (specialty, network, accepting new patients) |
| Organization | `plannet-Organization` | Payer's own organization, provider organizations |
| OrganizationAffiliation | `plannet-OrganizationAffiliation` | Parent/child organization relationships |
| Location | `plannet-Location` | Physical locations (address, hours, accessibility) |
| HealthcareService | `plannet-HealthcareService` | Services offered at a location |
| InsurancePlan | `plannet-InsurancePlan` | Plan and network identifiers (used to scope directory queries to a specific plan) |
| Endpoint | `plannet-Endpoint` | Provider's electronic endpoints (Direct address, FHIR endpoint, if any) |

MA-PD plans additionally publish pharmacy directory data through the same surface.

## Minimum data set

Per CMS-9115-F: name, address, phone, specialty. Updates within 30 days.

Recommended in practice (and by Plan Net): adding email, telehealth availability, accepted languages, accessibility features, accepted insurance, and network status.

## Common queries

```bash
# All practitioners in a specialty within a network
GET <base>/fhir/PractitionerRole?network=<network-id>&specialty=<system>|<code>

# Practitioners accepting new patients in a location
GET <base>/fhir/PractitionerRole?location.near=<lat>|<lng>|<distance>|km&new-patients=newpt

# Find an organization and its locations
GET <base>/fhir/Organization?name=<name>&_revinclude=Location:organization

# Pharmacy directory (MA-PD)
GET <base>/fhir/Organization?type=pharmacy&_revinclude=Location:organization
```

CapabilityStatement: `<base>/fhir/metadata`. See [API Reference / Capability Statement](../api-reference/capability-statement.md).

## Update workflow

The 30-day rule covers any change to: provider name, address, phone, specialty, network status, accepting-new-patients flag.

Source-of-truth for directory data is typically the payer's provider data management system (PDM). Payerbox ingests through [Run Payerbox / Connect Systems](../run-payerbox/README.md).

> TODO(engineering): document supported PDM ingestion formats (NPPES feed, payer-specific CSV, FHIR Bundle push).

## Pagination

Standard FHIR `_count` and `_offset` parameters. Default page size 50, configurable per deployment.

```bash
GET <base>/fhir/PractitionerRole?network=<network-id>&_count=100
```

The `Bundle.link[next]` element points to the next page; follow it to iterate.

## Common errors

| HTTP | OperationOutcome code | Cause |
|---|---|---|
| 400 | `invalid` | Malformed search parameter (e.g., `specialty` without a code system) |
| 410 | `expired` | Practitioner has been removed from the directory |
| 429 | `throttled` | Rate limit hit; back off per `Retry-After` |

