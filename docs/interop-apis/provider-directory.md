---
description: Public, unauthenticated FHIR API exposing contracted providers, pharmacies, networks, and plans. Conformant to the Da Vinci PDex Plan-Net IG.
---

# Provider Directory API

The [Da Vinci PDex Plan-Net IG](https://hl7.org/fhir/us/davinci-pdex-plan-net/) profiles a payer's network of contracted providers, pharmacies, organizations, locations, and plans as FHIR resources so members and third-party apps can query them without an account. Required under CMS-9115-F since January 1, 2021; CMS-0057-F did not change it. See [Compliance / CMS-9115](../compliance/cms-9115.md) for citations and SLAs.

## Caller and auth

| Property | Value |
|---|---|
| Caller | Public — member portals, app developers, CMS Lookup tools, aggregators |
| Authentication | None for end-users; payer may issue API keys for rate-limiting |
| Base URL | `<base>/fhir` |
| CapabilityStatement | `<base>/fhir/metadata` |

Unauthenticated `GET` is permitted on `Practitioner`, `PractitionerRole`, `Organization`, `Location`, and `HealthcareService`. All other interactions require authentication.

## Resources and profiles

Plan-Net 1.1.0 defines nine profiles. Payerbox ships seed bundles shaped against them; the IG package can be loaded to turn on profile validation.

| FHIR resource | Plan-Net profile | Use |
|---|---|---|
| `Organization` (type=`prov`) | [plannet-Organization](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Organization) | Hospitals, clinics, group practices |
| `Organization` (type=`ntwk`) | [plannet-Network](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Network) | Named provider networks (HMO, PPO, Medicaid, etc.) |
| `OrganizationAffiliation` | [plannet-OrganizationAffiliation](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-OrganizationAffiliation) | Org-to-network and org-to-org relationships |
| `Practitioner` | [plannet-Practitioner](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Practitioner) | Individual clinicians; NPI, qualifications, languages |
| `PractitionerRole` | [plannet-PractitionerRole](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-PractitionerRole) | Specialty, location, network, accepting-new-patients, PCP flag |
| `Location` | [plannet-Location](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Location) | Practice sites; accessibility, geo position |
| `HealthcareService` | [plannet-HealthcareService](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-HealthcareService) | Services offered at a location |
| `InsurancePlan` | [plannet-InsurancePlan](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-InsurancePlan) | Plan name, type, coverage area, network references |
| `Endpoint` | [plannet-Endpoint](http://hl7.org/fhir/us/davinci-pdex-plan-net/StructureDefinition/plannet-Endpoint) | Technical endpoints associated with an organization |

## Data elements

| Element | Carrier |
|---|---|
| Provider name | `Practitioner.name` / `Organization.name` |
| Address | `Location.address` |
| Phone number | `PractitionerRole.telecom` / `Location.telecom` |
| Specialty | `PractitionerRole.specialty` (NUCC) |
| Accepting new patients | `newpatients` extension |
| Accessibility (ADA, telehealth, etc.) | `accessibility` extension |
| Languages spoken | `Practitioner.communication` |
| Primary care provider flag | `primary-care-provider` extension |
| Network membership | `network-reference` extension |
| Board certification | ABMS qualification |

## Pharmacy directory (MA-PD)

Medicare Advantage organizations offering MA-PD also publish pharmacy data through the same API: pharmacy name, address, phone, network pharmacy count, and pharmacy type (retail, mail-order, LTC). Plan-Net 1.1.0 does not define a dedicated pharmacy profile — pharmacies are modeled as `Organization` plus `HealthcareService` with the pharmacy type in `category`.

## Search examples

Mapped to Plan-Net's canonical [use cases](https://hl7.org/fhir/us/davinci-pdex-plan-net/background.html). All FHIR R4 search semantics apply; Plan-Net adds the search parameters used below.

### Find a provider by specialty in a member's network

A member needs an in-network cardiologist. Filter `PractitionerRole` by specialty (NUCC code) and network reference; `_include` the Practitioner and Location to get the full record back in one Bundle.

```bash
GET <base>/fhir/PractitionerRole
  ?specialty=207RC0000X
  &network=Organization/<network-id>
  &_include=PractitionerRole:practitioner
  &_include=PractitionerRole:location
```

Specialty accepts either a NUCC code or free text via the `:text` modifier (`specialty:text=cardiology`).

### Find which insurance plans an organization accepts

Answer "does this practice accept my plan?" via `OrganizationAffiliation`: query affiliations where the practice is the participating organization, then resolve the network to its `InsurancePlan`.

```bash
GET <base>/fhir/OrganizationAffiliation
  ?participating-organization=Organization/<org-id>
  &_include=OrganizationAffiliation:network
```

### Discover an organization's electronic endpoints

For data exchange (FHIR server URL, Direct address, IHE endpoint) belonging to a given Organization:

```bash
GET <base>/fhir/Endpoint?organization=Organization/<org-id>
```

### Find an individual or organization by name

When the caller just needs contact info — no electronic endpoint required:

```bash
GET <base>/fhir/Practitioner?name=Smith&_include=*

GET <base>/fhir/Organization?name=Acme&address-city=Boston
```

### Geographic search ("near me")

`Location.near` is supported for radius queries (coordinate + distance):

```bash
GET <base>/fhir/PractitionerRole
  ?specialty=207RC0000X
  &location.near=<lat>|<lon>|<radius>|[mi_us]
  &_include=PractitionerRole:practitioner
  &_include=PractitionerRole:location
```

## Bulk download

CMS recommends — but does not mandate — periodic full-directory downloads alongside REST search. Payerbox supports FHIR Bulk Data system-level `$export` with `_type=Practitioner,PractitionerRole,Organization,Location,HealthcareService` returning NDJSON, suitable for nightly snapshots a CDN or third party can mirror.

## What Payerbox covers

- Plan-Net IG preconfigured.
- Public unauthenticated `GET` on the Plan-Net directory resource types (`Practitioner`, `PractitionerRole`, `Organization`, `Location`, `HealthcareService`); everything else stays authenticated.
- `Location.near` geographic search.
- FHIR Bulk Data `$export` for periodic directory snapshots.
